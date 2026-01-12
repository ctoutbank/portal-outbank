"use server";

import { db } from "@/db/drizzle";
import { mcc } from "@/db/drizzle";
import { eq, and, sql, ilike, or, desc, asc } from "drizzle-orm";
import type { InsertMcc, SelectMcc } from "@/db/drizzle";
import { validateDeletePermission } from "@/lib/permissions/check-permissions";

export type NivelRisco = "baixo" | "medio" | "alto";
export type TipoLiquidacao = "D0" | "D1" | "D2" | "D14" | "D30" | "sob_analise";

export interface MccData {
  id: number;
  code: string;
  description: string;
  categoria: string;
  subcategoria: string | null;
  nivelRisco: NivelRisco;
  tipoLiquidacao: TipoLiquidacao;
  isActive: boolean;
  exigeAnaliseManual: boolean;
  observacoesRegulatorias: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export async function getMccByCode(code: string): Promise<MccData | null> {
  const result = await db
    .select()
    .from(mcc)
    .where(eq(mcc.code, code))
    .limit(1);

  return result[0] as MccData || null;
}

export async function getMccById(id: number): Promise<MccData | null> {
  const result = await db
    .select()
    .from(mcc)
    .where(eq(mcc.id, id))
    .limit(1);

  return result[0] as MccData || null;
}

export async function getActiveMccs(): Promise<MccData[]> {
  const result = await db
    .select()
    .from(mcc)
    .where(eq(mcc.isActive, true))
    .orderBy(mcc.code);

  return result as MccData[];
}

export async function getMccs(
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  categoria?: string,
  nivelRisco?: NivelRisco,
  tipoLiquidacao?: TipoLiquidacao,
  isActive?: boolean,
  sortField: string = "code",
  sortOrder: "asc" | "desc" = "asc"
) {
  const offset = (page - 1) * pageSize;
  
  const conditions = [];
  
  if (search) {
    conditions.push(
      or(
        ilike(mcc.description, `%${search}%`),
        ilike(mcc.code, `%${search}%`),
        ilike(mcc.categoria, `%${search}%`)
      )!
    );
  }
  
  if (categoria) {
    conditions.push(eq(mcc.categoria, categoria));
  }

  if (nivelRisco) {
    conditions.push(eq(mcc.nivelRisco, nivelRisco));
  }

  if (tipoLiquidacao) {
    conditions.push(eq(mcc.tipoLiquidacao, tipoLiquidacao));
  }

  if (isActive !== undefined) {
    conditions.push(eq(mcc.isActive, isActive));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(mcc)
    .where(whereClause);

  const totalCount = Number(totalResult[0]?.count || 0);

  const sortColumn = {
    code: mcc.code,
    description: mcc.description,
    categoria: mcc.categoria,
    nivelRisco: mcc.nivelRisco,
    tipoLiquidacao: mcc.tipoLiquidacao,
    isActive: mcc.isActive,
  }[sortField] || mcc.code;

  const orderFn = sortOrder === "desc" ? desc : asc;

  const data = await db
    .select()
    .from(mcc)
    .where(whereClause)
    .orderBy(orderFn(sortColumn))
    .limit(pageSize)
    .offset(offset);

  return {
    data: data as MccData[],
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

export async function getCategorias(): Promise<string[]> {
  const result = await db
    .selectDistinct({ categoria: mcc.categoria })
    .from(mcc)
    .where(eq(mcc.isActive, true))
    .orderBy(mcc.categoria);

  return result.map(r => r.categoria);
}

export interface CreateMccInput {
  code: string;
  description: string;
  categoria: string;
  subcategoria?: string;
  nivelRisco: NivelRisco;
  tipoLiquidacao: TipoLiquidacao;
  isActive?: boolean;
  exigeAnaliseManual?: boolean;
  observacoesRegulatorias?: string;
}

export async function createMcc(data: CreateMccInput): Promise<{ success: boolean; data?: MccData; error?: string }> {
  try {
    const existing = await getMccByCode(data.code);
    if (existing) {
      return { success: false, error: "Já existe um MCC com este código" };
    }

    const result = await db
      .insert(mcc)
      .values({
        code: data.code,
        description: data.description,
        categoria: data.categoria,
        subcategoria: data.subcategoria || null,
        nivelRisco: data.nivelRisco,
        tipoLiquidacao: data.tipoLiquidacao,
        isActive: data.isActive ?? true,
        exigeAnaliseManual: data.exigeAnaliseManual ?? false,
        observacoesRegulatorias: data.observacoesRegulatorias || null,
      })
      .returning();

    return { success: true, data: result[0] as MccData };
  } catch (error) {
    console.error("Erro ao criar MCC:", error);
    return { success: false, error: "Erro ao criar MCC" };
  }
}

export interface UpdateMccInput {
  description?: string;
  categoria?: string;
  subcategoria?: string;
  nivelRisco?: NivelRisco;
  tipoLiquidacao?: TipoLiquidacao;
  isActive?: boolean;
  exigeAnaliseManual?: boolean;
  observacoesRegulatorias?: string;
}

export async function updateMcc(
  id: number,
  data: UpdateMccInput
): Promise<{ success: boolean; data?: MccData; error?: string }> {
  try {
    const result = await db
      .update(mcc)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(mcc.id, id))
      .returning();

    if (result.length === 0) {
      return { success: false, error: "MCC não encontrado" };
    }

    return { success: true, data: result[0] as MccData };
  } catch (error) {
    console.error("Erro ao atualizar MCC:", error);
    return { success: false, error: "Erro ao atualizar MCC" };
  }
}

export async function deleteMcc(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const canDelete = await validateDeletePermission();
    if (!canDelete) {
      return { success: false, error: "Apenas Super Admin pode excluir MCCs" };
    }

    const result = await db
      .delete(mcc)
      .where(eq(mcc.id, id))
      .returning();

    if (result.length === 0) {
      return { success: false, error: "MCC não encontrado" };
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir MCC:", error);
    return { success: false, error: "Erro ao excluir MCC" };
  }
}

export async function toggleMccStatus(id: number): Promise<{ success: boolean; data?: MccData; error?: string }> {
  try {
    const existing = await getMccById(id);
    if (!existing) {
      return { success: false, error: "MCC não encontrado" };
    }

    const result = await db
      .update(mcc)
      .set({
        isActive: !existing.isActive,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(mcc.id, id))
      .returning();

    return { success: true, data: result[0] as MccData };
  } catch (error) {
    console.error("Erro ao alterar status do MCC:", error);
    return { success: false, error: "Erro ao alterar status" };
  }
}

// Funções para sincronização com Dock

export interface InsertMccDockInput {
  code: string;
  description: string;
  mccGroupId?: number | null;
  availabilityDate?: string | null;
  databaseOperation?: string;
  isActive?: boolean;
}

/**
 * Insere um MCC (usado na sincronização com Dock)
 */
export async function insertMcc(data: InsertMccDockInput): Promise<SelectMcc> {
  const result = await db
    .insert(mcc)
    .values({
      code: data.code,
      description: data.description,
      categoria: "Dock Sync", // Categoria padrão para MCCs sincronizados
      nivelRisco: "baixo",
      tipoLiquidacao: "D2",
      isActive: data.isActive ?? true,
      exigeAnaliseManual: false,
    })
    .returning();

  return result[0];
}

/**
 * Desativa um MCC por código (soft delete - usado na sincronização com Dock)
 */
export async function deactivateMcc(code: string): Promise<SelectMcc | null> {
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
