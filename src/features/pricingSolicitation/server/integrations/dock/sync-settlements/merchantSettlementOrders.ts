"use server";

import { db } from "@/server/db";
import { merchantSettlementOrders } from "../../../../../drizzle/schema";
import { getIdBySlugs } from "./getIdBySlugs";
import {
  InsertMerchantSettlementsOrders,
  MerchantSettlementsOrders,
} from "./types";

export async function insertMerchantSettlementOrdersAndRelations(
  merchantSettlementOrders: MerchantSettlementsOrders[]
) {
  try {
    const paymentInstitutionSlugs = Array.from(
      new Set(
        merchantSettlementOrders
          .map(
            (merchantSettlementsOrder) =>
              merchantSettlementsOrder.paymentInstitution?.slug
          )
          .filter((slug): slug is string => slug !== undefined && slug !== null)
      )
    );

    const paymentInstitution = await getIdBySlugs(
      "payment_institution",
      paymentInstitutionSlugs
    );

    const merchantSettlement = await getIdBySlugs(
      "merchant_settlements",
      merchantSettlementOrders.map(
        (MerchantSettlementsOrders) =>
          MerchantSettlementsOrders.merchantSettlement.slug
      )
    );

    const insertMerchantSettlementOrders: InsertMerchantSettlementsOrders[] =
      merchantSettlementOrders.map((merchantSettlementsOrder, index) => {
        // Debug logs para identificar problemas
        const matchingPaymentInstitution = paymentInstitution?.filter(
          (pi) => pi.slug === merchantSettlementsOrder.paymentInstitution?.slug
        )[0];

        const matchingMerchantSettlement = merchantSettlement?.filter(
          (ms) => ms.slug === merchantSettlementsOrder.merchantSettlement.slug
        )[0];

        if (!matchingPaymentInstitution) {
          console.error(
            `❌ Item ${index}: Payment Institution não encontrada`,
            {
              slug: merchantSettlementsOrder.paymentInstitution?.slug,
              availableSlugs: paymentInstitution?.map((p) => p.slug),
            }
          );
        }

        if (!matchingMerchantSettlement) {
          console.error(
            `❌ Item ${index}: Merchant Settlement não encontrado`,
            {
              slug: merchantSettlementsOrder.merchantSettlement.slug,
              availableSlugs: merchantSettlement?.map((m) => m.slug),
            }
          );
        }

        return {
          slug: merchantSettlementsOrder.slug,
          active: merchantSettlementsOrder.active,
          dtinsert: new Date(merchantSettlementsOrder.dtInsert).toISOString(),
          dtupdate: new Date(merchantSettlementsOrder.dtUpdate).toISOString(),
          compeCode: merchantSettlementsOrder.compeCode,
          accountNumber: merchantSettlementsOrder.accountNumber,
          accountNumberCheckDigit:
            merchantSettlementsOrder.accountNumberCheckDigit,
          slugPaymentInstitution:
            merchantSettlementsOrder.paymentInstitution?.slug ?? null,
          idPaymentInstitution: matchingPaymentInstitution?.id || null,
          bankBranchNumber: merchantSettlementsOrder.bankBranchNumber,
          accountType: merchantSettlementsOrder.accountType,
          integrationType: merchantSettlementsOrder.integrationType,
          brand: merchantSettlementsOrder.brand,
          productType: merchantSettlementsOrder.productType,
          amount: merchantSettlementsOrder.amount.toString(),
          anticipationAmount:
            merchantSettlementsOrder.anticipationAmount.toString(),
          idMerchantSettlements: matchingMerchantSettlement?.id || 0,
          merchantSettlementOrderStatus:
            merchantSettlementsOrder.merchantSettlementOrderStatus,
          orderTransactionId: merchantSettlementsOrder.orderTransactionId,
          settlementUniqueNumber:
            merchantSettlementsOrder.settlementUniqueNumber,
          protocolGuidId: merchantSettlementsOrder.protocolGuidId,
          legalPerson: merchantSettlementsOrder.legalPerson,
          documentId: merchantSettlementsOrder.documentId,
          corporateName: merchantSettlementsOrder.corporateName,
          effectivePaymentDate: merchantSettlementsOrder.effectivePaymentDate,
          lock: merchantSettlementsOrder.lock,
        };
      });

    await insertMerchantSettlementOrder(insertMerchantSettlementOrders);
  } catch (error) {
    console.error(
      `Erro ao processar merchant settlement order:`,
      error,
      merchantSettlementOrders
    );
  }
}

async function insertMerchantSettlementOrder(
  merchantSettlementOrderList: InsertMerchantSettlementsOrders[]
) {
  try {
    const existingMerchantSettlementOrders = await getIdBySlugs(
      "merchant_settlement_orders",
      merchantSettlementOrderList.map((order) => order.slug)
    );

    // Filter out existing records
    const recordsToInsert = merchantSettlementOrderList.filter(
      (order) =>
        !existingMerchantSettlementOrders?.some(
          (existing) => existing.slug === order.slug
        )
    );

    // Log existing records
    const existingCount =
      merchantSettlementOrderList.length - recordsToInsert.length;
    if (existingCount > 0) {
      console.log(
        `${existingCount} merchant settlement orders already exist, skipping...`
      );
    }

    // Insert new records
    if (recordsToInsert.length > 0) {
      console.log(
        "Inserting new merchant settlement orders, quantity:",
        recordsToInsert.length
      );
      await db.insert(merchantSettlementOrders).values(recordsToInsert);
      console.log("New merchant settlement orders inserted successfully.");
    }

    if (recordsToInsert.length === 0) {
      console.log(
        "All merchant settlement orders already exist in the database"
      );
    }
  } catch (error) {
    console.error("Error processing merchant settlement orders:", error);
  }
}
