"use server";

import { db } from "@/lib/db";
import { profiles, functions, profileFunctions } from "../../../../drizzle/schema";
import { eq, and, ilike, inArray } from "drizzle-orm";
import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/utils";

/**
 * Lista todas as funções (permissões) disponíveis, agrupadas por grupo
 */
export async function getAllFunctions() {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode listar funções");
  }

  const result = await db
    .select({
      id: functions.id,
      name: functions.name,
      group: functions.group,
      active: functions.active,
      dtinsert: functions.dtinsert,
      dtupdate: functions.dtupdate,
    })
    .from(functions)
    .where(eq(functions.active, true))
    .orderBy(functions.group, functions.name);

  // Agrupar por grupo
  const grouped = result.reduce((acc, func) => {
    const group = func.group || "Outros";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(func);
    return acc;
  }, {} as Record<string, typeof result>);

  return {
    all: result,
    grouped,
    groups: Object.keys(grouped),
  };
}

/**
 * Obtém as permissões atribuídas a uma categoria
 */
export async function getCategoryPermissions(categoryId: number) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode visualizar permissões de categorias");
  }

  const result = await db
    .select({
      id: profileFunctions.id,
      idFunction: profileFunctions.idFunctions,
      functionName: functions.name,
      functionGroup: functions.group,
      active: profileFunctions.active,
    })
    .from(profileFunctions)
    .leftJoin(functions, eq(profileFunctions.idFunctions, functions.id))
    .where(and(eq(profileFunctions.idProfile, categoryId), eq(profileFunctions.active, true)));

  return result;
}

/**
 * Atribui permissões a uma categoria
 * Remove todas as permissões atuais e adiciona as novas
 */
export async function updateCategoryPermissions(
  categoryId: number,
  functionIds: number[]
) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode atualizar permissões de categorias");
  }

  // Verificar se categoria existe
  const category = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, categoryId))
    .limit(1);

  if (!category || category.length === 0) {
    throw new Error("Categoria não encontrada");
  }

  // Verificar se é Super Admin (opcional: permitir edição de permissões)
  const profileName = category[0].name?.toUpperCase() || "";
  const isSuperAdmin = profileName.includes("SUPER_ADMIN") || profileName.includes("SUPER");

  // Desativar todas as permissões atuais (soft delete)
  await db
    .update(profileFunctions)
    .set({ active: false, dtupdate: new Date().toISOString() })
    .where(eq(profileFunctions.idProfile, categoryId));

  // Se não é Super Admin e não há permissões, isso é normal
  // Se é Super Admin, pode ou não ter permissões explícitas (sempre tem acesso total)

  // Adicionar novas permissões
  if (functionIds.length > 0) {
    const slug = generateSlug();
    const now = new Date().toISOString();

    // Verificar quais já existem (para reativar)
    const existing = await db
      .select()
      .from(profileFunctions)
      .where(
        and(
          eq(profileFunctions.idProfile, categoryId),
          inArray(profileFunctions.idFunctions, functionIds)
        )
      );

    const existingFunctionIds = existing.map((e) => Number(e.idFunctions));
    const newFunctionIds = functionIds.filter((id) => !existingFunctionIds.includes(id));

    // Reativar existentes
    if (existing.length > 0) {
      await db
        .update(profileFunctions)
        .set({ active: true, dtupdate: now })
        .where(
          and(
            eq(profileFunctions.idProfile, categoryId),
            inArray(profileFunctions.idFunctions, existingFunctionIds)
          )
        );
    }

    // Inserir novas
    if (newFunctionIds.length > 0) {
      const values = newFunctionIds.map((idFunction) => ({
        slug: generateSlug(),
        idProfile: categoryId,
        idFunctions: idFunction,
        active: true,
        dtinsert: now,
        dtupdate: now,
      }));

      await db.insert(profileFunctions).values(values);
    }
  }

  revalidatePath(`/config/categories/${categoryId}`);
  revalidatePath("/config/categories");
  return { success: true };
}




