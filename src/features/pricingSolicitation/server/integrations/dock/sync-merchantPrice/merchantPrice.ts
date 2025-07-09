"use server";

import { db } from "@/server/db";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { merchantPrice, merchants } from "../../../../../drizzle/schema";
import { MerchantPrice } from "./types";

async function insertMerchantPrice(merchantPriceData: MerchantPrice, merchantSlug: string) {
  try {
    const existing = await db
      .select()
      .from(merchantPrice)
      .where(eq(merchantPrice.slug, merchantPriceData.slug));

    if (existing.length > 0) {
      console.log("MerchantPrice with this slug already exists. Skipping insert.");
      return;
    }

    const DtInsert = merchantPriceData.dtInsert ? new Date(merchantPriceData.dtInsert).toISOString() : null;
    const DtUpdate = merchantPriceData.dtUpdate ? new Date(merchantPriceData.dtUpdate).toISOString() : null;

    await db.insert(merchantPrice).values({
      slug: merchantPriceData.slug || null,
      active: merchantPriceData.active || null,
      dtinsert: DtInsert,
      dtupdate: DtUpdate,
      slugMerchant: merchantSlug,
      name: merchantPriceData.name || null,
      tableType: merchantPriceData.tableType || null,
      anticipationType: merchantPriceData.anticipationType || null,
      cardPixMdr: merchantPriceData.cardPixMdr?.toString() || null,
      cardPixCeilingFee: merchantPriceData.cardPixCeilingFee?.toString() || null,
      cardPixMinimumCostFee: merchantPriceData.cardPixMinimumCostFee?.toString() || null,
      nonCardPixMdr: merchantPriceData.nonCardPixMdr?.toString() || null,
      nonCardPixCeilingFee: merchantPriceData.nonCardPixCeilingFee?.toString() || null,
      nonCardPixMinimumCostFee: merchantPriceData.nonCardPixMinimumCostFee?.toString() || null,
      compulsoryAnticipationConfig: merchantPriceData.compulsoryAnticipationConfig || null,
      eventualAnticipationFee: merchantPriceData.eventualAnticipationFee?.toString() || null,
    });
  } catch (error) {
    console.error("Erro ao inserir merchantPrice:", error);
  }
}

export async function getOrCreateMerchantPrice(merchantPriceData: MerchantPrice, merchantSlug: string) {
  try {
    const result = await db
      .select({ slug: merchantPrice.slug })
      .from(merchantPrice)
      .where(sql`${merchantPrice.slug} = ${merchantPriceData.slug}`);

    if (result.length > 0) {
      return result[0].slug;
    } else {
      await insertMerchantPrice(merchantPriceData, merchantSlug);
      return merchantPriceData.slug;
    }
  } catch (error) {
    console.error("Erro ao obter ou criar merchantPrice:", error);
  }
}

export async function GetMerchantPriceIdBySlug(slug: string) {
  try {
    
    const merchantPriceResult = await db
      .select({ id: merchantPrice.id })
      .from(merchantPrice)
      .where(eq(merchantPrice.slugMerchant, slug));

    if (merchantPriceResult.length === 0) {
      console.error(`Nenhum merchantPrice encontrado para o slug ${slug}`);
      return null;
    }

    const merchantPriceId = merchantPriceResult[0].id;

    
    await db
      .update(merchants)
      .set({
        idMerchantPrice: merchantPriceId
      })
      .where(eq(merchants.slug, slug));

    console.log(`MerchantPrice ID ${merchantPriceId} atualizado para merchant com slug ${slug}`);
    
    return merchantPriceId;
  } catch (error) {
    console.error(`Erro ao atualizar merchantPrice para o slug ${slug}:`, error);
    return null;
  }
}
