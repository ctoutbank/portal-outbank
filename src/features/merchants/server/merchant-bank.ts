"use server";

import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { merchantBankAccounts } from "../../../../drizzle/schema";

export type MerchantBankAccountInsert = typeof merchantBankAccounts.$inferInsert;
export type MerchantBankAccountUpdate = typeof merchantBankAccounts.$inferSelect;

/**
 * Busca conta bancária por ID
 * Replicado do Outbank-One
 */
export async function getMerchantBankAccountById(id: number) {
  try {
    if (!id) {
      console.log("ID da conta bancária não fornecido");
      return null;
    }

    const result = await db
      .select({
        merchantBankAccount: merchantBankAccounts,
      })
      .from(merchantBankAccounts)
      .where(eq(merchantBankAccounts.id, id));

    return result[0] || null;
  } catch (error) {
    console.error("Erro ao buscar conta bancária por ID:", error);
    return null;
  }
}

export async function insertMerchantBankAccount(
  merchantBankAccount: MerchantBankAccountInsert
) {
  const result = await db
    .insert(merchantBankAccounts)
    .values(merchantBankAccount)
    .returning({
      id: merchantBankAccounts.id,
    });
  return result[0].id;
}

export async function updateMerchantBankAccount(
  merchantBankAccount: MerchantBankAccountUpdate
) {
  const { id, ...merchantBankAccountWithoutId } = merchantBankAccount;
  await db
    .update(merchantBankAccounts)
    .set(merchantBankAccountWithoutId)
    .where(eq(merchantBankAccounts.id, id));
}

export async function getMerchantBankAccountByDocumentId(documentId: string) {
  const result = await db
    .select()
    .from(merchantBankAccounts)
    .where(eq(merchantBankAccounts.documentId, documentId));
  return result[0] || null;
}

export async function deleteMerchantBankAccount(id: number) {
  await db.delete(merchantBankAccounts).where(eq(merchantBankAccounts.id, id));
}

export async function getAllMerchantBankAccounts() {
  return await db
    .select()
    .from(merchantBankAccounts)
    .orderBy(merchantBankAccounts.corporateName);
}


