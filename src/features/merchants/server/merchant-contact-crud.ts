"use server";

import { db } from "@/lib/db";
import { eq, getTableColumns } from "drizzle-orm";
import { contacts, addresses } from "../../../../drizzle/schema";

export type ContactInsert = typeof contacts.$inferInsert;
export type ContactUpdate = typeof contacts.$inferSelect;

export async function insertContact(contact: ContactInsert): Promise<number> {
  const result = await db.insert(contacts).values(contact).returning({
    id: contacts.id,
  });

  return result[0].id;
}

export async function updateContact(contact: ContactUpdate): Promise<void> {
  const { id, ...contactWithoutId } = contact;
  await db.update(contacts).set(contactWithoutId).where(eq(contacts.id, id));
}

export async function deleteContact(id: number): Promise<void> {
  await db.delete(contacts).where(eq(contacts.id, id));
}


