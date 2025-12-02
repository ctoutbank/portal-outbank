"use server";

import { db } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { accountType, bank, merchantpixaccount } from "../../../../drizzle/schema";

export type MerchantPixAccountInsert = typeof merchantpixaccount.$inferInsert;
export type MerchantPixAccountUpdate = typeof merchantpixaccount.$inferSelect;

export type banckDropdown = {
  value: string;
  label: string;
};

export type accountTypeDropdown = {
  value: string;
  label: string;
};

/**
 * Busca conta PIX por ID do merchant
 * Replicado do Outbank-One
 */
export async function getMerchantPixAccountByMerchantId(merchantId: number) {
  const result = await db
    .select()
    .from(merchantpixaccount)
    .where(eq(merchantpixaccount.idMerchant, merchantId));
  return result[0] || null;
}

/**
 * Busca bancos para dropdown
 * Replicado do Outbank-One
 */
export async function getBankForDropdown(): Promise<banckDropdown[]> {
  const result = await db
    .select({
      value: bank.number,
      label: bank.name,
    })
    .from(bank)
    .orderBy(asc(bank.number));
  return result.map((item) => ({
    value: item.value ?? "",
    label: item.label ?? "",
  }));
}

/**
 * Busca tipos de conta para dropdown
 * Replicado do Outbank-One
 */
export async function getAccountTypeForDropdown(): Promise<accountTypeDropdown[]> {
  const result = await db
    .select({
      value: accountType.code,
      label: accountType.name,
    })
    .from(accountType)
    .orderBy(asc(accountType.code));
  return result.map((item) => ({
    value: item.value ?? "",
    label: item.label ?? "",
  }));
}

export async function insertMerchantPixAccount(merchantPixAccount: MerchantPixAccountInsert) {
  const result = await db
    .insert(merchantpixaccount)
    .values(merchantPixAccount)
    .returning({
      id: merchantpixaccount.id,
    });
  return result[0].id;
}

export async function updateMerchantPixAccount(merchantPixAccount: MerchantPixAccountUpdate) {
  const { id, ...merchantPixAccountWithoutId } = merchantPixAccount;
  await db
    .update(merchantpixaccount)
    .set(merchantPixAccountWithoutId)
    .where(eq(merchantpixaccount.id, id));
}




