"use server";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { contacts } from "../../../../../drizzle/schema";
import { insertAddress } from "./address";
import { getIdBySlug } from "./getslug";
import { Address, contact, Merchant } from "./types";

async function updateContactRelations(
  contact: contact,
  id_address: number | null,
  id_merchant: number,
  slug_merchant: string,
  existingId: number
) {
  try {
    await db
      .update(contacts)
      .set({
        name: contact.name || "",
        idDocument: contact.documentId || "",
        email: contact.email || "",
        areaCode: contact.areaCode || "",
        number: contact.number || "",
        phoneType: contact.phoneType || "",
        idAddress: id_address || null,
        birthDate: contact.birthDate
          ? new Date(contact.birthDate).toISOString()
          : null,
        mothersName: contact.mothersName || "",
        isPartnerContact: contact.isPartnerContact,
        isPep: contact.isPep,
        idMerchant: id_merchant,
        slugMerchant: slug_merchant,
        icNumber: contact.icNumber || "",
        icDateIssuance: contact.icDateIssuance
          ? new Date(contact.icDateIssuance).toISOString()
          : null,
        icDispatcher: contact.icDispatcher || "",
        icFederativeUnit: contact.icFederativeUnit || "",
      })
      .where(eq(contacts.id, existingId));

    console.log(`Contact with ID ${existingId} updated successfully.`);
    return existingId;
  } catch (error) {
    console.error(`Error updating contact with ID ${existingId}:`, error);
    throw error;
  }
}

export async function insertContact(
  contact: contact,
  merchant: Merchant,
  address: Address | undefined
) {
  let id_address = null;
  try {
    if (address) {
      id_address = await insertAddress(address);
    }

    const slug_merchant = merchant.slug;
    if (slug_merchant === null) {
      throw new Error("Slug Merchant is null");
    }

    const id_merchant = await getIdBySlug("merchants", merchant.slug);
    if (id_merchant === null) {
      throw new Error("Merchant ID is null");
    }

    // Verifica se o contato já existe
    const existingContacts = await db
      .select()
      .from(contacts)
      .where(eq(contacts.slugMerchant, slug_merchant));

    if (existingContacts.length > 0 && contact.documentId) {
      // Procura pelo mesmo documento
      const matchingContact = existingContacts.find(
        (c) => c.idDocument === contact.documentId
      );

      if (matchingContact) {
        console.log(
          `Contact with document ${contact.documentId} already exists. Updating...`
        );
        await updateContactRelations(
          contact,
          id_address,
          id_merchant,
          slug_merchant,
          matchingContact.id
        );
        return;
      }
    }

    // Se não existe ou não encontrou pelo documento, insere um novo
    await insertContactRelations(
      contact,
      id_address,
      id_merchant,
      slug_merchant
    );
  } catch (error) {
    console.error("Error inserting contact:", error);
  }
}

async function insertContactRelations(
  contact: contact,
  id_address: number | null,
  id_merchant: number,
  slug_merchant: string
) {
  try {
    const result = await db
      .insert(contacts)
      .values({
        name: contact.name || "",
        idDocument: contact.documentId || "",
        email: contact.email || "",
        areaCode: contact.areaCode || "",
        number: contact.number || "",
        phoneType: contact.phoneType || "",
        idAddress: id_address || null,
        birthDate: contact.birthDate
          ? new Date(contact.birthDate).toISOString()
          : null,
        mothersName: contact.mothersName || "",
        isPartnerContact: contact.isPartnerContact,
        isPep: contact.isPep,
        idMerchant: id_merchant,
        slugMerchant: slug_merchant,
        icNumber: contact.icNumber || "",
        icDateIssuance: contact.icDateIssuance
          ? new Date(contact.icDateIssuance).toISOString()
          : null,
        icDispatcher: contact.icDispatcher || "",
        icFederativeUnit: contact.icFederativeUnit || "",
      })
      .returning({ id: contacts.id });

    if (result.length === 0) {
      throw new Error(
        "Insert failed: No ID returned for the inserted contact."
      );
    }

    const id = result[0].id as number;
    console.log("Contacts inserted successfully. ID:", id);
    return id;
  } catch (error) {
    console.error("Error inserting contacts:", error);
    throw error;
  }
}
