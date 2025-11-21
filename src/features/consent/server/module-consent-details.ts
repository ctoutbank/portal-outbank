"use server";

import { db } from "@/lib/db";
import { merchantModules, modules, merchants, userMerchants } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";

/**
 * Retorna detalhes do módulo e merchant para consentimento
 */
export async function getModuleConsentDetails(
  moduleId: number,
  merchantId?: number,
  userId?: number
) {
  try {
    // Buscar dados do módulo
    const moduleData = await db
      .select()
      .from(modules)
      .where(eq(modules.id, moduleId))
      .limit(1);

    if (!moduleData.length) {
      return null;
    }

    const module = moduleData[0];

    // Se merchantId não foi fornecido e temos userId, buscar merchants do usuário
    let merchantIdToUse = merchantId;
    
    if (!merchantIdToUse && userId) {
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
        )
        .limit(1);

      if (userMerchantsData.length > 0) {
        const merchantId = userMerchantsData[0].merchantId;
        merchantIdToUse = merchantId !== null && merchantId !== undefined ? merchantId : undefined;
      }
    }

    if (!merchantIdToUse) {
      return null;
    }

    // Buscar dados do merchant
    const merchantData = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, merchantIdToUse))
      .limit(1);

    if (!merchantData.length) {
      return null;
    }

    const merchant = merchantData[0];

    // Verificar se já existe consentimento
    const merchantModule = await db
      .select()
      .from(merchantModules)
      .where(
        and(
          eq(merchantModules.idMerchant, merchantIdToUse),
          eq(merchantModules.idModule, moduleId)
        )
      )
      .limit(1);

    const alreadyConsented = merchantModule.length > 0 && merchantModule[0].consentGiven === true;

    return {
      moduleId: module.id,
      moduleName: module.name,
      moduleSlug: module.slug,
      merchantId: merchant.id,
      merchantName: merchant.name,
      alreadyConsented,
      merchantModuleId: merchantModule[0]?.id,
    };
  } catch (error) {
    console.error("Erro ao buscar detalhes do módulo:", error);
    return null;
  }
}

