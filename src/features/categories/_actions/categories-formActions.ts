"use server";

import { generateSlug } from "@/lib/utils";
import {
  CategoryDetail,
  CategoryInsert,
  insertCategory,
  updateCategory,
} from "../server/category";

export async function insertCategoryFormAction(data: CategoryInsert) {
  try {
    console.log("data", data);
    const categoryInsert: CategoryInsert = {
      slug: generateSlug(),
      name: data.name || "",
      active: data.active ?? true,
      dtinsert: new Date().toISOString(),
      dtupdate: new Date().toISOString(),
      mcc: data.mcc || "",
      cnae: data.cnae || "",
      anticipationRiskFactorCp: data.anticipationRiskFactorCp ?? 0,
      anticipationRiskFactorCnp: data.anticipationRiskFactorCnp ?? 0,
      waitingPeriodCp: data.waitingPeriodCp ?? 0,
      waitingPeriodCnp: data.waitingPeriodCnp ?? 0,
    };

    const newId = await insertCategory(categoryInsert);
    return newId;
  } catch (error) {
    console.log("Ocorreu um erro ao cadastrar a categoria", error);
    return null;
  }
}

export async function updateCategoryFormAction(data: CategoryDetail) {
  if (!data.id) {
    throw new Error("Category ID is required to update");
  }
  const categoryUpdate: CategoryDetail = {
    id: data.id,
    name: data.name || "",
    active: data.active ?? true,
    dtupdate: new Date().toISOString(),
    dtinsert: data.dtinsert || new Date().toISOString(),
    anticipationRiskFactorCp: Number(data.anticipationRiskFactorCp),
    anticipationRiskFactorCnp: Number(data.anticipationRiskFactorCnp),
    waitingPeriodCp: Number(data.waitingPeriodCp),
    waitingPeriodCnp: Number(data.waitingPeriodCnp),
    mcc: data.mcc || "",
    cnae: data.cnae || "",
    slug: data.slug || "",
    idSolicitationFee: data.idSolicitationFee || null,
  };
  await updateCategory(categoryUpdate.id, categoryUpdate);
}
