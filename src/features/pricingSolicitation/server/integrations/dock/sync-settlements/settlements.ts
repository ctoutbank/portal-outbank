"use server";

import { db } from "@/server/db";
import {
  merchantSettlementOrders,
  merchantSettlements,
  settlements,
} from "../../../../../drizzle/schema";
import { getOrCreateCustomer } from "./customer";
import { getIdBySlugs } from "./getIdBySlugs";
import { InsertSettlement, Settlement } from "./types";

export async function insertSettlementAndRelations(settlement: Settlement[]) {
  try {
    await db.delete(settlements).execute();
    await db.delete(merchantSettlements).execute();
    await db.delete(merchantSettlementOrders).execute();

    const uniqueCustomerPayout = Array.from(
      new Map(
        settlement.map((item) => [item.customer.slug, item.customer])
      ).values()
    );
    const customerids = await getOrCreateCustomer(
      uniqueCustomerPayout
    );

    const insertSettlement: InsertSettlement[] = settlement.map(
      (settlement) => ({
        slug: settlement.slug,
        active: settlement.active,
        dtinsert: new Date(settlement.dtInsert).toISOString(),
        dtupdate: new Date(settlement.dtUpdate).toISOString(),
        batchAmount: settlement.batchAmount.toString(),
        discountFeeAmount: settlement.discountFeeAmount.toString(),
        netSettlementAmount: settlement.netSettlementAmount.toString(),
        totalAnticipationAmount: settlement.totalAnticipationAmount.toString(),
        totalRestitutionAmount: settlement.totalRestitutionAmount.toString(),
        pixAmount: settlement.pixAmount.toString(),
        pixNetAmount: settlement.pixNetAmount.toString(),
        pixFeeAmount: settlement.pixFeeAmount.toString(),
        pixCostAmount: settlement.pixCostAmount.toString(),
        pendingRestitutionAmount:
          settlement.pendingRestitutionAmount.toString(),
        totalCreditAdjustmentAmount:
          settlement.totalCreditAdjustmentAmount.toString(),
        totalDebitAdjustmentAmount:
          settlement.totalDebitAdjustmentAmount.toString(),
        totalSettlementAmount: settlement.totalSettlementAmount.toString(),
        restRoundingAmount: settlement.restRoundingAmount.toString(),
        outstandingAmount: settlement.outstandingAmount.toString(),
        slugCustomer: settlement.slugCustomer,
        status: settlement.status,
        creditStatus: settlement.creditStatus,
        debitStatus: settlement.debitStatus,
        anticipationStatus: settlement.anticipationStatus,
        pixStatus: settlement.pixStatus,
        paymentDate: settlement.paymentDate,
        pendingFinancialAdjustmentAmount:
          settlement.pendingFinancialAdjustmentAmount.toString(),
        creditFinancialAdjustmentAmount:
          settlement.creditFinancialAdjustmentAmount.toString(),
        debitFinancialAdjustmentAmount:
          settlement.debitFinancialAdjustmentAmount.toString(),
        idCustomer:
          customerids?.filter(
            (customer) => customer.slug === settlement.slugCustomer
          )[0]?.id || 0,
      })
    );

    await insertSettlements(insertSettlement);
  } catch (error) {
    console.error(`Erro ao processar settlement:`, error);
  }
}

async function insertSettlements(settlementList: InsertSettlement[]) {
  try {
    const existingSettlements = await getIdBySlugs(
      "settlements",
      settlementList.map((settlement) => settlement.slug)
    );

    // Filter out existing records
    const recordsToInsert = settlementList.filter(
      (settlement) =>
        !existingSettlements?.some(
          (existing) => existing.slug === settlement.slug
        )
    );

    // Log existing records
    const existingCount = settlementList.length - recordsToInsert.length;
    if (existingCount > 0) {
      console.log(`${existingCount} settlements already exist, skipping...`);
    }

    // Insert new records
    if (recordsToInsert.length > 0) {
      console.log(
        "Inserting new settlements, quantity:",
        recordsToInsert.length
      );
      await db.insert(settlements).values(recordsToInsert);
      console.log("New settlements inserted successfully.");
    }

    if (recordsToInsert.length === 0) {
      console.log("All settlements already exist in the database");
    }
  } catch (error) {
    console.error("Error processing settlements:", error);
  }
}
