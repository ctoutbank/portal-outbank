"use server";

import { db } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import {
  merchantPrice,
  merchantPriceGroup,
  merchantTransactionPrice,
} from "../../../../drizzle/schema";

export type MerchantPriceGroupInsert = typeof merchantPriceGroup.$inferInsert;
export type MerchantPriceGroupUpdate = typeof merchantPriceGroup.$inferSelect;

/**
 * Busca grupos de preços por ID do merchant price
 * Replicado do Outbank-One
 */
export async function getMerchantPriceGroupsBymerchantPricetId(
  merchantPriceId: number
) {
  if (!merchantPriceId || merchantPriceId === 0) {
    return [];
  }

  const result = await db
    .select({
      merchantPrice: merchantPrice,
      priceGroup: merchantPriceGroup,
      transactionPrices: sql<string>`COALESCE(json_agg(
                json_build_object(
                    'id', ${merchantTransactionPrice.id},
                    'slug', ${merchantTransactionPrice.slug},
                    'active', ${merchantTransactionPrice.active},
                    'dtinsert', ${merchantTransactionPrice.dtinsert},
                    'dtupdate', ${merchantTransactionPrice.dtupdate},
                    'idMerchantPriceGroup', ${merchantTransactionPrice.idMerchantPriceGroup},
                    'installmentTransactionFeeStart', ${merchantTransactionPrice.installmentTransactionFeeStart},
                    'installmentTransactionFeeEnd', ${merchantTransactionPrice.installmentTransactionFeeEnd},
                    'mdr', ${merchantTransactionPrice.cardTransactionMdr},
                    'fee', ${merchantTransactionPrice.cardTransactionFee},
                    'nonCardTransactionFee', ${merchantTransactionPrice.nonCardTransactionFee},
                    'nonCardTransactionMdr', ${merchantTransactionPrice.nonCardTransactionMdr},
                    'producttype', ${merchantTransactionPrice.producttype},
                    'cardCompulsoryAnticipationMdr', ${merchantTransactionPrice.cardCompulsoryAnticipationMdr},
                    'nonCardCompulsoryAnticipationMdr', ${merchantTransactionPrice.noCardCompulsoryAnticipationMdr}
                )
            ) FILTER (WHERE ${merchantTransactionPrice.id} IS NOT NULL), '[]'::json)`,
    })
    .from(merchantPrice)
    .where(eq(merchantPrice.id, merchantPriceId))
    .leftJoin(
      merchantPriceGroup,
      eq(merchantPriceGroup.idMerchantPrice, merchantPrice.id)
    )
    .leftJoin(
      merchantTransactionPrice,
      eq(merchantTransactionPrice.idMerchantPriceGroup, merchantPriceGroup.id)
    )
    .groupBy(merchantPrice.id, merchantPriceGroup.id);

  return result;
}

export async function getMerchantPriceGroupById(id: number) {
  const result = await db
    .select()
    .from(merchantPriceGroup)
    .where(eq(merchantPriceGroup.id, id))
    .leftJoin(
      merchantPrice,
      eq(merchantPriceGroup.idMerchantPrice, merchantPrice.id)
    )
    .limit(1);

  return result[0] || null;
}

export async function insertMerchantPriceGroup(data: MerchantPriceGroupInsert) {
  const result = await db
    .insert(merchantPriceGroup)
    .values({
      ...data,
      dtinsert: new Date().toISOString(),
      dtupdate: new Date().toISOString(),
    })
    .returning();

  return result[0];
}

export async function updateMerchantPriceGroup(data: MerchantPriceGroupUpdate) {
  const { id, ...updateData } = data;

  const result = await db
    .update(merchantPriceGroup)
    .set({
      ...updateData,
      dtupdate: new Date().toISOString(),
    })
    .where(eq(merchantPriceGroup.id, id))
    .returning();

  return result[0];
}


