import { db } from "@/server/db";
import { payoutAntecipations } from "../../../../../drizzle/schema";
import { getOrCreateCustomer } from "../sync-settlements/customer";
import { getIdBySlugs } from "../sync-settlements/getIdBySlugs";
import { getOrCreateMerchants } from "../sync-settlements/merchant";
import { Antecipation, InsertAntecipation } from "./types";

export async function insertAntecipationAndRelations(
  antecipations: Antecipation[]
) {
  try {
    const uniqueCustomersPayout = Array.from(
      new Map(
        antecipations.map((item) => [item.customer.slug, item.customer])
      ).values()
    );
    const customerids = await getOrCreateCustomer(
      uniqueCustomersPayout
    );
    const uniqueMerchantsPayout = Array.from(
      new Map(
        antecipations.map((item) => [item.merchant.slug, item.merchant])
      ).values()
    );
    const merchantids = await getOrCreateMerchants(
      uniqueMerchantsPayout
    );

    const insertAntecipationVar: InsertAntecipation[] = antecipations.map(
      (antecipation) => ({
        slug: antecipation.slug,
        payoutId: antecipation.payoutId,
        slugMerchant: antecipation.slugMerchant,
        idMerchants:
          merchantids?.filter(
            (merchant) => antecipation.merchant.slug === merchant.slug
          )[0]?.id || null,
        rrn: antecipation.rrn,
        transactionDate: antecipation.transactionDate,
        type: antecipation.type,
        brand: antecipation.brand,
        installmentNumber: antecipation.installmentNumber,
        installments: antecipation.installments,
        installmentAmount: antecipation.installmentAmount?.toString() || "0",
        transactionMdr: antecipation.transactionMdr?.toString() || "0",
        transactionMdrFee: antecipation.transactionMdrFee?.toString() || "0",
        transactionFee: antecipation.transactionFee?.toString() || "0",
        settlementAmount: antecipation.settlementAmount?.toString() || "0",
        expectedSettlementDate: antecipation.expectedSettlementDate
          ? new Date(antecipation.expectedSettlementDate)
              .toISOString()
              .split("T")[0]
          : null,
        anticipatedAmount: antecipation.anticipatedAmount?.toString() || "0",
        anticipationSettlementAmount:
          antecipation.anticipationSettlementAmount?.toString() || "0",
        status: antecipation.status,
        anticipationDayNumber: antecipation.anticipationDayNumber,
        anticipationFee: antecipation.anticipationFee?.toString() || "0",
        anticipationMonthFee:
          antecipation.anticipationMonthFee?.toString() || "0",
        netAmount: antecipation.netAmount?.toString() || "0",
        anticipationCode: antecipation.anticipationCode,
        totalAnticipatedAmount:
          antecipation.totalAnticipatedAmount?.toString() || "0",
        settlementDate: antecipation.settlementDate
          ? new Date(antecipation.settlementDate).toISOString().split("T")[0]
          : null,
        effectivePaymentDate: antecipation.effectivePaymentDate
          ? new Date(antecipation.effectivePaymentDate)
              .toISOString()
              .split("T")[0]
          : null,
        settlementUniqueNumber:
          antecipation.settlementUniqueNumber?.toString() || "0",
        slugCustomer: antecipation.slugCustomer,
        idCustomer:
          customerids?.filter(
            (customer) => antecipation.customer.slug === customer.slug
          )[0]?.id || null,
      })
    );

    await insertAntecipation(insertAntecipationVar);
  } catch (error) {
    console.error("Error processing antecipation:", error);
    throw error;
  }
}

async function insertAntecipation(antecipationList: InsertAntecipation[]) {
  try {
    const existingAntecipations = await getIdBySlugs(
      "payout_antecipations",
      antecipationList.map((antecipation) => antecipation.slug)
    );

    const filteredList = antecipationList.filter(
      (antecipation) =>
        !existingAntecipations?.some(
          (existing) => existing.slug === antecipation.slug
        )
    );

    if (filteredList.length < 1) {
      console.log("All antecipations already added");
      return;
    }

    console.log("Inserting antecipations, quantity:", filteredList.length);

    await db.insert(payoutAntecipations).values(filteredList);

    console.log("Antecipations inserted successfully.");
  } catch (error) {
    console.error("Error inserting antecipations:", error);
    throw error;
  }
}
