"use server";

import { db } from "@/server/db";
import { and, eq, isNotNull, max } from "drizzle-orm";
import { cronJobMonitoring, payout } from "../../../../../drizzle/schema";
import { getOrCreateCustomer } from "../sync-settlements/customer";
import { getIdBySlugs } from "../sync-settlements/getIdBySlugs";
import { getOrCreateMerchants } from "../sync-settlements/merchant";
import { InsertPayout, Payout } from "./types";

export async function insertPayoutAndRelations(payoutList: Payout[], lastSyncDate: Date, monitoringId: number) {
  try {
    const uniqueCustomerPayout = Array.from(
      new Map(
        payoutList.map((item) => [item.customer.slug, item.customer])
      ).values()
    );
    const customerids = await getOrCreateCustomer(
      uniqueCustomerPayout
    );
    const uniqueMerchantsPayout = Array.from(
      new Map(
        payoutList.map((item) => [item.merchant.slug, item.merchant])
      ).values()
    );
    const merchantids = await getOrCreateMerchants(
      uniqueMerchantsPayout
    );

    const insertPayoutVar: InsertPayout[] = payoutList.map((payouts) => ({
      slug: payouts.slug,
      payoutId: payouts.payoutId,
      slugMerchant: payouts.slugMerchant,
      idMerchant:
        merchantids?.filter(
          (merchant) => payouts.merchant.slug === merchant.slug
        )[0]?.id || 0,
      rrn: payouts.rrn,
      transactionDate: payouts.transactionDate,
      productType: payouts.productType,
      type: payouts.type,
      brand: payouts.brand,
      installmentNumber: payouts.installmentNumber,
      installments: payouts.installments,
      installmentAmount:
        payouts.installmentAmount === null ||
        payouts.installmentAmount === undefined
          ? "0"
          : payouts.installmentAmount.toString(),
      transactionMdr:
        payouts.transactionMdr === null || payouts.transactionMdr === undefined
          ? "0"
          : payouts.transactionMdr.toString(),
      transactionMdrFee:
        payouts.transactionMdrFee === null ||
        payouts.transactionMdrFee === undefined
          ? "0"
          : payouts.transactionMdrFee.toString(),
      transactionFee:
        payouts.transactionFee === null || payouts.transactionFee === undefined
          ? "0"
          : payouts.transactionFee.toString(),
      settlementAmount:
        payouts.settlementAmount === null ||
        payouts.settlementAmount === undefined
          ? "0"
          : payouts.settlementAmount.toString(),
      expectedSettlementDate: new Date(payouts.expectedSettlementDate)
        .toISOString()
        .split("T")[0],
      status: payouts.status,
      receivableAmount:
        payouts.receivableAmount === null ||
        payouts.receivableAmount === undefined
          ? ""
          : payouts.receivableAmount.toString(),
      settlementDate: new Date(payouts.settlementDate)
        .toISOString()
        .split("T")[0],
      slugCustomer: payouts.slugCustomer,
      idCustomer:
        customerids?.filter(
          (customer) => payouts.customer.slug === customer.slug
        )[0]?.id || 0,
      effectivePaymentDate: new Date(payouts.effectivePaymentDate)
        .toISOString()
        .split("T")[0],
      settlementUniqueNumber:
        payouts.settlementUniqueNumber === null ||
        payouts.settlementUniqueNumber === undefined
          ? "0"
          : payouts.settlementUniqueNumber.toString(),
      anticipationAmount:
        payouts.anticipationAmount === null ||
        payouts.anticipationAmount === undefined
          ? "0"
          : payouts.anticipationAmount.toString(),
      anticipationBlockStatus: payouts.anticipationBlockStatus,
      slugMerchantSplit:
        payouts.slugMerchantSplit == null ? "" : payouts.slugMerchantSplit,
    }));

    await insertPayout(insertPayoutVar);
   
  } catch (error) {
    console.error(`Erro ao processar payout:`, error);

    // Update monitoring record on error
    if (monitoringId) {
      await db
        .update(cronJobMonitoring)
        .set({
          endTime: new Date().toISOString(),
          status: "ERROR",
          errorMessage: error instanceof Error ? error.message : String(error),
          logMessage: `Failed to process payouts`,
        })
        .where(eq(cronJobMonitoring.id, monitoringId));
    }
  }
}

export async function insertPayout(payoutList: InsertPayout[]) {
  const jobName = "Sincronização de Payout";
  const startTime = new Date().toISOString();
  let monitoringId: number | undefined;

  try {
    // Create monitoring record
    const [monitoring] = await db
      .insert(cronJobMonitoring)
      .values({
        jobName,
        startTime,
        status: "RUNNING",
        logMessage: `Starting insertion of ${payoutList.length} payouts`,
      })
      .returning({ id: cronJobMonitoring.id });

    monitoringId = monitoring?.id;

    const existingPayouts = await getIdBySlugs(
      "payout",
      payoutList.map((payouts) => payouts.slug)
    );

    const filteredList = payoutList.filter(
      (payouts) =>
        !existingPayouts?.some(
          (existingPayouts) => existingPayouts.slug === payouts.slug
        )
    );

    if (filteredList.length < 1) {
      console.log("todos os payouts já foram adicionados");

      // Update monitoring record when no new payouts
      if (monitoringId) {
        await db
          .update(cronJobMonitoring)
          .set({
            endTime: new Date().toISOString(),
            status: "SUCCESS",
            logMessage: "All payouts already added to database",
          })
          .where(eq(cronJobMonitoring.id, monitoringId));
      }

      return;
    }

    console.log("Inserting payout, quantity: ", filteredList.length);

    await db.insert(payout).values(filteredList);

    console.log("Payout inserted successfully.");

    // Update monitoring record on success
    if (monitoringId) {
      await db
        .update(cronJobMonitoring)
        .set({
          endTime: new Date().toISOString(),
          status: "SUCCESS",
          logMessage: `Successfully inserted ${filteredList.length} payouts`,
        })
        .where(eq(cronJobMonitoring.id, monitoringId));
    }
  } catch (error) {
    console.error("Error inserting Payout:", error);

    // Update monitoring record on error
    if (monitoringId) {
      await db
        .update(cronJobMonitoring)
        .set({
          endTime: new Date().toISOString(),
          status: "ERROR",
          errorMessage: error instanceof Error ? error.message : String(error),
          logMessage: "Failed to insert payouts",
        })
        .where(eq(cronJobMonitoring.id, monitoringId));
    }
  }
}

export async function getPayoutSyncConfig() {
  try {
    const maxDateResult = await db
      .select({ maxDate: max(cronJobMonitoring.lastSync) })
      .from(cronJobMonitoring)
      .where(
        and(
          eq(cronJobMonitoring.jobName, "Sincronização de Payouts"),
          isNotNull(cronJobMonitoring.lastSync)
        )
      );

    console.log(maxDateResult[0]?.maxDate);

    return maxDateResult[0]?.maxDate;
  } catch (error) {
    console.error("Error getting payout sync config:", error);
    return null;
  }
}
