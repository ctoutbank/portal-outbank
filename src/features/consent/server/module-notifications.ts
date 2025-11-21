"use server";

import { db } from "@/lib/db";
import { merchantModules, modules, merchants, userMerchants, users, userNotifications } from "@/lib/db";
import { eq, and, inArray, desc } from "drizzle-orm";
import { generateSlug } from "@/lib/utils";
import { getResend } from "@/lib/resend";

const EMAIL_FROM = process.env.EMAIL_FROM || "Outbank <noreply@consolle.one>";

/**
 * Notifica usuários quando novos módulos são adicionados a seus merchants
 */
export async function notifyUsersAboutNewModules(merchantId: number, moduleId: number) {
  try {
    // Buscar dados do módulo
    const moduleData = await db
      .select()
      .from(modules)
      .where(eq(modules.id, moduleId))
      .limit(1);

    if (!moduleData.length) {
      throw new Error("Módulo não encontrado");
    }

    const module = moduleData[0];

    // Buscar dados do merchant
    const merchantData = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    if (!merchantData.length) {
      throw new Error("Merchant não encontrado");
    }

    const merchant = merchantData[0];

    // Buscar todos os usuários vinculados a este merchant
    const userMerchantRelations = await db
      .select({
        userId: userMerchants.idUser,
        userEmail: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(userMerchants)
      .innerJoin(users, eq(userMerchants.idUser, users.id))
      .where(
        and(
          eq(userMerchants.idMerchant, merchantId),
          eq(userMerchants.active, true),
          eq(users.active, true)
        )
      );

    if (userMerchantRelations.length === 0) {
      console.log(`Nenhum usuário vinculado ao merchant ${merchantId}`);
      return {
        success: true,
        notified: 0,
        message: "Nenhum usuário vinculado ao merchant",
      };
    }

    // Criar notificações no banco
    const notificationValues = userMerchantRelations.map((relation) => ({
      slug: generateSlug(),
      dtinsert: new Date().toISOString(),
      dtupdate: new Date().toISOString(),
      active: true,
      idUser: relation.userId,
      title: `Novo módulo disponível: ${module.name}`,
      message: `O módulo "${module.name}" (${module.slug}) foi adicionado ao estabelecimento "${merchant.name}". Você precisa dar seu consentimento LGPD para usar este módulo.`,
      type: "module_consent_required",
      link: `/consent/modules/${moduleId}`,
      isRead: false,
    }));

    await db.insert(userNotifications).values(notificationValues);

    // Enviar emails (opcional - pode ser feito em background job)
    // Por enquanto, apenas logamos
    console.log(`Notificações criadas para ${userMerchantRelations.length} usuários sobre módulo ${module.name}`);

    // Marcar merchant_module como notificado
    await db
      .update(merchantModules)
      .set({
        notified: true,
        dtupdate: new Date().toISOString(),
      })
      .where(
        and(
          eq(merchantModules.idMerchant, merchantId),
          eq(merchantModules.idModule, moduleId)
        )
      );

    return {
      success: true,
      notified: userMerchantRelations.length,
      message: `${userMerchantRelations.length} usuário(s) notificado(s)`,
    };
  } catch (error) {
    console.error("Erro ao notificar usuários sobre novo módulo:", error);
    throw error;
  }
}

/**
 * Cria registro merchant_modules quando um ISO adiciona um módulo
 * e notifica os usuários dos merchants
 */
export async function addModuleToMerchant(
  merchantId: number,
  moduleId: number,
  customerId: number
) {
  try {
    // Verificar se já existe
    const existing = await db
      .select()
      .from(merchantModules)
      .where(
        and(
          eq(merchantModules.idMerchant, merchantId),
          eq(merchantModules.idModule, moduleId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Já existe, apenas atualizar se necessário
      return {
        success: true,
        message: "Módulo já está vinculado ao merchant",
        merchantModuleId: existing[0].id,
      };
    }

    // Criar novo registro
    const newMerchantModule = await db
      .insert(merchantModules)
      .values({
        slug: generateSlug(),
        dtinsert: new Date().toISOString(),
        dtupdate: new Date().toISOString(),
        idMerchant: merchantId,
        idModule: moduleId,
        idCustomer: customerId,
        consentGiven: false, // Requer consentimento
        active: false, // Inativo até consentimento
        notified: false, // Será notificado depois
      })
      .returning();

    const merchantModuleId = newMerchantModule[0]?.id;

    if (!merchantModuleId) {
      throw new Error("Erro ao criar registro merchant_modules");
    }

    // Notificar usuários
    await notifyUsersAboutNewModules(merchantId, moduleId);

    return {
      success: true,
      message: "Módulo adicionado ao merchant e usuários notificados",
      merchantModuleId: merchantModuleId,
    };
  } catch (error) {
    console.error("Erro ao adicionar módulo ao merchant:", error);
    throw error;
  }
}

/**
 * Retorna notificações de consentimento pendentes de um usuário
 */
export async function getPendingConsentNotifications(userId: number) {
  try {
    const notifications = await db
      .select()
      .from(userNotifications)
      .where(
        and(
          eq(userNotifications.idUser, userId),
          eq(userNotifications.type, "module_consent_required"),
          eq(userNotifications.active, true),
          eq(userNotifications.isRead, false)
        )
      )
      .orderBy(desc(userNotifications.dtinsert));

    return notifications;
  } catch (error) {
    console.error("Erro ao buscar notificações pendentes:", error);
    return [];
  }
}

