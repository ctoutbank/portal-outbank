"use server";

import { db } from "@/db/drizzle";
import { mccGroups } from "@/db/drizzle";
import { eq } from "drizzle-orm";
import type { InsertMccGroup, SelectMccGroup } from "@/db/drizzle";

/**
 * Busca um grupo MCC por ID
 */
export async function getMccGroupById(id: number): Promise<SelectMccGroup | null> {
  const result = await db
    .select()
    .from(mccGroups)
    .where(eq(mccGroups.id, id))
    .limit(1);

  return result[0] || null;
}

/**
 * Busca todos os grupos MCC ativos
 */
export async function getActiveMccGroups(): Promise<SelectMccGroup[]> {
  return await db
    .select()
    .from(mccGroups)
    .where(eq(mccGroups.isActive, true))
    .orderBy(mccGroups.id);
}

/**
 * Busca todos os grupos MCC (ativos e inativos)
 */
export async function getAllMccGroups(): Promise<SelectMccGroup[]> {
  return await db
    .select()
    .from(mccGroups)
    .orderBy(mccGroups.id);
}

/**
 * Insere um novo grupo MCC
 */
export async function insertMccGroup(data: InsertMccGroup): Promise<SelectMccGroup> {
  const result = await db
    .insert(mccGroups)
    .values({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .returning();

  return result[0];
}

/**
 * Atualiza um grupo MCC existente
 */
export async function updateMccGroup(
  id: number,
  data: Partial<Omit<InsertMccGroup, "id" | "createdAt">>
): Promise<SelectMccGroup | null> {
  const result = await db
    .update(mccGroups)
    .set({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(mccGroups.id, id))
    .returning();

  return result[0] || null;
}

/**
 * Marca um grupo MCC como inativo (soft delete)
 */
export async function deactivateMccGroup(id: number): Promise<SelectMccGroup | null> {
  const result = await db
    .update(mccGroups)
    .set({
      isActive: false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(mccGroups.id, id))
    .returning();

  return result[0] || null;
}

