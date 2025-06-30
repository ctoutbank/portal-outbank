
import { CategoriesSchema } from "../schema/schema";
import {
  CategoryDetail,
  CategoryInsert,
  insertCategory,
  updateCategory,
} from "../server/category";
import { toast } from "sonner"

export async function insertCategoryFormAction(data: CategoriesSchema) {
  const categoryInsert: CategoryInsert = {
    slug: data.slug || "",
    name: data.name || "",
    active: data.active ?? true,
    dtinsert: (data.dtinsert || new Date()).toISOString(),
    dtupdate: (data.dtupdate || new Date()).toISOString(),
    mcc: data.mcc || "",
    cnae: data.cnae || "",
    anticipationRiskFactorCp: Number(data.anticipation_risk_factor_cp) ?? 0,
    anticipationRiskFactorCnp: Number(data.anticipation_risk_factor_cnp) ?? 0,
    waitingPeriodCp: Number(data.waiting_period_cp) ?? 0,
    waitingPeriodCnp: Number(data.waiting_period_cnp) ?? 0,
  };

  const newId = await insertCategory(categoryInsert);
  toast.success("CNAE cadastrado com sucesso");

  
  return newId;
}

export async function updateCategoryFormAction(data: CategoriesSchema) {
  if (!data.id) {
    throw new Error("Category ID is required to update");
  }
  const categoryUpdate: CategoryDetail = {
    id: data.id,
    name: data.name || "",
    active: data.active ?? true,
    dtinsert: (data.dtinsert || new Date()).toISOString(),
    dtupdate: (data.dtupdate || new Date()).toISOString(),
    anticipationRiskFactorCp: Number(data.anticipation_risk_factor_cp),
    anticipationRiskFactorCnp: Number(data.anticipation_risk_factor_cnp),
    waitingPeriodCp: Number(data.waiting_period_cp),
    waitingPeriodCnp: Number(data.waiting_period_cnp),
    mcc: data.mcc || "",
    cnae: data.cnae || "",
    slug: data.slug || "",
  };
  await updateCategory(categoryUpdate);
  toast.success("CNAE atualizado com sucesso");
 
}
