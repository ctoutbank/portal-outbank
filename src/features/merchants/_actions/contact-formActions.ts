"use server";

import { ContactSchema } from "../schema/contact-schema";
import {
  ContactInsert,
  ContactUpdate,
  insertContact,
  updateContact,
} from "../server/merchant-contact-crud";
import { generateSlug } from "@/lib/utils";

export async function insertContactFormAction(data: ContactSchema) {
  const contactInsert: ContactInsert = {
    name: data.name || "",
    idDocument: data.idDocument || "",
    email: data.email || "",
    areaCode: data.areaCode || "",
    number: data.number || "",
    phoneType: data.phoneType || "",
    birthDate: data.birthDate || null,
    mothersName: data.mothersName || "",
    isPartnerContact: data.isPartnerContact || false,
    isPep: data.isPep || false,
    idMerchant: data.idMerchant || undefined,
    slugMerchant: data.slugMerchant || "",
    idAddress: data.idAddress || undefined,
    icNumber: data.icNumber || null,
    icDateIssuance: data.icDateIssuance?.toISOString() || null,
    icDispatcher: data.icDispatcher || null,
    icFederativeUnit: data.icFederativeUnit || null,
  };
  const newId = await insertContact(contactInsert);
  return newId;
}

export async function updateContactFormAction(data: ContactSchema) {
  if (!data.id) {
    throw new Error("Cannot update contact without an ID");
  }

  const contactUpdate: ContactUpdate = {
    id: data.id,
    name: data.name || "",
    idDocument: data.idDocument || "",
    email: data.email || "",
    areaCode: data.areaCode || "",
    number: data.number || "",
    phoneType: data.phoneType || "",
    birthDate: data.birthDate || null,
    mothersName: data.mothersName || "",
    isPartnerContact: data.isPartnerContact ?? false,
    isPep: data.isPep ?? false,
    idMerchant: data.idMerchant || null,
    slugMerchant: data.slugMerchant || "",
    idAddress: data.idAddress || null,
    icNumber: data.icNumber || null,
    icDateIssuance: data.icDateIssuance?.toISOString() || null,
    icDispatcher: data.icDispatcher || null,
    icFederativeUnit: data.icFederativeUnit || null,
  };
  await updateContact(contactUpdate);
}

