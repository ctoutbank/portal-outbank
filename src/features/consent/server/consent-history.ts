"use server";

import { db } from "@/lib/db";
import { moduleConsents, modules, merchants, userMerchants, users } from "@/lib/db";
import { eq, and, inArray, or, desc } from "drizzle-orm";

/**
 * Retorna histórico completo de consentimentos de um usuário
 */
export async function getUserConsentHistory(userId: number) {
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

    // Buscar histórico de consentimentos para estes merchants
    const history = await db
      .select({
        id: moduleConsents.id,
        action: moduleConsents.action,
        consentText: moduleConsents.consentText,
        ipAddress: moduleConsents.ipAddress,
        userEmail: moduleConsents.userEmail,
        dtinsert: moduleConsents.dtinsert,
        moduleName: modules.name,
        moduleSlug: modules.slug,
        merchantName: merchants.name,
      })
      .from(moduleConsents)
      .innerJoin(modules, eq(moduleConsents.idModule, modules.id))
      .innerJoin(merchants, eq(moduleConsents.idMerchant, merchants.id))
      .where(
        and(
          inArray(moduleConsents.idMerchant, merchantIds),
          or(
            eq(moduleConsents.userId, userId),
            eq(moduleConsents.userEmail, "") // Placeholder - será ajustado depois
          )
        )
      )
      .orderBy(desc(moduleConsents.dtinsert));

    // Buscar usuário para pegar email
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userRecord.length > 0 && userRecord[0].email) {
      const userEmail = userRecord[0].email;

      // Buscar histórico também por email do usuário
      const historyByEmail = await db
        .select({
          id: moduleConsents.id,
          action: moduleConsents.action,
          consentText: moduleConsents.consentText,
          ipAddress: moduleConsents.ipAddress,
          userEmail: moduleConsents.userEmail,
          dtinsert: moduleConsents.dtinsert,
          moduleName: modules.name,
          moduleSlug: modules.slug,
          merchantName: merchants.name,
        })
        .from(moduleConsents)
        .innerJoin(modules, eq(moduleConsents.idModule, modules.id))
        .innerJoin(merchants, eq(moduleConsents.idMerchant, merchants.id))
        .where(
          and(
            inArray(moduleConsents.idMerchant, merchantIds),
            eq(moduleConsents.userEmail, userEmail)
          )
        )
        .orderBy(desc(moduleConsents.dtinsert));

      // Combinar resultados únicos
      const allHistory = [...history, ...historyByEmail];
      const uniqueHistory = Array.from(
        new Map(allHistory.map((item) => [item.id, item])).values()
      );

      return uniqueHistory.sort((a, b) => {
        if (!a.dtinsert || !b.dtinsert) return 0;
        return new Date(b.dtinsert).getTime() - new Date(a.dtinsert).getTime();
      });
    }

    return history.sort((a, b) => {
      if (!a.dtinsert || !b.dtinsert) return 0;
      return new Date(b.dtinsert).getTime() - new Date(a.dtinsert).getTime();
    });
  } catch (error) {
    console.error("Erro ao buscar histórico de consentimentos:", error);
    return [];
  }
}

