"use server";

import { db } from "@/server/db";
import { merchantPixSettlementOrders } from "../../../../../drizzle/schema";
import { getIdBySlugs } from "./getIdBySlugs";
import {
  InsertPixMerchantSettlementOrders,
  PixMerchantSettlementOrders,
} from "./types";

export async function insertPixMerchantSettlementOrdersAndRelations(
  pixMerchantSettlementOrderList: PixMerchantSettlementOrders[],
  merchant: { id: number; slug: string }[]
) {
  try {
    // Remove duplicatas e retorna um array com os slugs unicos
    const customer = Array.from(
      new Set(
        pixMerchantSettlementOrderList.map(
          (pixMerchantSettlementOrderList) =>
            pixMerchantSettlementOrderList.customer.slug
        )
      )
    );
    const customerids = await getIdBySlugs("customers", customer);

    const merchantSettlementIds = await getIdBySlugs(
      "merchant_settlements",
      pixMerchantSettlementOrderList.map(
        (pixMerchantSettlementOrderList) =>
          pixMerchantSettlementOrderList.merchantSettlement.slug
      )
    );

    const insertPixMerchantSettlementOrdersVar: InsertPixMerchantSettlementOrders[] =
      pixMerchantSettlementOrderList.map((pixMerchantSettlementOrder) => ({
        slug: pixMerchantSettlementOrder.slug,
        active: pixMerchantSettlementOrder.active,
        dtinsert: new Date(pixMerchantSettlementOrder.dtInsert).toISOString(),
        dtupdate: new Date(pixMerchantSettlementOrder.dtUpdate).toISOString(),
        slugCustomer: pixMerchantSettlementOrder.slugCustomer,
        idCustomer:
          customerids?.filter(
            (customer) =>
              customer.slug === pixMerchantSettlementOrder.slugCustomer
          )[0]?.id || 0,
        slugMerchant: pixMerchantSettlementOrder.slugMerchant,
        idMerchant:
          merchant?.filter(
            (merchant) =>
              merchant.slug === pixMerchantSettlementOrder.slugMerchant
          )[0]?.id || 0,
        paymentDate: pixMerchantSettlementOrder.paymentDate
          ? new Date(pixMerchantSettlementOrder.paymentDate)
              .toISOString()
              .split("T")[0]
          : null,
        authorizerMerchantId: pixMerchantSettlementOrder.authorizerMerchantId,
        expectedPaymentDate: pixMerchantSettlementOrder.expectedPaymentDate
          ? new Date(pixMerchantSettlementOrder.expectedPaymentDate)
              .toISOString()
              .split("T")[0]
          : null,
        transactionCount: pixMerchantSettlementOrder.transactionCount,
        totalAmount:
          pixMerchantSettlementOrder.totalAmount == undefined
            ? "0"
            : pixMerchantSettlementOrder.totalAmount.toString(),
        totalRefundAmount:
          pixMerchantSettlementOrder.totalRefundAmount == undefined
            ? "0"
            : pixMerchantSettlementOrder.totalRefundAmount.toString(),
        totalNetAmount:
          pixMerchantSettlementOrder.totalNetAmount == undefined
            ? "0"
            : pixMerchantSettlementOrder.totalNetAmount.toString(),
        totalFeeAmount:
          pixMerchantSettlementOrder.totalFeeAmount == undefined
            ? "0"
            : pixMerchantSettlementOrder.totalFeeAmount.toString(),
        totalCostAmount:
          pixMerchantSettlementOrder.totalCostAmount == undefined
            ? "0"
            : pixMerchantSettlementOrder.totalCostAmount.toString(),
        totalSettlementAmount:
          pixMerchantSettlementOrder.totalSettlementAmount == undefined
            ? "0"
            : pixMerchantSettlementOrder.totalSettlementAmount.toString(),
        status: pixMerchantSettlementOrder.status,
        compeCode: pixMerchantSettlementOrder.compeCode,
        accountNumber: pixMerchantSettlementOrder.accountNumber,
        accountNumberCheckDigit:
          pixMerchantSettlementOrder.accountNumberCheckDigit,
        bankBranchNumber: pixMerchantSettlementOrder.bankBranchNumber,
        accountType: pixMerchantSettlementOrder.accountType,
        legalPerson: pixMerchantSettlementOrder.legalPerson,
        documentId: pixMerchantSettlementOrder.documentId,
        corporateName: pixMerchantSettlementOrder.corporateName,
        effectivePaymentDate: pixMerchantSettlementOrder.effectivePaymentDate
          ? new Date(pixMerchantSettlementOrder.effectivePaymentDate)
              .toISOString()
              .split("T")[0]
          : null,
        settlementUniqueNumber:
          pixMerchantSettlementOrder.settlementUniqueNumber,
        protocolGuidId: pixMerchantSettlementOrder.protocolGuidId,
        feeSettlementUniqueNumber:
          pixMerchantSettlementOrder.feeSettlementUniqueNumber,
        feeEffectivePaymentDate:
          pixMerchantSettlementOrder.feeEffectivePaymentDate
            ? new Date(pixMerchantSettlementOrder.feeEffectivePaymentDate)
                .toISOString()
                .split("T")[0]
            : null,
        feeProtocolGuidId: pixMerchantSettlementOrder.feeProtocolGuidId,
        idMerchantSettlement:
          merchantSettlementIds?.filter(
            (merchantSettlement) =>
              merchantSettlement.slug ===
              pixMerchantSettlementOrder.merchantSettlement.slug
          )[0]?.id || 0,
      }));

    await insertPixMerchantSettlementOrders(
      insertPixMerchantSettlementOrdersVar
    );
  } catch (error) {
    console.error(`Erro ao processar pixMerchantSettlementOrders:`, error);
  }
}

async function insertPixMerchantSettlementOrders(
  pixMerchantSettlementOrder: InsertPixMerchantSettlementOrders[]
) {
  try {
    const existingPixMerchantSettlementOrder = await getIdBySlugs(
      "merchant_pix_settlement_orders",
      pixMerchantSettlementOrder.map(
        (pixMerchantSettlementOrder) => pixMerchantSettlementOrder.slug
      )
    );

    // Filter out existing records
    const recordsToInsert = pixMerchantSettlementOrder.filter(
      (order) =>
        !existingPixMerchantSettlementOrder?.some(
          (existing) => existing.slug === order.slug
        )
    );

    // Log existing records
    const existingCount =
      pixMerchantSettlementOrder.length - recordsToInsert.length;
    if (existingCount > 0) {
      console.log(
        `${existingCount} pix merchant settlement orders already exist, skipping...`
      );
    }

    // Insert new records
    if (recordsToInsert.length > 0) {
      console.log(
        "Inserting new pix merchant settlement orders, quantity:",
        recordsToInsert.length
      );
      await db.insert(merchantPixSettlementOrders).values(recordsToInsert);
      console.log("New pix merchant settlement orders inserted successfully.");
    }

    if (recordsToInsert.length === 0) {
      console.log(
        "All pix merchant settlement orders already exist in the database"
      );
    }
  } catch (error) {
    console.error("Error processing pix merchant settlement orders:", error);
  }
}
