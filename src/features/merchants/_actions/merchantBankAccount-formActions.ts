"use server";

import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { merchants } from "../../../../drizzle/schema";
import { MerchantBankAccountSchema } from "../schema/merchant-bankaccount-schema";
import {
  insertMerchantBankAccount,
  updateMerchantBankAccount,
} from "../server/merchant-bank";

export async function insertMerchantBankAccountFormAction(
  data: MerchantBankAccountSchema
) {
  try {
    const newData = {
      documentId: data.documentId,
      corporateName: data.corporateName,
      legalPerson: data.legalPerson,
      bankBranchNumber: data.bankBranchNumber,
      bankBranchCheckDigit: data.bankBranchCheckDigit || null,
      accountNumber: data.accountNumber,
      accountNumberCheckDigit: data.accountNumberCheckDigit || null,
      accountType: data.accountType,
      compeCode: data.compeCode,
    };

    const id = await insertMerchantBankAccount(newData);

    // Atualiza o merchant com o ID da conta bancária criada
    if (data.idMerchant) {
      await db
        .update(merchants)
        .set({ idMerchantBankAccount: id })
        .where(eq(merchants.id, data.idMerchant));
    }

    return { success: true, id };
  } catch (error) {
    console.error("Erro ao inserir conta bancária:", error);
    return { success: false, error: "Erro ao inserir conta bancária" };
  }
}

export async function updateMerchantBankAccountFormAction(
  data: MerchantBankAccountSchema
) {
  try {
    if (!data.id) {
      throw new Error("ID é obrigatório para atualização");
    }

    const now = new Date();

    const updateData = {
      documentId: data.documentId,
      corporateName: data.corporateName,
      legalPerson: data.legalPerson,
      bankBranchNumber: data.bankBranchNumber,
      bankBranchCheckDigit: data.bankBranchCheckDigit || null,
      accountNumber: data.accountNumber,
      accountNumberCheckDigit: data.accountNumberCheckDigit || null,
      accountType: data.accountType,
      compeCode: data.compeCode,
      dtinsert: data.dtinsert ? data.dtinsert.toISOString() : null,
      dtupdate: now.toISOString(),
      id: data.id,
      active: data.active || null,
      slug: data.slug || "",
    };

    await updateMerchantBankAccount(updateData);

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar conta bancária:", error);
    return { success: false, error: "Erro ao atualizar conta bancária" };
  }
}




