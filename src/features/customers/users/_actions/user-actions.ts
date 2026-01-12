"use server";

import { hashPassword } from "@/app/utils/password";
import { db } from "@/db/drizzle";
import { generateSlug } from "@/lib/utils";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  adminCustomers,
  customerCustomization,
  customers,
  file,
  profiles,
  reportExecution,
  userMerchants,
  userNotifications,
  users,
  userCustomers,
  salesAgents,
} from "../../../../../drizzle/schema";

import { sendWelcomePasswordEmail } from "@/lib/send-email";
import { getCustomizationByCustomerId } from "@/utils/serverActions";
import { ilike } from "drizzle-orm";
import { validateDeletePermission } from "@/lib/permissions/check-permissions";

export type UserDetail = typeof users.$inferSelect & {
  firstName: string;
  lastName: string;
};

export type ProfileDD = {
  id: number;
  name: string;
};

export async function getDDProfiles(): Promise<ProfileDD[]> {
  const result = await db
    .select({ id: profiles.id, name: profiles.name })
    .from(profiles)
    .where(eq(profiles.active, true));
  return result as ProfileDD[];
}

export type UserInsert = {
  firstName: string;
  lastName: string;
  email: string;
  idCustomer: number | null;
  idAddress: number | null;
  selectedMerchants?: string[];
  active: boolean | null;
  canViewSensitiveData?: boolean;
  idClerk: string | null;
  slug?: string;
  dtinsert?: string;
  dtupdate?: string;
};

export interface UserDetailForm extends UserDetail {
  firstName: string;
  lastName: string;
  email: string;
  selectedMerchants?: string[];
  fullAccess: boolean;
  canViewSensitiveData: boolean;
  customerName?: string;
}

export async function generateRandomPassword(length = 8) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomPassword = "";
  for (let i = 0; i < length; i++) {
    randomPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return randomPassword;
}

