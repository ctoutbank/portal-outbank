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

    const merchantIds = userMerchantsData
      .map((um) => um.merchantId)
      .filter((id): id is number => id !== null && id !== undefined);

    if (merchantIds.length === 0) {
      return [];
    }

    // Buscar módulos pendentes de consentimento para estes merchants
    const pendingModulesRaw = await db
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

    // Filtrar e garantir que os valores necessários não sejam null
    const pendingModules = pendingModulesRaw
      .filter((pm): pm is typeof pm & { 
        merchantId: number; 
        moduleId: number;
        merchantModuleId: number;
      } => 
        pm.merchantModuleId !== null &&
        pm.merchantModuleId !== undefined &&
        pm.merchantId !== null && 
        pm.merchantId !== undefined && 
        pm.moduleId !== null && 
        pm.moduleId !== undefined
      )
      .map((pm) => ({
        merchantModuleId: pm.merchantModuleId,
        merchantId: pm.merchantId as number,
        moduleId: pm.moduleId as number,
        moduleName: pm.moduleName,
        moduleSlug: pm.moduleSlug,
        merchantName: pm.merchantName,
        notified: pm.notified,
      }));

    return pendingModules;
  } catch (error) {
    console.error("Erro ao buscar módulos pendentes:", error);
    return [];
  }
}

