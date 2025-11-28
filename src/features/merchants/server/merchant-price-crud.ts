"use server";

import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  merchantPrice,
  merchantTransactionPrice,
} from "../../../../drizzle/schema";

export type MerchantPriceInsert = typeof merchantPrice.$inferInsert;
export type MerchantPriceUpdate = typeof merchantPrice.$inferSelect;
export type MerchantTransactionPriceInsert =
  typeof merchantTransactionPrice.$inferInsert;
export type MerchantTransactionPriceUpdate =
  typeof merchantTransactionPrice.$inferSelect;

// Buscar merchant price por ID
export async function getMerchantPriceById(id: number) {
  const result = await db
    .select()
    .from(merchantPrice)
    .where(eq(merchantPrice.id, id))
    .limit(1);

  return result[0] || null;
}

// Atualizar merchant price
export async function updateMerchantPrice(data: MerchantPriceUpdate) {
  const { id, ...updateData } = data;

  const result = await db
    .update(merchantPrice)
    .set({
      ...updateData,
      dtupdate: new Date().toISOString(),
    })
    .where(eq(merchantPrice.id, id))
    .returning();

  return result[0];
}

// Buscar transaction price por ID
export async function getMerchantTransactionPriceById(id: number) {
  const result = await db
    .select()
    .from(merchantTransactionPrice)
    .where(eq(merchantTransactionPrice.id, id))
    .limit(1);

  return result[0] || null;
}

// Atualizar transaction price
export async function updateMerchantTransactionPrice(
  data: MerchantTransactionPriceUpdate
) {
  const { id, ...updateData } = data;

  const result = await db
    .update(merchantTransactionPrice)
    .set({
      ...updateData,
      dtupdate: new Date().toISOString(),
    })
    .where(eq(merchantTransactionPrice.id, id))
    .returning();

  return result[0];
}

// Atualizar múltiplos transaction prices
export async function updateMultipleMerchantTransactionPrices(
  updates: Array<{ id: number; data: Partial<MerchantTransactionPriceUpdate> }>
) {
  const results = [];

  for (const update of updates) {
    const result = await db
      .update(merchantTransactionPrice)
      .set({
        ...update.data,
        dtupdate: new Date().toISOString(),
      })
      .where(eq(merchantTransactionPrice.id, update.id))
      .returning();

    results.push(result[0]);
  }

  return results;
}

