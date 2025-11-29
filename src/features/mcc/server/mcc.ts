"use server";

import { db } from "@/db/drizzle";
import { mcc, mccGroups } from "@/db/drizzle";
import { eq, and, sql, ilike, or } from "drizzle-orm";
import type { InsertMcc, SelectMcc } from "@/db/drizzle";

/**
 * Busca um MCC por código
 */
export async function getMccByCode(code: number): Promise<SelectMcc | null> {
  const result = await db
    .select()
    .from(mcc)
    .where(eq(mcc.code, code))
    .limit(1);

  return result[0] || null;
}

/**
 * Busca um MCC por ID
 */
export async function getMccById(id: number): Promise<SelectMcc | null> {
  const result = await db
    .select()
    .from(mcc)
    .where(eq(mcc.id, id))
    .limit(1);

  return result[0] || null;
}

/**
 * Busca todos os MCCs ativos com informações do grupo
 */
export async function getActiveMccsWithGroup() {
  return await db
    .select({
      id: mcc.id,
      code: mcc.code,
      description: mcc.description,
      mccGroupId: mcc.mccGroupId,
      availabilityDate: mcc.availabilityDate,
      databaseOperation: mcc.databaseOperation,
      isActive: mcc.isActive,
      createdAt: mcc.createdAt,
      updatedAt: mcc.updatedAt,
      groupDescription: mccGroups.description,
      groupId: mccGroups.id,
    })
    .from(mcc)
    .innerJoin(mccGroups, eq(mcc.mccGroupId, mccGroups.id))
    .where(eq(mcc.isActive, true))
    .orderBy(mcc.code);
}

/**
 * Busca MCCs com paginação e filtros
 */
export async function getMccs(
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  groupId?: number
) {
  const offset = (page - 1) * pageSize;
  
  // Aplicar filtros
  const conditions = [eq(mcc.isActive, true)];
  
  if (search) {
    // Buscar por descrição ou código (convertendo código para string)
    conditions.push(
      or(
        ilike(mcc.description, `%${search}%`),
        sql`${mcc.code}::text ILIKE ${`%${search}%`}`
      )!
    );
  }
  
  if (groupId) {
    conditions.push(eq(mcc.mccGroupId, groupId));
  }

  // Buscar total
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(mcc)
    .where(and(...conditions));

  const totalCount = Number(totalResult[0]?.count || 0);

  // Buscar dados paginados
  const data = await db
    .select({
      id: mcc.id,
      code: mcc.code,
      description: mcc.description,
      mccGroupId: mcc.mccGroupId,
      availabilityDate: mcc.availabilityDate,
      databaseOperation: mcc.databaseOperation,
      isActive: mcc.isActive,
      createdAt: mcc.createdAt,
      updatedAt: mcc.updatedAt,
      groupDescription: mccGroups.description,
      groupId: mccGroups.id,
    })
    .from(mcc)
    .innerJoin(mccGroups, eq(mcc.mccGroupId, mccGroups.id))
    .where(and(...conditions))
    .orderBy(mcc.code)
    .limit(pageSize)
    .offset(offset);

  return {
    data,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

/**
 * Insere um novo MCC
 */
export async function insertMcc(data: InsertMcc): Promise<SelectMcc> {
  const result = await db
    .insert(mcc)
    .values({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .returning();

  return result[0];
}

/**
 * Atualiza um MCC existente
 */
export async function updateMcc(
  code: number,
  data: Partial<Omit<InsertMcc, "code" | "createdAt">>
): Promise<SelectMcc | null> {
  const result = await db
    .update(mcc)
    .set({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(mcc.code, code))
    .returning();

  return result[0] || null;
}

/**
 * Marca um MCC como inativo (soft delete)
 */
export async function deactivateMcc(code: number): Promise<SelectMcc | null> {
  const result = await db
    .update(mcc)
    .set({
      isActive: false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(mcc.code, code))
    .returning();

  return result[0] || null;
}

