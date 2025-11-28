"use server";

import { MerchantPixAccountSchema } from "../schema/merchant-pixaccount-schema";
import {
  insertMerchantPixAccount,
  MerchantPixAccountInsert,
  MerchantPixAccountUpdate,
  updateMerchantPixAccount,
} from "../server/merchant-pix-account";
import { generateSlug } from "@/lib/utils";

export async function insertMerchantPixAccountFormAction(
  data: MerchantPixAccountSchema
) {
  const merchantPixAccountInsert: MerchantPixAccountInsert = {
    slug: data.slug || generateSlug(),
    active: data.active ?? true,
    dtinsert: data.dtinsert?.toISOString() || new Date().toISOString(),
    dtupdate: data.dtupdate?.toISOString() || new Date().toISOString(),
    idRegistration: data.idRegistration || "",
    idAccount: data.idAccount || "",
    bankNumber: data.bankNumber,
    bankBranchNumber: data.bankBranchNumber,
    bankBranchDigit: data.bankBranchDigit || "",
    bankAccountNumber: data.bankAccountNumber,
    bankAccountDigit: data.bankAccountDigit || "",
    bankAccountType: data.bankAccountType,
    bankAccountStatus: data.bankAccountStatus || "",
    onboardingPixStatus: data.onboardingPixStatus || "",
    message: data.message || "",
    bankName: data.bankName || "",
    idMerchant: data.idMerchant,
    slugMerchant: data.slugMerchant || "",
  };

  const newId = await insertMerchantPixAccount(merchantPixAccountInsert);
  return newId;
}

export async function updateMerchantPixAccountFormAction(
  data: MerchantPixAccountSchema
) {
  if (!data.id) {
    throw new Error("Cannot update PIX account without an ID");
  }

  const merchantPixAccountUpdate: MerchantPixAccountUpdate = {
    id: data.id,
    slug: data.slug || generateSlug(),
    active: data.active ?? true,
    dtinsert: data.dtinsert?.toISOString() || new Date().toISOString(),
    dtupdate: data.dtupdate?.toISOString() || new Date().toISOString(),
    idRegistration: data.idRegistration || "",
    idAccount: data.idAccount || "",
    bankNumber: data.bankNumber || "",
    bankBranchNumber: data.bankBranchNumber || "",
    bankBranchDigit: data.bankBranchDigit || "",
    bankAccountNumber: data.bankAccountNumber || "",
    bankAccountDigit: data.bankAccountDigit || "",
    bankAccountType: data.bankAccountType || "",
    bankAccountStatus: data.bankAccountStatus || "",
    onboardingPixStatus: data.onboardingPixStatus || "",
    message: data.message || "",
    bankName: data.bankName || "",
    idMerchant: data.idMerchant || 0,
    slugMerchant: data.slugMerchant || "",
  };

  await updateMerchantPixAccount(merchantPixAccountUpdate);
}