export async function updateUser(id: number, data: UserInsert) {
  if (!id) {
    throw new Error("ID do usuário é obrigatório");
  }

  const fieldsToValidate: (keyof UserInsert)[] = [
    "firstName",
    "lastName",
    "email",
  ];

  const hasInvalidFields = fieldsToValidate.some((field) => {
    const value = data[field];
    return (
      value !== undefined &&
      (value === null || (typeof value === "string" && value.trim() === ""))
    );
  });

  if (hasInvalidFields) {
    throw new Error("Campos obrigatórios não podem estar vazios");
  }

  try {
    const existingUser = await db.select().from(users).where(eq(users.id, id));

    if (!existingUser || existingUser.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    // Atualizar usuário na tabela users
    // Preservar valor existente de canViewSensitiveData se não for passado
    await db
      .update(users)
      .set({
        idCustomer: data.idCustomer,
        idAddress: data.idAddress,
        active: data.active,
        canViewSensitiveData: data.canViewSensitiveData ?? existingUser[0].canViewSensitiveData ?? false,
        dtupdate: new Date().toISOString(),
      })
      .where(eq(users.id, id));

    // Atualizar ou criar dados em sales_agents
    const existingSalesAgent = await db
      .select()
      .from(salesAgents)
      .where(eq(salesAgents.idUsers, id))
      .limit(1);

    if (existingSalesAgent.length > 0) {
      await db
        .update(salesAgents)
        .set({
          firstName: data.firstName,
          lastName: data.lastName,
        })
        .where(eq(salesAgents.idUsers, id));
    } else {
      await db.insert(salesAgents).values({
        slug: generateSlug(),
        active: true,
        dtinsert: new Date().toISOString(),
        dtupdate: new Date().toISOString(),
        idUsers: id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      });
    }

    revalidatePath("/portal/users");
    return true;
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error;
  }
}

export async function getUserDetail(
  userId: number
): Promise<UserDetailForm | null> {
  try {
    // Buscar usuário com dados de sales_agents
    const result = await db
      .select({
        id: users.id,
        slug: users.slug,
        dtinsert: users.dtinsert,
        dtupdate: users.dtupdate,
        active: users.active,
        idClerk: users.idClerk,
        idCustomer: users.idCustomer,
        idProfile: users.idProfile,
        fullAccess: users.fullAccess,
        idAddress: users.idAddress,
        hashedPassword: users.hashedPassword,
        email: users.email,
        initialPassword: users.initialPassword,
        isInvisible: users.isInvisible,
        userType: users.userType,
        canViewSensitiveData: users.canViewSensitiveData,
        firstName: salesAgents.firstName,
        lastName: salesAgents.lastName,
      })
      .from(users)
      .leftJoin(salesAgents, eq(salesAgents.idUsers, users.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!result || result.length === 0) {
      return null;
    }

    const user = result[0];

    // Obter os relacionamentos merchant-user
    const userMerchantRelations = await db
      .select()
      .from(userMerchants)
      .where(eq(userMerchants.idUser, userId));

    const selectedMerchants = userMerchantRelations
      .filter((relation) => relation.idMerchant !== null)
      .map((relation) => relation.idMerchant!.toString());

    // Buscar nome do customer/ISO se houver
    let customerName: string | undefined;
    if (user.idCustomer) {
      const customer = await db
        .select({ name: customers.name })
        .from(customers)
        .where(eq(customers.id, user.idCustomer))
        .limit(1);
      if (customer.length > 0) {
        customerName = customer[0].name || undefined;
      }
    }

    // Compor o objeto UserDetailForm usando dados reais
    const userDetailForm: UserDetailForm = {
      ...user,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      selectedMerchants,
      fullAccess: user.fullAccess || false,
      canViewSensitiveData: user.canViewSensitiveData || false,
      customerName,
      imageUrl: null,
    };

    return userDetailForm;
  } catch (error) {
    console.error("Erro ao buscar detalhes do usuário:", error);
    return null;
  }
}

export async function getUsersByCustomerId(customerId: number) {
  const dbUsers = await db
    .select({
      id: users.id,
      slug: users.slug,
      dtinsert: users.dtinsert,
      dtupdate: users.dtupdate,
      active: users.active,
      idClerk: users.idClerk,
      idCustomer: users.idCustomer,
      idProfile: users.idProfile,
      fullAccess: users.fullAccess,
      idAddress: users.idAddress,
      hashedPassword: users.hashedPassword,
      email: users.email,
      initialPassword: users.initialPassword,
      isInvisible: users.isInvisible,
      userType: users.userType,
      canViewSensitiveData: users.canViewSensitiveData,
      firstName: salesAgents.firstName,
      lastName: salesAgents.lastName,
    })
    .from(users)
    .leftJoin(salesAgents, eq(salesAgents.idUsers, users.id))
    .where(
      and(
        eq(users.idCustomer, customerId),
        eq(users.isInvisible, false),
        eq(users.active, true)
      )
    );

  const result = dbUsers.map((user) => ({
    ...user,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
  }));

  return result;
}

export async function revealInitialPassword(userId: number): Promise<{
  success: boolean;
  password?: string;
  email?: string;
  error?: string;
}> {
  try {
    const existingUser = await db.select().from(users).where(eq(users.id, userId));

    if (!existingUser || existingUser.length === 0) {
      return { success: false, error: "Usuário não encontrado" };
    }

    const user = existingUser[0];

    if (!user.email) {
      return { success: false, error: "Usuário não possui email válido" };
    }

    if (!user.initialPassword) {
      return {
        success: false,
        error: "O usuário já alterou sua senha. A senha inicial não está mais disponível."
      };
    }

    console.log("[revealInitialPassword] Password revealed successfully", {
      userId,
      email: user.email,
    });

    return {
      success: true,
      password: user.initialPassword,
      email: user.email,
    };
  } catch (error) {
    console.error("[revealInitialPassword] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao revelar senha",
    };
  }
}

export async function resendWelcomeEmail(userId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const existingUser = await db.select().from(users).where(eq(users.id, userId));

    if (!existingUser || existingUser.length === 0) {
      return { success: false, error: "Usuário não encontrado" };
    }

    const user = existingUser[0];

    if (!user.email || !user.hashedPassword || !user.idCustomer) {
      return { success: false, error: "Usuário não possui dados válidos" };
    }

    const domain = await getCustomizationByCustomerId(user.idCustomer);

    // ✅ Buscar logo de email (emailImageUrl) ou logo padrão
    const logo =
      domain?.emailImageUrl ||
      domain?.imageUrl ||
      "https://file-upload-outbank.s3.amazonaws.com/LUmLuBIG.jpg";

    // ✅ Buscar nome do customer
    const customerData = await db
      .select({
        name: customers.name,
        slug: customerCustomization.slug,
      })
      .from(customers)
      .leftJoin(customerCustomization, eq(customerCustomization.customerId, customers.id))
      .where(eq(customers.id, user.idCustomer))
      .limit(1);

    const customerName = customerData[0]?.name || domain?.slug || "Seu ISO";

    const linkSlug = domain?.slug || domain?.name;
    const link = linkSlug ? `https://${linkSlug}.consolle.one` : undefined;

    await sendWelcomePasswordEmail(
      user.email,
      "******",
      logo,
      customerName,
      link
    );

    console.log("[resendWelcomeEmail] Email resent successfully", {
      userId,
      email: user.email,
    });

    return { success: true };
  } catch (error) {
    console.error("[resendWelcomeEmail] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao reenviar email",
    };
  }
}

export async function deleteUser(id: number): Promise<boolean> {
  try {
    const canDelete = await validateDeletePermission();
    if (!canDelete) {
      throw new Error("Apenas Super Admin pode deletar usuários");
    }

    // Verificar se o usuário existe
    const existingUser = await db.select().from(users).where(eq(users.id, id));

    if (!existingUser || existingUser.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    const userToDelete = existingUser[0];

    // 1. Deletar relacionamentos primeiro (para evitar erro de foreign key)
    // 1.1. Deletar user_merchants
    try {
      await db.delete(userMerchants).where(eq(userMerchants.idUser, id));
      console.log(`[deleteUser] ✅ Relacionamentos user_merchants deletados para usuário ID: ${id}`);
    } catch (merchantError: any) {
      // Se a tabela não existir ou não houver relacionamentos, continuar
      if (merchantError?.code !== '42P01' && !merchantError?.message?.includes('does not exist')) {
        console.warn(`[deleteUser] ⚠️ Aviso ao deletar relacionamentos user_merchants:`, merchantError);
      }
    }

    // 1.2. Deletar user_notifications
    try {
      await db.delete(userNotifications).where(eq(userNotifications.idUser, id));
      console.log(`[deleteUser] ✅ Notificações do usuário deletadas para usuário ID: ${id}`);
    } catch (notificationError: any) {
      // Se a tabela não existir ou não houver relacionamentos, continuar
      if (notificationError?.code !== '42P01' && !notificationError?.message?.includes('does not exist')) {
        console.warn(`[deleteUser] ⚠️ Aviso ao deletar notificações do usuário:`, notificationError);
      }
    }

    // 1.3. Deletar admin_customers
    try {
      await db.delete(adminCustomers).where(eq(adminCustomers.idUser, id));
      console.log(`[deleteUser] ✅ Relacionamentos admin_customers deletados para usuário ID: ${id}`);
    } catch (adminCustomerError: any) {
      // Se a tabela não existir ou não houver relacionamentos, continuar
      if (adminCustomerError?.code !== '42P01' && !adminCustomerError?.message?.includes('does not exist')) {
        console.warn(`[deleteUser] ⚠️ Aviso ao deletar relacionamentos admin_customers:`, adminCustomerError);
      }
    }

    // 1.4. Deletar report_execution
    try {
      await db.delete(reportExecution).where(eq(reportExecution.idUser, id));
      console.log(`[deleteUser] ✅ Execuções de relatório deletadas para usuário ID: ${id}`);
    } catch (reportError: any) {
      // Se a tabela não existir ou não houver relacionamentos, continuar
      if (reportError?.code !== '42P01' && !reportError?.message?.includes('does not exist')) {
        console.warn(`[deleteUser] ⚠️ Aviso ao deletar execuções de relatório:`, reportError);
      }
    }

    // 1.5. Deletar sales_agents
    try {
      await db.delete(salesAgents).where(eq(salesAgents.idUsers, id));
      console.log(`[deleteUser] ✅ Relacionamentos sales_agents deletados para usuário ID: ${id}`);
    } catch (salesAgentError: any) {
      // Se a tabela não existir ou não houver relacionamentos, continuar
      if (salesAgentError?.code !== '42P01' && !salesAgentError?.message?.includes('does not exist')) {
        console.warn(`[deleteUser] ⚠️ Aviso ao deletar relacionamentos sales_agents:`, salesAgentError);
      }
    }

    // 2. Deletar do banco de dados
    await db.delete(users).where(eq(users.id, id));
    console.log(`[deleteUser] ✅ Usuário deletado do banco de dados: ID ${id}`);

    // 4. Revalidar caminhos relacionados
    revalidatePath("/customers");
    revalidatePath("/portal/users");

    return true;
  } catch (error: any) {
    console.error("[deleteUser] ❌ Erro ao excluir usuário:", error);

    // Verificar se é erro de foreign key constraint
    if (error?.code === '23503' || error?.message?.includes('foreign key constraint')) {
      throw new Error("Não é possível excluir este usuário pois ele possui relacionamentos com outros registros. Remova os relacionamentos primeiro.");
    }

    // Relançar o erro para que o componente possa tratá-lo
    throw error;
  }
}

/**
 * Desvincula um usuário de um ISO específico (em vez de deletar completamente)
 * Esta função é usada quando um ISO Admin está removendo um usuário do seu ISO
 * O usuário permanece no sistema, apenas perde o vínculo com aquele ISO específico
 * Se for o último vínculo, o usuário é desativado (não deletado) para preservar histórico
 * @param userId - ID do usuário
 * @param customerId - ID do ISO (customer) do qual o usuário será desvinculado
 * @returns true se desvinculado com sucesso
 */
export async function unlinkUserFromIso(userId: number, customerId: number): Promise<boolean> {
  try {
    console.log(`[unlinkUserFromIso] Desvinculando usuário ${userId} do ISO ${customerId}`);

    // Verificar se o usuário existe
    const existingUser = await db.select().from(users).where(eq(users.id, userId));

    if (!existingUser || existingUser.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    const user = existingUser[0];

    // Verificar quantos ISOs o usuário está vinculado
    const userLinks = await db
      .select({ customerId: userCustomers.idCustomer })
      .from(userCustomers)
      .where(and(eq(userCustomers.idUser, userId), eq(userCustomers.active, true)));

    const activeLinks = userLinks.length;
    console.log(`[unlinkUserFromIso] Usuário ${userId} tem ${activeLinks} vínculos ativos com ISOs`);

    // Desativar o vínculo do usuário com este ISO específico
    await db
      .update(userCustomers)
      .set({ active: false })
      .where(
        and(
          eq(userCustomers.idUser, userId),
          eq(userCustomers.idCustomer, customerId)
        )
      );
    console.log(`[unlinkUserFromIso] ✅ Vínculo user_customers desativado para usuário ${userId} e ISO ${customerId}`);

    // Se o usuário só estava vinculado a este ISO, desativar o usuário completamente
    // Não deletamos para preservar histórico - apenas desativamos e limpamos o idCustomer
    if (activeLinks <= 1 && user.idCustomer === customerId) {
      console.log(`[unlinkUserFromIso] Usuário ${userId} só tinha este vínculo. Desativando usuário e limpando idCustomer.`);
      await db
        .update(users)
        .set({ active: false, idCustomer: null })
        .where(eq(users.id, userId));
      console.log(`[unlinkUserFromIso] ✅ Usuário ${userId} desativado e idCustomer limpo`);
    } else if (user.idCustomer === customerId) {
      // Se o idCustomer do usuário é este ISO, atualizar para outro ISO ativo
      const otherLinks = userLinks.filter(l => l.customerId !== customerId);
      if (otherLinks.length > 0) {
        await db
          .update(users)
          .set({ idCustomer: otherLinks[0].customerId })
          .where(eq(users.id, userId));
        console.log(`[unlinkUserFromIso] ✅ idCustomer do usuário ${userId} atualizado para ${otherLinks[0].customerId}`);
      }
    }

    // Revalidar caminhos relacionados
    revalidatePath("/customers");
    revalidatePath(`/customers/${customerId}`);
    revalidatePath("/portal/users");

    return true;
  } catch (error: any) {
    console.error("[unlinkUserFromIso] ❌ Erro ao desvincular usuário:", error);
    throw error;
  }
}

/**
 * Reseta a senha de um usuário no banco de dados local
 * @param userId - ID do usuário no banco de dados
 * @returns Objeto com sucesso, nova senha e email do usuário
 */
export async function resetUserPassword(userId: number): Promise<{
  success: boolean;
  password?: string;
  email?: string;
  error?: string;
}> {
  try {
    console.log(`[resetUserPassword] Iniciando reset de senha para usuário ID: ${userId}`);

    // 1. Buscar usuário no banco de dados
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        idCustomer: users.idCustomer,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      console.error(`[resetUserPassword] Usuário não encontrado: ${userId}`);
      return { success: false, error: "Usuário não encontrado" };
    }

    const user = userResult[0];

    if (!user.email) {
      console.error(`[resetUserPassword] Usuário não possui email: ${userId}`);
      return { success: false, error: "Usuário não possui email cadastrado" };
    }

    // 2. Gerar nova senha aleatória (mínimo 8 caracteres)
    const newPassword = await generateRandomPassword(10);
    console.log(`[resetUserPassword] Nova senha gerada com ${newPassword.length} caracteres`);

    // 3. Atualizar no banco de dados
    const hashedPwd = hashPassword(newPassword);
    await db
      .update(users)
      .set({
        initialPassword: newPassword,
        hashedPassword: hashedPwd,
        dtupdate: new Date().toISOString(),
      })
      .where(eq(users.id, userId));
    console.log(`[resetUserPassword] ✅ Senha atualizada no banco de dados para usuário ID: ${userId}`);

    // 5. Buscar dados do ISO para email
    let logo = "https://file-upload-outbank.s3.amazonaws.com/LUmLuBIG.jpg";
    let customerName = "Consolle";
    let link: string | undefined;

    if (user.idCustomer) {
      const domain = await getCustomizationByCustomerId(user.idCustomer);
      if (domain) {
        logo = domain.emailImageUrl || domain.imageUrl || logo;
        customerName = domain.name || domain.slug || customerName;
        if (domain.slug) {
          link = `https://${domain.slug}.consolle.one`;
        }
      }

      // Buscar nome do customer
      const customerData = await db
        .select({ name: customers.name })
        .from(customers)
        .where(eq(customers.id, user.idCustomer))
        .limit(1);

      if (customerData.length > 0 && customerData[0].name) {
        customerName = customerData[0].name;
      }
    }

    // 6. Enviar email com nova senha
    try {
      await sendWelcomePasswordEmail(
        user.email,
        newPassword,
        logo,
        customerName,
        link
      );
      console.log(`[resetUserPassword] ✅ Email enviado para: ${user.email}`);
    } catch (emailError) {
      console.error(`[resetUserPassword] ⚠️ Erro ao enviar email (senha já foi resetada):`, emailError);
      // Não falhar se email falhar - senha já foi resetada com sucesso
    }

    // 7. Revalidar caminhos
    revalidatePath("/customers");

    return {
      success: true,
      password: newPassword,
      email: user.email,
    };
  } catch (error: any) {
    console.error("[resetUserPassword] ❌ Erro ao resetar senha:", error);
    return {
      success: false,
      error: error?.message || "Erro ao resetar senha do usuário",
    };
  }
}

export interface IsoCommissionLinkInput {
  customerId: number;
  commissionType: string;
}

/**
 * Migra margin_core para margin_outbank quando não há mais usuários CORE em um ISO
 * @param customerId - ID do ISO
 */
async function migrateCoreMarginsIfNeeded(customerId: number): Promise<void> {
  try {
    // Verificar se ainda existem usuários CORE vinculados a este ISO
    const remainingCoreUsers = await db
      .select({ id: userCustomers.idUser })
      .from(userCustomers)
      .where(
        and(
          eq(userCustomers.idCustomer, customerId),
          eq(userCustomers.commissionType, "CORE"),
          eq(userCustomers.active, true)
        )
      );

    // Se ainda há usuários CORE, não fazer nada
    if (remainingCoreUsers.length > 0) {
      console.log(`[migrateCoreMarginsIfNeeded] ISO ${customerId} ainda tem ${remainingCoreUsers.length} usuários CORE, não migrar margens`);
      return;
    }

    // Buscar margem atual do ISO
    const { sql: sqlVercel } = await import("@vercel/postgres");
    const { rows } = await sqlVercel.query(`
      SELECT margin_core, margin_outbank 
      FROM iso_margin_config 
      WHERE customer_id = $1
    `, [customerId]);

    if (rows.length === 0) {
      console.log(`[migrateCoreMarginsIfNeeded] ISO ${customerId} não tem configuração de margem`);
      return;
    }

    const currentMarginCore = parseFloat(rows[0].margin_core?.replace(",", ".") || "0");
    const currentMarginOutbank = parseFloat(rows[0].margin_outbank?.replace(",", ".") || "0");

    // Se margin_core é 0, não há nada a transferir
    if (currentMarginCore === 0) {
      console.log(`[migrateCoreMarginsIfNeeded] ISO ${customerId} já tem margin_core=0, nada a transferir`);
      return;
    }

    // Transferir margin_core para margin_outbank e zerar margin_core
    const newMarginOutbank = currentMarginOutbank + currentMarginCore;

    await sqlVercel.query(`
      UPDATE iso_margin_config 
      SET margin_core = '0', 
          margin_outbank = $1,
          updated_at = NOW()
      WHERE customer_id = $2
    `, [newMarginOutbank.toFixed(4), customerId]);

    console.log(`[migrateCoreMarginsIfNeeded] ✅ ISO ${customerId}: transferido margin_core=${currentMarginCore} para margin_outbank. Novo margin_outbank=${newMarginOutbank}`);
  } catch (error) {
    console.error(`[migrateCoreMarginsIfNeeded] Erro ao migrar margens do ISO ${customerId}:`, error);
    // Não bloquear a operação principal
  }
}

export async function saveUserIsoCommissionLinks(
  userId: number,
  links: IsoCommissionLinkInput[]
): Promise<void> {
  if (!userId || userId <= 0) {
    throw new Error("ID do usuário é obrigatório");
  }

  try {
    // Buscar vínculos existentes para fazer upsert inteligente
    const existingLinks = await db
      .select()
      .from(userCustomers)
      .where(eq(userCustomers.idUser, userId));

    // Detectar mudanças de CORE para outro tipo (para migração de margens)
    const coreToOtherChanges: number[] = [];

    // Criar mapa de links existentes por customerId
    const existingByCustomerId = new Map(
      existingLinks.map((l) => [l.idCustomer, l])
    );

    // Identificar customerIds que devem ter vínculo de comissão
    const newCustomerIds = new Set(links.map((l) => l.customerId));

    // Para links existentes que NÃO estão na nova lista:
    // - Se já tinham commission_type, remover o commission_type (manter o vínculo)
    // - Se não tinham commission_type, manter como está
    for (const existing of existingLinks) {
      if (!newCustomerIds.has(existing.idCustomer) && existing.commissionType) {
        // Se era CORE e está sendo removido, marcar para verificar migração
        if (existing.commissionType === "CORE") {
          coreToOtherChanges.push(existing.idCustomer);
        }
        // Remover commission_type mas manter o vínculo
        await db
          .update(userCustomers)
          .set({ commissionType: null })
          .where(
            and(
              eq(userCustomers.idUser, userId),
              eq(userCustomers.idCustomer, existing.idCustomer)
            )
          );
      }
    }

    // Para novos links:
    // - Se já existe vínculo, atualizar commission_type
    // - Se não existe, inserir novo
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const existing = existingByCustomerId.get(link.customerId);

      if (existing) {
        // Detectar se está mudando de CORE para outro tipo
        if (existing.commissionType === "CORE" && link.commissionType !== "CORE") {
          coreToOtherChanges.push(link.customerId);
        }
        // Atualizar commission_type do vínculo existente
        await db
          .update(userCustomers)
          .set({
            commissionType: link.commissionType,
            active: true,
          })
          .where(
            and(
              eq(userCustomers.idUser, userId),
              eq(userCustomers.idCustomer, link.customerId)
            )
          );
      } else {
        // Inserir novo vínculo
        await db.insert(userCustomers).values({
          idUser: userId,
          idCustomer: link.customerId,
          commissionType: link.commissionType,
          active: true,
          isPrimary: i === 0 && existingLinks.filter(l => l.isPrimary).length === 0,
        });
      }
    }

    // Após todas as atualizações, verificar se precisa migrar margens para ISOs que perderam usuários CORE
    if (coreToOtherChanges.length > 0) {
      console.log(`[saveUserIsoCommissionLinks] Verificando migração de margens para ${coreToOtherChanges.length} ISOs que perderam usuário CORE`);
      for (const customerId of coreToOtherChanges) {
        await migrateCoreMarginsIfNeeded(customerId);
      }
    }

    revalidatePath("/config/users");
    revalidatePath("/margens");
  } catch (error) {
    console.error("[saveUserIsoCommissionLinks] Erro ao salvar vínculos:", error);
    throw error;
  }
}

export async function getUserIsoCommissionLinks(
  userId: number
): Promise<Array<{ customerId: number; customerName: string; commissionType: string }>> {
  if (!userId || userId <= 0) {
    return [];
  }

  try {
    const links = await db
      .select({
        customerId: userCustomers.idCustomer,
        customerName: customers.name,
        commissionType: userCustomers.commissionType,
      })
      .from(userCustomers)
      .leftJoin(customers, eq(userCustomers.idCustomer, customers.id))
      .where(and(eq(userCustomers.idUser, userId), eq(userCustomers.active, true)));

    // Filtrar apenas links que têm commission_type definido (não NULL)
    return links
      .filter((l) => l.commissionType !== null && l.commissionType !== undefined)
      .map((l) => ({
        customerId: l.customerId,
        customerName: l.customerName || "Sem nome",
        commissionType: l.commissionType as string,
      }));
  } catch (error) {
    console.error("[getUserIsoCommissionLinks] Erro ao buscar vínculos:", error);
    return [];
  }
}
