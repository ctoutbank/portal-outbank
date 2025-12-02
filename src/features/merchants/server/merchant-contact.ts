"use server";

import { db } from "@/lib/db";
import { addresses, contacts } from "../../../../drizzle/schema";
import { eq, getTableColumns } from "drizzle-orm";

export type ContactInsert = typeof contacts.$inferInsert;
export type ContactUpdate = typeof contacts.$inferSelect;

/**
 * Busca contatos por ID do merchant
 * Replicado do Outbank-One
 */
export async function getContactByMerchantId(id: number) {
  const result = await db
    .select({
      contacts: { ...getTableColumns(contacts) },
      addresses: { ...getTableColumns(addresses) },
    })
    .from(contacts)
    .where(eq(contacts.idMerchant, id))
    .leftJoin(addresses, eq(contacts.idAddress, addresses.id));

  return result;
}

export async function insertContact(contact: ContactInsert) {
  const result = await db.insert(contacts).values(contact).returning({
    id: contacts.id,
  });

  return result[0].id;
}

export async function updateContact(contact: ContactUpdate) {
  const { id, ...contactWithoutId } = contact;
  await db.update(contacts).set(contactWithoutId).where(eq(contacts.id, id));
}

export async function deleteContact(id: number) {
  await db.delete(contacts).where(eq(contacts.id, id));
}




