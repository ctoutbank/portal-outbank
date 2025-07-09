"use server";

import { db } from "@/server/db";
import { paymentLink } from "../../../../../drizzle/schema";
import { getIdBySlugs } from "../sync-settlements/getIdBySlugs";
import { InsertPaymentLink, PaymentLinkObject } from "./types";

export async function insertPaymentLinkAndRelations(
  paymentLinkList: PaymentLinkObject[]
) {
  try {
    const merchantsId = await getIdBySlugs(
      "merchants",
      paymentLinkList.map((paymentLink) => paymentLink.slugMerchant)
    );

    const varInsertPaymentLink: InsertPaymentLink[] = paymentLinkList.map(
      (paymentLink) => ({
        slug: paymentLink.slug,
        active: paymentLink.active,
        dtinsert: new Date(paymentLink.dtInsert).toISOString(),
        dtupdate: new Date(paymentLink.dtUpdate).toISOString(),
        linkName: paymentLink.linkName,
        dtExpiration: new Date(paymentLink.dtExpiration).toISOString(),
        totalAmount: paymentLink.totalAmount.toString(),
        idMerchant:
          merchantsId?.filter(
            (merchant) => merchant.slug === paymentLink.slugMerchant
          )[0]?.id || 0,
        paymentLinkStatus: paymentLink.paymentLinkStatus,
        productType: paymentLink.productType,
        installments: paymentLink.installments,
        linkUrl: paymentLink.linkUrl,
        pixEnabled:
          paymentLink.pixEnabled == undefined || paymentLink.pixEnabled == null
            ? false
            : paymentLink.pixEnabled,
        transactionSlug:
          paymentLink.slugFinancialTransaction == undefined ||
          paymentLink.slugFinancialTransaction == null
            ? ""
            : paymentLink.slugFinancialTransaction,

        isFromServer: true,
      })
    );

    await insertPaymentLink(varInsertPaymentLink);
  } catch (error) {
    console.error(`Erro ao processar settlement:`, error);
  }
}

export async function insertPaymentLink(
  paymentLinkInsert: InsertPaymentLink[]
) {
  try {
    const existingPaymentLink = await getIdBySlugs(
      "payment_link",
      paymentLinkInsert.map((paymentLink) => paymentLink.slug)
    );

    const filteredList = paymentLinkInsert.filter(
      (paymentLinkInsert) =>
        !existingPaymentLink?.some(
          (existingPaymentLink) =>
            existingPaymentLink.slug === paymentLinkInsert.slug
        )
    );

    if (filteredList.length < 1) {
      console.log("todos os payment link já foram adicionados");
      return;
    }

    console.log("Inserting payment link, quantity: ", filteredList.length);

    await db.insert(paymentLink).values(filteredList);

    console.log("Payment Link inserted successfully.");
  } catch (error) {
    console.error("Error inserting payment link:", error);
  }
}
