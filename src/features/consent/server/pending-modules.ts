"use server";

import { db } from "@/lib/db";
import { merchantModules, modules, merchants, userMerchants, users } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";

/**
 * Retorna módulos pendentes de consentimento para um usuário
 */
export async function getPendingModules(userId: number) {
  try {
    // Buscar todos os merchants vinculados ao usuário
    const userMerchantsData = await db
      .select({
        merchantId: userMerchants.idMerchant,
      })
      .from(userMerchants)
      .where(
        and(
          eq(userMerchants.idUser, userId),
          eq(userMerchants.active, true)
        )
      );

    if (userMerchantsData.length === 0) {
      return [];
    }

    const merchantIds = userMerchantsData.map((um) => um.merchantId);

    // Buscar módulos pendentes de consentimento para estes merchants
    const pendingModules = await db
      .select({
        merchantModuleId: merchantModules.id,
        merchantId: merchantModules.idMerchant,
        moduleId: merchantModules.idModule,
        moduleName: modules.name,
        moduleSlug: modules.slug,
        merchantName: merchants.name,
        notified: merchantModules.notified,
      })
      .from(merchantModules)
      .innerJoin(modules, eq(merchantModules.idModule, modules.id))
      .innerJoin(merchants, eq(merchantModules.idMerchant, merchants.id))
      .where(
        and(
          inArray(merchantModules.idMerchant, merchantIds),
          eq(merchantModules.consentGiven, false),
          eq(merchantModules.active, false),
          eq(modules.active, true)
        )
      );

    return pendingModules;
  } catch (error) {
    console.error("Erro ao buscar módulos pendentes:", error);
    return [];
  }
}

