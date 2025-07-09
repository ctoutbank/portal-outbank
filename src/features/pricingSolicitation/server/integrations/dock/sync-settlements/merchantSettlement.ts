"use server";

import { db } from "@/server/db";
import { merchantSettlements } from "../../../../../drizzle/schema";
import { getIdBySlugs } from "./getIdBySlugs";
import { InsertSettlementObject, SettlementObject } from "./types";

export async function insertMerchantSettlementAndRelations(
  merchantSettlementList: SettlementObject[],
  merchant: { id: number; slug: string }[]
) {
  try {
    const customerids = await getIdBySlugs(
      "customers",
      merchantSettlementList.map(
        (merchantSettlement) => merchantSettlement.slugCustomer
      )
    );

    const settlementIds = await getIdBySlugs(
      "settlements",
      merchantSettlementList.map(
        (merchantSettlement) => merchantSettlement.settlement.slug
      )
    );

    const insertmerchantSettlements: InsertSettlementObject[] =
      merchantSettlementList.map((merchantSettlement) => ({
        slug: merchantSettlement.slug,
        active: merchantSettlement.active,
        dtinsert: new Date(merchantSettlement.dtInsert).toISOString(),
        dtupdate: new Date(merchantSettlement.dtUpdate).toISOString(),
        transactionCount: merchantSettlement.transactionCount,
        adjustmentCount: merchantSettlement.adjustmentCount,
        batchAmount: merchantSettlement.batchAmount.toString(),
        netSettlementAmount: merchantSettlement.netSettlementAmount.toString(),
        pixAmount: merchantSettlement.pixAmount.toString(),
        pixNetAmount: merchantSettlement.pixNetAmount.toString(),
        pixFeeAmount: merchantSettlement.pixFeeAmount.toString(),
        pixCostAmount: merchantSettlement.pixCostAmount.toString(),
        creditAdjustmentAmount:
          merchantSettlement.creditAdjustmentAmount.toString(),
        debitAdjustmentAmount:
          merchantSettlement.debitAdjustmentAmount.toString(),
        totalAnticipationAmount:
          merchantSettlement.totalAnticipationAmount.toString(),
        totalRestitutionAmount:
          merchantSettlement.totalRestitutionAmount.toString(),
        pendingRestitutionAmount:
          merchantSettlement.pendingRestitutionAmount.toString(),
        totalSettlementAmount:
          merchantSettlement.totalSettlementAmount.toString(),
        pendingFinancialAdjustmentAmount:
          merchantSettlement.pendingFinancialAdjustmentAmount.toString(),
        creditFinancialAdjustmentAmount:
          merchantSettlement.creditFinancialAdjustmentAmount.toString(),
        debitFinancialAdjustmentAmount:
          merchantSettlement.debitFinancialAdjustmentAmount.toString(),
        status: merchantSettlement.status,
        slugMerchant: merchantSettlement.slugMerchant,
        slugCustomer: merchantSettlement.slugCustomer,
        outstandingAmount: merchantSettlement.outstandingAmount.toString(),
        restRoundingAmount: merchantSettlement.restRoundingAmount.toString(),
        idCustomer:
          customerids?.filter(
            (customer) => customer.slug === merchantSettlement.slugCustomer
          )[0]?.id || 0,
        idMerchant:
          merchant?.filter(
            (merchant) => merchant.slug === merchantSettlement.slugMerchant
          )[0]?.id || 0,
        idSettlement:
          settlementIds?.filter(
            (settlement) =>
              settlement.slug === merchantSettlement.settlement.slug
          )[0]?.id || 0,
      }));

    await insertMerchantSettlement(insertmerchantSettlements);
  } catch (error) {
    console.error(`Erro ao processar MerchantSettlement:`, error);
  }
}

async function insertMerchantSettlement(
  merchantSettlementList: InsertSettlementObject[]
) {
  try {
    const existingMerchantSettlements = await getIdBySlugs(
      "merchant_settlements",
      merchantSettlementList.map((settlement) => settlement.slug)
    );

    // Filter out existing records
    const recordsToInsert = merchantSettlementList.filter(
      (settlement) =>
        !existingMerchantSettlements?.some(
          (existing) => existing.slug === settlement.slug
        )
    );

    // Log existing records
    const existingCount =
      merchantSettlementList.length - recordsToInsert.length;
    if (existingCount > 0) {
      console.log(
        `${existingCount} merchant settlements already exist, skipping...`
      );
    }

    // Insert new records
    if (recordsToInsert.length > 0) {
      console.log(
        "Inserting new merchant settlements, quantity:",
        recordsToInsert.length
      );
      await db.insert(merchantSettlements).values(recordsToInsert);
      console.log("New merchant settlements inserted successfully.");
    }

    if (recordsToInsert.length === 0) {
      console.log("All merchant settlements already exist in the database");
    }
  } catch (error) {
    console.error("Error processing merchant settlements:", error);
  }
}
