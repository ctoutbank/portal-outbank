"use server";

import { db } from "@/lib/db";
import { asc, count, desc, eq, ilike, or, and } from "drizzle-orm";
import { categories, solicitationBrandProductType, solicitationFee, solicitationFeeBrand } from "../../../../drizzle/schema";
import {insertSolicitationFee} from "@/features/solicitationfee/server/solicitationfee";


export interface CategoryList {
  categories: {
    id: number;
    slug: string | null;
    name: string | null;
    active: boolean | null;
    dtinsert: Date | null;
    dtupdate: Date | null;
    mcc: string | null;

    cnae: string | null;
    anticipation_risk_factor_cp: number | null;
    anticipation_risk_factor_cnp: number | null;
    waiting_period_cp: number | null;
    waiting_period_cnp: number | null;
  }[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  avgWaitingPeriodCp: number;
  avgWaitingPeriodCnp: number;
  avgAnticipationRiskFactorCnp: number;
}

export type CategoryInsert = typeof categories.$inferInsert;
export type CategoryDetail = typeof categories.$inferSelect;

export async function getCategories(
  search: string,
  page: number,
  pageSize: number,
  sortField: string = 'id',
  sortOrder: 'asc' | 'desc' = 'desc',
  name?: string,
  status?: string,
  mcc?: string,
  cnae?: string
): Promise<CategoryList> {
  const offset = (page - 1) * pageSize;

  const result = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      active: categories.active,
      dtinsert: categories.dtinsert,
      dtupdate: categories.dtupdate,
      mcc: categories.mcc,

      cnae: categories.cnae,
      anticipation_risk_factor_cp: categories.anticipationRiskFactorCp,
      anticipation_risk_factor_cnp: categories.anticipationRiskFactorCnp,
      waiting_period_cp: categories.waitingPeriodCp,
      waiting_period_cnp: categories.waitingPeriodCnp,
    })

    .from(categories)
    .where(
      and(
        or(
          ilike(categories.name, `%${search}%`),
          ilike(categories.mcc, `%${search}%`),
          ilike(categories.cnae, `%${search}%`)
        ),
        name ? ilike(categories.name, `%${name}%`) : undefined,
        status ? eq(categories.active, status === 'ACTIVE') : undefined,
        mcc ? ilike(categories.mcc, `%${mcc}%`) : undefined,
        cnae ? ilike(categories.cnae, `%${cnae}%`) : undefined
      )
    )
    .orderBy(
      sortField === 'name' 
        ? sortOrder === 'asc' 
          ? asc(categories.name) 
          : desc(categories.name)
        : desc(categories.id)
    )
    .limit(pageSize)
    .offset(offset);

  const totalCountResult = await db.select({ count: count() }).from(categories);
  const totalCount = totalCountResult[0]?.count || 0;

  console.log(sortField, sortOrder)

  const categoriesList = result.map((category) => ({
    id: category.id,
    slug: category.slug || "",
    name: category.name || "",
    active: category.active || false,
    dtinsert: category.dtinsert ? new Date(category.dtinsert) : new Date(),
    dtupdate: category.dtupdate ? new Date(category.dtupdate) : new Date(),
    mcc: category.mcc || "",

    cnae: category.cnae || "",
    anticipation_risk_factor_cp: category.anticipation_risk_factor_cp || 0,
    anticipation_risk_factor_cnp: category.anticipation_risk_factor_cnp || 0,
    waiting_period_cp: category.waiting_period_cp || 0,
    waiting_period_cnp: category.waiting_period_cnp || 0,
  }));

  return {
    categories: categoriesList,
    totalCount,
    activeCount: categoriesList.filter(c => c.active).length,
    inactiveCount: categoriesList.filter(c => !c.active).length,
    avgWaitingPeriodCp: calculateAverage(categoriesList, 'waiting_period_cp'),
    avgWaitingPeriodCnp: calculateAverage(categoriesList, 'waiting_period_cnp'),
    avgAnticipationRiskFactorCnp: calculateAverage(categoriesList, 'anticipation_risk_factor_cnp'),
  };
}

export async function getAllCnaeOptions(
  search: string 
): Promise<Array<{ id: number; name: string; cnae: string }>> {
    const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      cnae: categories.cnae,
    })
    .from(categories)
    .where(
      or(
        ilike(categories.name, `%${search}%`),
        ilike(categories.cnae, `%${search}%`)
      )
    )
    .orderBy(asc(categories.name))
    .limit(7);

    return rows.map(r => ({
        id: r.id,
        name: r.name || '',
        cnae: r.cnae || '',
    }));
}

function calculateAverage(categories: { waiting_period_cp: number | null; waiting_period_cnp: number | null; anticipation_risk_factor_cp: number | null; anticipation_risk_factor_cnp: number | null }[], field: keyof typeof categories[0]): number {
  const values = categories.map(c => Number(c[field])).filter(Boolean);
  return values.length ? values.reduce((a, b) => a + b) / values.length : 0;
}

export async function getCategoryById(
  id: number,
  
): Promise<CategoryDetail | null> {
  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id));
  console.log(result)
  return result[0] || null;
}

export async function insertCategory(category: CategoryInsert) {
  const result = await db
    .insert(categories)
    .values(category)
    .returning({ id: categories.id });


   

  return result[0].id;
}

