"use server";

import { db } from "@/lib/db";
import { merchantModules, modules } from "@/lib/db";
import { eq, and } from "drizzle-orm";

/**
 * Retorna os módulos autorizados de um EC/Correntista (merchant)
 * Apenas módulos com consentimento LGPD dado e ativo
 */
export async function getMerchantAuthorizedModules(merchantId: number) {
  try {
    const result = await db
      .select({
        moduleId: modules.id,
        moduleName: modules.name,
        moduleSlug: modules.slug,
        consentGiven: merchantModules.consentGiven,
        consentDate: merchantModules.consentDate,
      })
      .from(merchantModules)
      .innerJoin(modules, eq(merchantModules.idModule, modules.id))
      .where(
        and(
          eq(merchantModules.idMerchant, merchantId),
          eq(merchantModules.consentGiven, true),
          eq(merchantModules.active, true),
          eq(modules.active, true)
        )
      );

    return result;
  } catch (error) {
    console.error("Erro ao buscar módulos autorizados do EC/Correntista:", error);
    return [];
  }
}

/**
 * Retorna badges dos módulos de um EC/Correntista
 * Apenas módulos com consentimento LGPD dado e ativo
 */
export async function getMerchantModuleBadges(merchantId: number): Promise<string[]> {
  try {
    const authorizedModules = await getMerchantAuthorizedModules(merchantId);
    return authorizedModules.map((m) => m.moduleSlug || "").filter(Boolean);
  } catch (error) {
    console.error("Erro ao buscar badges dos módulos do EC/Correntista:", error);
    return [];
  }
}

/**
 * Verifica se EC/Correntista tem módulo específico autorizado
 */
export async function merchantHasModule(merchantId: number, moduleSlug: string): Promise<boolean> {
  try {
    const result = await db
      .select()
      .from(merchantModules)
      .innerJoin(modules, eq(merchantModules.idModule, modules.id))
      .where(
        and(
          eq(merchantModules.idMerchant, merchantId),
          eq(merchantModules.consentGiven, true),
          eq(merchantModules.active, true),
          eq(modules.active, true),
          eq(modules.slug, moduleSlug)
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("Erro ao verificar módulo do EC/Correntista:", error);
    return false;
  }
}

/**
 * Retorna módulos pendentes de consentimento de um EC/Correntista
 */
export async function getMerchantPendingModules(merchantId: number) {
  try {
    const result = await db
      .select({
        moduleId: modules.id,
        moduleName: modules.name,
        moduleSlug: modules.slug,
        notified: merchantModules.notified,
      })
      .from(merchantModules)
      .innerJoin(modules, eq(merchantModules.idModule, modules.id))
      .where(
        and(
          eq(merchantModules.idMerchant, merchantId),
          eq(merchantModules.consentGiven, false),
          eq(modules.active, true)
        )
      );

    return result;
  } catch (error) {
    console.error("Erro ao buscar módulos pendentes do EC/Correntista:", error);
    return [];
  }
}

