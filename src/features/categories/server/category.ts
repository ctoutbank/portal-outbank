"use server";

import { db } from "@/lib/db";
import { asc, count, desc, eq, ilike, or, and } from "drizzle-orm";
import { categories } from "../../../../drizzle/schema";


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
  avgAnticipationRiskFactorCp: number;
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
    avgAnticipationRiskFactorCp: calculateAverage(categoriesList, 'anticipation_risk_factor_cp'),
    avgAnticipationRiskFactorCnp: calculateAverage(categoriesList, 'anticipation_risk_factor_cnp'),
  };
}

function calculateAverage(categories: { waiting_period_cp: number | null; waiting_period_cnp: number | null; anticipation_risk_factor_cp: number | null; anticipation_risk_factor_cnp: number | null }[], field: keyof typeof categories[0]): number {
  const values = categories.map(c => Number(c[field])).filter(Boolean);
  return values.length ? values.reduce((a, b) => a + b) / values.length : 0;
}

export async function getCategoryById(
  id: number
): Promise<CategoryDetail | null> {
  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id));

  return result[0] || null;
}

export async function insertCategory(category: CategoryInsert) {
  const result = await db
    .insert(categories)
    .values(category)
    .returning({ id: categories.id });


   

  return result[0].id;
}

export async function updateCategory(category: CategoryDetail): Promise<void> {
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
    })
    .where(eq(categories.id, category.id));
   
}

export async function deleteCategory(id: number): Promise<void> {
  await db.delete(categories).where(eq(categories.id, id));
}