export async function updateCategory(categoryId: number, category: CategoryDetail): Promise<void> {
  await db
    .update(categories)
    .set({
      name: category.name,
      active: category.active,
      dtupdate: new Date().toISOString(),
      mcc: category.mcc,
      cnae: category.cnae,
      anticipationRiskFactorCp: category.anticipationRiskFactorCp,
      anticipationRiskFactorCnp: category.anticipationRiskFactorCnp,
      waitingPeriodCp: category.waitingPeriodCp,
      waitingPeriodCnp: category.waitingPeriodCnp,
      idSolicitationFee: category.idSolicitationFee,
    })
    .where(eq(categories.id, categoryId));
}

export async function updateCategoryWithSolicitationFeeId(categoryId: number, solicitationFeeId: number): Promise<void> {
    await db
        .update(categories)
        .set({
            idSolicitationFee: solicitationFeeId,
            dtupdate: new Date().toISOString(),
        })
        .where(eq(categories.id, categoryId));
}

export async function deleteCategory(id: number): Promise<void> {
  await db.delete(categories).where(eq(categories.id, id));
}



// Tipos auxiliares para a estrutura de taxas
export interface FeeProductType {
    id: number;
    name: string | null;
    cardTransactionFee: number | null;
    nonCardTransactionFee: number | null;
    installmentTransactionFeeStart: number | null;
    installmentTransactionFeeEnd: number | null;
    transactionAnticipationMdr: number | null;
}

export interface FeeBrand {
    id: number;
    brand: string | null;
    productTypes: FeeProductType[];
}

export interface FeeDetail {
    id: number;
    cnpjQuantity: number | null;
    monthlyPosFee: string | number | null;
    averageTicket: string | number | null;
    description: string | null;
    cnaeInUse: boolean | null;
    compulsoryAnticipationConfig: number | null;
    eventualAnticipationFee: string | number | null;
    nonCardCompulsoryAnticipationConfig: number | null;
    nonCardEventualAnticipationFee: string | number | null;
    cardPixMdr: string | number | null;
    cardPixCeilingFee: string | number | null;
    cardPixMinimumCostFee: string | number | null;
    nonCardPixMdr: string | number | null;
    nonCardPixCeilingFee: string | number | null;
    nonCardPixMinimumCostFee: string | number | null;
    brands: FeeBrand[];
}
export async function getFeeDetailById(
    idSolicitationFee: number
): Promise<FeeDetail | null> {
    // Busca a solicitation_fee principal
    const feeResult = await db
        .select()
        .from(solicitationFee)
        .where(eq(solicitationFee.id, idSolicitationFee));
    if (!feeResult[0]) return null;
    const feeData = feeResult[0];

    // Busca as brands associadas
    const brandsResult = await db
        .select()
        .from(solicitationFeeBrand)
        .where(eq(solicitationFeeBrand.solicitationFeeId, idSolicitationFee));

    // Para cada brand, busca os productTypes
    const brands: FeeBrand[] = [];
    for (const brand of brandsResult) {
        const productTypesResult = await db
            .select()
            .from(solicitationBrandProductType)
            .where(eq(solicitationBrandProductType.solicitationFeeBrandId, brand.id));
        brands.push({
            id: brand.id,
            brand: brand.brand,
            productTypes: productTypesResult.map((pt) => ({
                id: pt.id,
                name: pt.productType,
                cardTransactionFee: Number(pt.feeAdmin),
                nonCardTransactionFee: Number(pt.noCardFeeAdmin),
                installmentTransactionFeeStart: Number(pt.transactionFeeStart),
                installmentTransactionFeeEnd: Number(pt.transactionFeeEnd),
                transactionAnticipationMdr: Number(pt.transactionAnticipationMdr),
            })),
        });
    }

    return {
        id: feeData.id,
        cnpjQuantity: feeData.cnpjQuantity,
        monthlyPosFee: feeData.monthlyPosFee,
        averageTicket: feeData.averageTicket,
        description: feeData.description,
        cnaeInUse: feeData.cnaeInUse,
        compulsoryAnticipationConfig: feeData.compulsoryAnticipationConfigAdmin,
        eventualAnticipationFee: feeData.eventualAnticipationFeeAdmin,
        cardPixMdr: feeData.cardPixMdrAdmin,
        cardPixCeilingFee: feeData.cardPixCeilingFeeAdmin,
        cardPixMinimumCostFee: feeData.cardPixMinimumCostFeeAdmin,
        nonCardPixMdr: feeData.nonCardPixMdrAdmin,
        nonCardPixCeilingFee: feeData.nonCardPixCeilingFeeAdmin,
        nonCardPixMinimumCostFee: feeData.nonCardPixMinimumCostFeeAdmin,
        brands,
        nonCardCompulsoryAnticipationConfig: feeData.compulsoryAnticipationConfig,
        nonCardEventualAnticipationFee: feeData.nonCardEventualAnticipationFeeAdmin
    };
}

export async function ensureSolicitationFeeForCategory(categoryId: number): Promise<number> {
    const category = await getCategoryById(categoryId);

    if (!category) {
        throw new Error("Categoria não encontrada");
    }

    // Se já tem ID, retorna direto
    if (category.idSolicitationFee) {
        return category.idSolicitationFee;
    }

    // Inserir nova SolicitationFee no banco
    const newFeeId = await insertSolicitationFee({
        idCustomers: null,
        status: "SEND_DOCUMENTS",
    });

    // Atualizar categoria com o novo idSolicitationFee
    await updateCategory(categoryId, {
        ...category,
        idSolicitationFee: newFeeId,
    });

    return newFeeId;
}
