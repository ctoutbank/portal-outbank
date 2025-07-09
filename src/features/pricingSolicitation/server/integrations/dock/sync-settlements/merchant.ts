"use server";

import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { merchants } from "../../../../../drizzle/schema";
import { getIdBySlugs } from "./getIdBySlugs";
import { Merchant } from "./types";

async function insertMerchant(
  merchantList: Merchant[]
): Promise<{ id: number; slug: string | null }[] | null> {
  try {
    const uniqueMerchants = Array.from(
      new Map(merchantList.map((item) => [item.slug, item])).values()
    );
    let countChecked = 0;
    let countCreated = 0;
    const results: { id: number; slug: string | null }[] = [];
    for (const merchant of uniqueMerchants) {
      const checkDB = await db
        .select({ id: merchants.id, slug: merchants.slug })
        .from(merchants)
        .where(eq(merchants.slug, merchant.slug));
      if (checkDB) {
        countChecked = countChecked + 1;
        results.push(checkDB[0]);
      } else {
        countCreated = countCreated + 1;
        const inserted = await db
          .insert(merchants)
          .values(merchant)
          .returning({ id: merchants.id, slug: merchants.slug });
        if (inserted && inserted[0]) results.push(inserted[0]);
      }
    }
  
    return results;
  } catch (error) {
    console.error("Error inserting merchant:", error);
    return null;
  }
}

export async function getOrCreateMerchants(
  merchants: Merchant[]
) {
  try {
    const slugs = merchants.map((merchant) => merchant.slug);
    const merchantIds = await getIdBySlugs("merchants", slugs);

    const filteredList = merchants.filter(
      (merchant) =>
        !merchantIds?.some(
          (existingMerchant) => existingMerchant.slug === merchant.slug
        )
    );

    if (filteredList.length > 0) {
      const insertedIds = await insertMerchant(filteredList);
      const nonNullInsertedIds =
        insertedIds
          ?.filter((id) => id.slug !== null)
          .map((id) => ({ id: id.id, slug: id.slug as string })) ?? [];
      return (
        merchantIds?.concat(nonNullInsertedIds ?? []) || nonNullInsertedIds
      );
    } else {
      return merchantIds;
    }
  } catch (error) {
    console.error("Error getting or creating merchants:", error);
  }
}
