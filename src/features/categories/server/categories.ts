"use server";

import { db } from "@/lib/db";
import { profiles, profileFunctions, users } from "../../../../drizzle/schema";
import { eq, and, ilike, sql, desc, asc } from "drizzle-orm";
import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/utils";

/**
 * Lista todas as categorias (profiles) do sistema
 * Super Admin vê todas, Admin vê apenas as permitidas
 */
export async function getAllCategories() {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode listar categorias");
  }

  const result = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      description: profiles.description,
      active: profiles.active,
      restrictCustomerData: profiles.restrictCustomerData,
      isSalesAgent: profiles.isSalesAgent,
      dtinsert: profiles.dtinsert,
      dtupdate: profiles.dtupdate,
    })
    .from(profiles)
    .orderBy(desc(profiles.id));

  // Contar usuários por categoria
  const categoriesWithCount = await Promise.all(
    result.map(async (category) => {
      const userCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.idProfile, category.id));

      return {
        ...category,
        userCount: userCount[0]?.count || 0,
      };
    })
  );

  return categoriesWithCount;
}

/**
 * Busca uma categoria por ID
 */
export async function getCategoryById(id: number) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode visualizar categorias");
  }

  const result = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      description: profiles.description,
      active: profiles.active,
      restrictCustomerData: profiles.restrictCustomerData,
      isSalesAgent: profiles.isSalesAgent,
      dtinsert: profiles.dtinsert,
      dtupdate: profiles.dtupdate,
    })
    .from(profiles)
    .where(eq(profiles.id, id))
    .limit(1);

  if (!result || result.length === 0) {
    throw new Error("Categoria não encontrada");
  }

  // Contar usuários
  const userCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.idProfile, id));

  return {
    ...result[0],
    userCount: userCount[0]?.count || 0,
  };
}

/**
 * Cria uma nova categoria
 */
export async function createCategory(data: {
  name: string;
  description?: string;
  restrictCustomerData?: boolean;
  isSalesAgent?: boolean;
}) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode criar categorias");
  }

  if (!data.name || data.name.trim().length === 0) {
    throw new Error("Nome da categoria é obrigatório");
  }

  // Verificar se já existe categoria com mesmo nome
  const existing = await db
    .select()
    .from(profiles)
    .where(ilike(profiles.name, data.name.trim()))
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error("Já existe uma categoria com este nome");
  }

  const slug = generateSlug();
  const now = new Date().toISOString();

  const result = await db
    .insert(profiles)
    .values({
      slug,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      restrictCustomerData: data.restrictCustomerData || false,
      isSalesAgent: data.isSalesAgent || false,
      active: true,
      dtinsert: now,
      dtupdate: now,
    })
    .returning({ id: profiles.id });

  revalidatePath("/config/categories");
  return result[0];
}

/**
 * Atualiza uma categoria existente
 */
export async function updateCategory(
  id: number,
  data: {
    name?: string;
    description?: string;
    restrictCustomerData?: boolean;
    isSalesAgent?: boolean;
    active?: boolean;
  }
) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode atualizar categorias");
  }

  // Verificar se categoria existe
  const category = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, id))
    .limit(1);

  if (!category || category.length === 0) {
    throw new Error("Categoria não encontrada");
  }

  // Verificar se é Super Admin (não permitir editar)
  const profileName = category[0].name?.toUpperCase() || "";
  if (profileName.includes("SUPER_ADMIN") || profileName.includes("SUPER")) {
    // Permitir apenas atualizar descrição e active, não name
    const updateData: any = {
      dtupdate: new Date().toISOString(),
    };

    if (data.description !== undefined) {
      updateData.description = data.description.trim() || null;
    }
    if (data.active !== undefined) {
      updateData.active = data.active;
    }
    if (data.restrictCustomerData !== undefined) {
      updateData.restrictCustomerData = data.restrictCustomerData;
    }

    await db.update(profiles).set(updateData).where(eq(profiles.id, id));
    revalidatePath("/config/categories");
    return { id };
  }

  // Para outras categorias, permitir editar tudo
  const updateData: any = {
    dtupdate: new Date().toISOString(),
  };

  if (data.name !== undefined && data.name.trim().length > 0) {
    // Verificar se nome já existe em outra categoria
    const existing = await db
      .select()
      .from(profiles)
      .where(and(ilike(profiles.name, data.name.trim()), sql`${profiles.id} != ${id}`))
      .limit(1);

    if (existing && existing.length > 0) {
      throw new Error("Já existe uma categoria com este nome");
    }

    updateData.name = data.name.trim();
  }

  if (data.description !== undefined) {
    updateData.description = data.description.trim() || null;
  }

  if (data.restrictCustomerData !== undefined) {
    updateData.restrictCustomerData = data.restrictCustomerData;
  }

  if (data.isSalesAgent !== undefined) {
    updateData.isSalesAgent = data.isSalesAgent;
  }

  if (data.active !== undefined) {
    updateData.active = data.active;
  }

  await db.update(profiles).set(updateData).where(eq(profiles.id, id));
  revalidatePath("/config/categories");
  revalidatePath(`/config/categories/${id}`);
  return { id };
}

/**
 * Deleta uma categoria
 */
export async function deleteCategory(id: number) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode deletar categorias");
  }

  // Verificar se categoria existe
  const category = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, id))
    .limit(1);

  if (!category || category.length === 0) {
    throw new Error("Categoria não encontrada");
  }

  // Não permitir deletar Super Admin
  const profileName = category[0].name?.toUpperCase() || "";
  if (profileName.includes("SUPER_ADMIN") || profileName.includes("SUPER")) {
    throw new Error("Não é possível deletar a categoria Super Admin");
  }

  // Verificar se há usuários atribuídos
  const userCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.idProfile, id));

  if (userCount[0]?.count && userCount[0].count > 0) {
    throw new Error(
      `Não é possível deletar a categoria. Existem ${userCount[0].count} usuário(s) atribuído(s) a ela.`
    );
  }

  // Deletar associações de permissões primeiro
  await db.delete(profileFunctions).where(eq(profileFunctions.idProfile, id));

  // Deletar categoria
  await db.delete(profiles).where(eq(profiles.id, id));

  revalidatePath("/config/categories");
  return { id };
}





