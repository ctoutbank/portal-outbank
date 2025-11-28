"use server";

import {
  MerchantPriceSchema,
  MerchantTransactionPriceSchema,
} from "../schema/merchant-price-schema";
import {
  MerchantPriceUpdate,
  MerchantTransactionPriceUpdate,
  updateMerchantPrice,
  updateMerchantTransactionPrice,
  updateMultipleMerchantTransactionPrices,
} from "../server/merchant-price-crud";

export async function updateMerchantPriceFormAction(data: MerchantPriceSchema) {
  if (!data.id) {
    throw new Error("Cannot update merchant price without an ID");
  }

  const merchantPriceUpdate: MerchantPriceUpdate = {
    id: data.id,
    slug: data.slug || "",
    active: data.active ?? true,
    name: data.name || "",
    tableType: data.tableType || "",
    slugMerchant: data.slugMerchant || "",
    compulsoryAnticipationConfig: data.compulsoryAnticipationConfig || 0,
    anticipationType: data.anticipationType || "",
    eventualAnticipationFee: data.eventualAnticipationFee?.toString() || "0",
    cardPixMdr: data.cardPixMdr?.toString() || "0",
    cardPixCeilingFee: data.cardPixCeilingFee?.toString() || "0",
    cardPixMinimumCostFee: data.cardPixMinimumCostFee?.toString() || "0",
    nonCardPixMdr: data.nonCardPixMdr?.toString() || "0",
    nonCardPixCeilingFee: data.nonCardPixCeilingFee?.toString() || "0",
    nonCardPixMinimumCostFee: data.nonCardPixMinimumCostFee?.toString() || "0",
    dtinsert: data.dtinsert?.toISOString() || new Date().toISOString(),
    dtupdate: new Date().toISOString(),
  };

  const result = await updateMerchantPrice(merchantPriceUpdate);
  return result;
}

export async function updateMerchantTransactionPriceFormAction(
  data: MerchantTransactionPriceSchema
) {
  if (!data.id) {
    throw new Error("Cannot update merchant transaction price without an ID");
  }

  const transactionPriceUpdate: MerchantTransactionPriceUpdate = {
    id: data.id,
    slug: data.slug || "",
    active: data.active ?? true,
    idMerchantPriceGroup: data.idMerchantPriceGroup || 0,
    installmentTransactionFeeStart: data.installmentTransactionFeeStart || 1,
    installmentTransactionFeeEnd: data.installmentTransactionFeeEnd || 1,
    cardTransactionFee: data.cardTransactionFee || 0,
    cardTransactionMdr: data.cardTransactionMdr?.toString() || "0",
    nonCardTransactionFee: data.nonCardTransactionFee || 0,
    nonCardTransactionMdr: data.nonCardTransactionMdr?.toString() || "0",
    producttype: data.producttype || "",
    dtinsert: data.dtinsert?.toISOString() || new Date().toISOString(),
    dtupdate: new Date().toISOString(),
    cardCompulsoryAnticipationMdr:
      data.cardCompulsoryAnticipationMdr?.toString() || "0",
    noCardCompulsoryAnticipationMdr:
      data.noCardCompulsoryAnticipationMdr?.toString() || "0",
  };

  const result = await updateMerchantTransactionPrice(transactionPriceUpdate);
  return result;
}

export async function updateMultipleTransactionPricesFormAction(
  updates: Array<{ id: number; data: Partial<MerchantTransactionPriceSchema> }>
) {
  const formattedUpdates = updates.map((update) => ({
    id: update.id,
    data: {
      ...update.data,
      cardTransactionMdr: update.data.cardTransactionMdr?.toString(),
      nonCardTransactionMdr: update.data.nonCardTransactionMdr?.toString(),
      cardCompulsoryAnticipationMdr:
        update.data.cardCompulsoryAnticipationMdr?.toString(),
      noCardCompulsoryAnticipationMdr:
        update.data.noCardCompulsoryAnticipationMdr?.toString(),
      dtinsert: update.data.dtinsert?.toISOString(),
      dtupdate: new Date().toISOString(),
    },
  }));

  const results =
    await updateMultipleMerchantTransactionPrices(formattedUpdates);
  return results;
}

