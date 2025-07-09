import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { merchantPrice, merchantPriceGroup, merchantTransactionPrice } from "../../../../../drizzle/schema";
import { MerchantPriceGroup, TransactionPrice } from "./types";

export async function getMerchantPriceIdBySlug(slug: string) {
  const result = await db
    .select({ id: merchantPrice.id })
    .from(merchantPrice)
    .where(eq(merchantPrice.slug, slug))
    .limit(1);

  return result[0]?.id;
}

export async function insertMerchantPriceGroup(group: MerchantPriceGroup, idMerchantPrice: number) {
  const [inserted] = await db
    .insert(merchantPriceGroup)
    .values({
      slug: group.slug,
      active: group.active,
      dtinsert: new Date(group.dtInsert).toISOString(),
      dtupdate: new Date(group.dtUpdate).toISOString(),
      brand: group.brand,
      idGroup: group.groupId,
      idMerchantPrice: idMerchantPrice,

    })
    .returning({ id: merchantPriceGroup.id });

  return inserted.id;
}

export async function insertTransactionPrices(
  prices: TransactionPrice[],
  idMerchantPriceGroup: bigint
) {
  const values = prices.map(price => ({
    slug: price.slug,
    active: price.active,
    dtinsert: new Date(price.dtInsert).toISOString(),
    dtupdate: new Date(price.dtUpdate).toISOString(),
    installmentTransactionFeeStart: price.installmentTransactionFeeStart,
    installmentTransactionFeeEnd: price.installmentTransactionFeeEnd,
    cardTransactionFee: price.cardTransactionFee,
    cardTransactionMdr: price.cardTransactionMdr,
    nonCardTransactionFee: price.nonCardTransactionFee,
    nonCardTransactionMdr: price.nonCardTransactionMdr,
    producttype: price.productType,
    idMerchantPriceGroup: BigInt(idMerchantPriceGroup),
  })) as any;

  await db.insert(merchantTransactionPrice).values(values);
}

export async function getAllMerchantPrices() {
  const results = await db
    .select({
      slugMerchant: merchantPrice.slugMerchant,
      slug: merchantPrice.slug,
      name: merchantPrice.name,
    })
    .from(merchantPrice)
    .where(eq(merchantPrice.active, true));

  // Filtra apenas os registros que têm slugMerchant
  return results.filter((result): result is typeof result & { slugMerchant: string } => 
    result.slugMerchant !== null
  );
}