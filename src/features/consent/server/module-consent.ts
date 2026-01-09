"use server";

import { db } from "@/lib/db";
import { merchantModules, moduleConsents, modules, merchants, customers, userNotifications, users } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/utils";

interface ConsentData {
  merchantId: number;
  moduleId: number;
  consentText: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
}

/**
 * Registra consentimento LGPD de um EC/Correntista para um módulo
 */
export async function grantModuleConsent(data: ConsentData) {
  try {
    const sessionUser = await getCurrentUser();
    const headersList = await headers();
    
    if (!sessionUser) {
      throw new Error("Usuário não autenticado");
    }

    const userEmail = sessionUser.email;
    const ipAddress = headersList.get("x-forwarded-for") || 
                     headersList.get("x-real-ip") || 
                     data.ipAddress || 
                     "unknown";
    const userAgent = headersList.get("user-agent") || data.userAgent || "unknown";
    
    // Buscar o registro merchant_modules
    const merchantModule = await db
      .select()
      .from(merchantModules)
      .where(
        and(
          eq(merchantModules.idMerchant, data.merchantId),
          eq(merchantModules.idModule, data.moduleId)
        )
      )
      .limit(1);

    if (!merchantModule.length) {
      throw new Error("Relacionamento merchant-module não encontrado");
    }

    const merchantModuleRecord = merchantModule[0];

    // Buscar dados do merchant para pegar id_customer
    const merchant = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, data.merchantId))
      .limit(1);

    if (!merchant.length) {
      throw new Error("Merchant não encontrado");
    }

    const customerId = merchant[0].idCustomer;

    if (!customerId) {
      throw new Error("Customer ID não encontrado no merchant");
    }

    // Buscar user_id no banco
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    const userId = userRecord[0]?.id || null;

    // Atualizar merchant_modules com consentimento
    await db
      .update(merchantModules)
      .set({
        consentGiven: true,
        consentDate: new Date().toISOString(),
        consentIp: ipAddress,
        consentUserAgent: userAgent,
        active: true,
        notified: true,
        dtupdate: new Date().toISOString(),
      })
      .where(eq(merchantModules.id, merchantModuleRecord.id));

    // Registrar histórico de consentimento
    await db.insert(moduleConsents).values({
      idMerchantModule: merchantModuleRecord.id,
      idMerchant: data.merchantId,
      idModule: data.moduleId,
      idCustomer: customerId,
      action: "GRANTED",
      consentText: data.consentText,
      ipAddress: ipAddress,
      userAgent: userAgent,
      deviceInfo: data.deviceInfo || JSON.stringify({
        platform: "web",
        timestamp: new Date().toISOString(),
      }),
      userEmail: userEmail,
      userId: userId,
      dtinsert: new Date().toISOString(),
    });

    // Marcar notificações como lidas se houver
    if (userId) {
      await db
        .update(userNotifications)
        .set({
          isRead: true,
          active: false,
          dtupdate: new Date().toISOString(),
        })
        .where(
          and(
            eq(userNotifications.idUser, userId),
            eq(userNotifications.type, "module_consent_required"),
            eq(userNotifications.isRead, false)
          )
        );
    }

    revalidatePath("/consent/modules");
    revalidatePath("/tenant/dashboard");

    return {
      success: true,
      message: "Consentimento LGPD registrado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao registrar consentimento:", error);
    throw error;
  }
}

/**
 * Revoga consentimento LGPD de um EC/Correntista para um módulo
 */
export async function revokeModuleConsent(merchantId: number, moduleId: number) {
  try {
    const sessionUser = await getCurrentUser();
    const headersList = await headers();

    if (!sessionUser) {
      throw new Error("Usuário não autenticado");
    }

    const userEmail = sessionUser.email;
    const ipAddress = headersList.get("x-forwarded-for") || 
                     headersList.get("x-real-ip") || 
                     "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // Buscar o registro merchant_modules
    const merchantModule = await db
      .select()
      .from(merchantModules)
      .where(
        and(
          eq(merchantModules.idMerchant, merchantId),
          eq(merchantModules.idModule, moduleId)
        )
      )
      .limit(1);

    if (!merchantModule.length) {
      throw new Error("Relacionamento merchant-module não encontrado");
    }

    const merchantModuleRecord = merchantModule[0];

    // Buscar dados do merchant
    const merchant = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (!merchant.length) {
      throw new Error("Merchant não encontrado");
    }

    const customerId = merchant[0].idCustomer;

    // Buscar user_id no banco
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    const userId = userRecord[0]?.id || null;

    // Desativar o módulo (revogar consentimento)
    await db
      .update(merchantModules)
      .set({
        consentGiven: false,
        consentDate: null,
        active: false,
        dtupdate: new Date().toISOString(),
      })
      .where(eq(merchantModules.id, merchantModuleRecord.id));

    // Registrar histórico de revogação
    await db.insert(moduleConsents).values({
      idMerchantModule: merchantModuleRecord.id,
      idMerchant: merchantId,
      idModule: moduleId,
      idCustomer: customerId || 0,
      action: "REVOKED",
      consentText: "Consentimento revogado pelo usuário",
      ipAddress: ipAddress,
      userAgent: userAgent,
      deviceInfo: JSON.stringify({
        platform: "web",
        timestamp: new Date().toISOString(),
      }),
      userEmail: userEmail,
      userId: userId,
      dtinsert: new Date().toISOString(),
    });

    revalidatePath("/consent/modules");
    revalidatePath("/tenant/dashboard");

    return {
      success: true,
      message: "Consentimento LGPD revogado com sucesso",
    };
  } catch (error) {
    console.error("Erro ao revogar consentimento:", error);
    throw error;
  }
}

/**
 * Retorna histórico de consentimentos de um EC/Correntista
 */
export async function getModuleConsentHistory(merchantId: number, moduleId?: number) {
  try {
    const conditions = [eq(moduleConsents.idMerchant, merchantId)];
    
    if (moduleId) {
      conditions.push(eq(moduleConsents.idModule, moduleId));
    }

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
      })
      .from(moduleConsents)
      .innerJoin(modules, eq(moduleConsents.idModule, modules.id))
      .where(and(...conditions))
      .orderBy(desc(moduleConsents.dtinsert));

    return history;
  } catch (error) {
    console.error("Erro ao buscar histórico de consentimentos:", error);
    return [];
  }
}

