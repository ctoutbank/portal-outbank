"use server";

import { db } from "@/lib/db";
import { customerModules, modules } from "@/lib/db";
import { eq, and } from "drizzle-orm";

/**
 * Retorna os módulos ativos de um ISO (customer)
 */
export async function getCustomerModules(customerId: number) {
  try {
    const result = await db
      .select({
        moduleId: modules.id,
        moduleName: modules.name,
        moduleSlug: modules.slug,
      })
      .from(customerModules)
      .innerJoin(modules, eq(customerModules.idModule, modules.id))
      .where(
        and(
          eq(customerModules.idCustomer, customerId),
          eq(customerModules.active, true),
          eq(modules.active, true)
        )
      );

    return result;
  } catch (error) {
    console.error("Erro ao buscar módulos do ISO:", error);
    return [];
  }
}

/**
 * Retorna os slugs dos módulos ativos de um ISO
 */
export async function getCustomerModuleSlugs(customerId: number): Promise<string[]> {
  try {
    const modules = await getCustomerModules(customerId);
    return modules.map((m) => m.moduleSlug || "").filter(Boolean);
  } catch (error) {
    console.error("Erro ao buscar slugs dos módulos do ISO:", error);
    return [];
  }
}

/**
 * Verifica se ISO tem módulo específico
 */
export async function hasModule(customerId: number, moduleSlug: string): Promise<boolean> {
  try {
    const result = await db
      .select()
      .from(customerModules)
      .innerJoin(modules, eq(customerModules.idModule, modules.id))
      .where(
        and(
          eq(customerModules.idCustomer, customerId),
          eq(customerModules.active, true),
          eq(modules.active, true),
          eq(modules.slug, moduleSlug)
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("Erro ao verificar módulo do ISO:", error);
    return false;
  }
}

