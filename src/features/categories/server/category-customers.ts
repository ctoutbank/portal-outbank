"use server";

import { db } from "@/lib/db";
import { profiles, profileCustomers, customers } from "../../../../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/utils";

/**
 * Obtém os ISOs atribuídos a uma categoria
 */
export async function getCategoryCustomers(categoryId: number) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode visualizar ISOs de categorias");
  }

  try {
    const result = await db
      .select({
        id: profileCustomers.id,
        idCustomer: profileCustomers.idCustomer,
        customerName: customers.name,
        active: profileCustomers.active,
      })
      .from(profileCustomers)
      .leftJoin(customers, eq(profileCustomers.idCustomer, customers.id))
      .where(
        and(
          eq(profileCustomers.idProfile, categoryId),
          eq(profileCustomers.active, true)
        )
      );

    return result;
  } catch (error: any) {
    // Se a tabela não existe, retornar array vazio
    if (
      error?.code === "42P01" ||
      error?.message?.includes("does not exist") ||
      (error?.message?.includes("relation") &&
        error?.message?.includes("profile_customers"))
    ) {
      console.warn(
        "Tabela profile_customers não existe ainda. Retornando array vazio. Execute a migration 0004_add_profile_customers_table.sql"
      );
      return [];
    }
    console.error("Erro ao buscar ISOs da categoria:", error);
    throw error;
  }
}

/**
 * Atualiza os ISOs atribuídos a uma categoria
 * Remove todos os ISOs atuais (soft delete) e adiciona os novos
 */
export async function updateCategoryCustomers(
  categoryId: number,
  customerIds: number[]
) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode atualizar ISOs de categorias");
  }

  try {
    // Verificar se categoria existe
    const category = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, categoryId))
      .limit(1);

    if (!category || category.length === 0) {
      throw new Error("Categoria não encontrada");
    }

    // Desativar todos os ISOs atuais (soft delete)
    try {
      await db
        .update(profileCustomers)
        .set({
          active: false,
          dtupdate: new Date().toISOString(),
        })
        .where(eq(profileCustomers.idProfile, categoryId));
    } catch (error: any) {
      // Se a tabela não existe, não fazer nada (será criada ao inserir novos)
      if (
        error?.code === "42P01" ||
        error?.message?.includes("does not exist") ||
        (error?.message?.includes("relation") &&
          error?.message?.includes("profile_customers"))
      ) {
        console.warn(
          "Tabela profile_customers não existe ainda. Será criada ao inserir novos registros."
        );
      } else {
        throw error;
      }
    }

    // Adicionar novos ISOs
    if (customerIds.length > 0) {
      const now = new Date().toISOString();

      // Verificar quais já existem (para reativar)
      let existing: typeof profileCustomers.$inferSelect[] = [];
      try {
        existing = await db
          .select()
          .from(profileCustomers)
          .where(
            and(
              eq(profileCustomers.idProfile, categoryId),
              inArray(profileCustomers.idCustomer, customerIds)
            )
          );
      } catch (error: any) {
        // Se a tabela não existe, não fazer nada (será criada ao inserir novos)
        if (
          error?.code === "42P01" ||
          error?.message?.includes("does not exist") ||
          (error?.message?.includes("relation") &&
            error?.message?.includes("profile_customers"))
        ) {
          // Tabela não existe, continuar para criar novos registros
        } else {
          throw error;
        }
      }

      const existingCustomerIds = existing.map((e) => Number(e.idCustomer));
      const newCustomerIds = customerIds.filter(
        (id) => !existingCustomerIds.includes(id)
      );

      // Reativar existentes
      if (existing.length > 0) {
        await db
          .update(profileCustomers)
          .set({
            active: true,
            dtupdate: now,
          })
          .where(
            and(
              eq(profileCustomers.idProfile, categoryId),
              inArray(profileCustomers.idCustomer, existingCustomerIds)
            )
          );
      }

      // Inserir novos
      if (newCustomerIds.length > 0) {
        const values = newCustomerIds.map((idCustomer) => ({
          slug: generateSlug(),
          idProfile: categoryId,
          idCustomer,
          active: true,
          dtinsert: now,
          dtupdate: now,
        }));

        await db.insert(profileCustomers).values(values);
      }
    }

    revalidatePath(`/config/categories/${categoryId}`);
    revalidatePath("/config/categories");
    return { success: true };
  } catch (error: any) {
    // Se a tabela não existe, retornar erro mais amigável
    if (
      error?.code === "42P01" ||
      error?.message?.includes("does not exist") ||
      (error?.message?.includes("relation") &&
        error?.message?.includes("profile_customers"))
    ) {
      console.error(
        "Tabela profile_customers não existe. Execute a migration 0004_add_profile_customers_table.sql"
      );
      throw new Error(
        "Tabela profile_customers não existe. Execute a migration 0004_add_profile_customers_table.sql no banco de dados de produção."
      );
    }
    console.error("Erro ao atualizar ISOs da categoria:", error);
    throw error;
  }
}


