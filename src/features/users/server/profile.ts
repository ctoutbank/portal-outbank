"use server";

import { db } from "@/db/drizzle";
import { users, profiles, customers, adminCustomers, profileFunctions, functions, userFunctions, profileCustomers, salesAgents } from "../../../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword, matchPassword } from "@/app/utils/password";
import { revalidatePath } from "next/cache";

/**
 * Email do Super Admin protegido - definido localmente
 */
const PROTECTED_SUPER_ADMIN_EMAIL = "cto@outbank.com.br";

// =====================================================
// SERVER ACTIONS PARA PERFIL DO USUÁRIO
// =====================================================

/**
 * Obtém o perfil completo do usuário logado
 * Inclui dados do banco (nome, email, categoria, ISOs, permissões)
 */
export async function getUserProfile() {
  try {
    const currentUserSession = await getCurrentUser();
    if (!currentUserSession) {
      return null;
    }

    // Buscar usuário no banco com dados de sales_agents para nome
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        idCustomer: users.idCustomer,
        idProfile: users.idProfile,
        fullAccess: users.fullAccess,
        active: users.active,
        profileName: profiles.name,
        profileDescription: profiles.description,
        firstName: salesAgents.firstName,
        lastName: salesAgents.lastName,
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .leftJoin(salesAgents, eq(salesAgents.idUsers, users.id))
      .where(eq(users.id, currentUserSession.id))
      .limit(1);

    if (!user || user.length === 0) {
      return null;
    }

    const userData = user[0];

    return {
      // Dados do usuário
      id: userData.id,
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      email: userData.email || "",
      
      // Dados do banco
      idCustomer: userData.idCustomer,
      idProfile: userData.idProfile,
      profileName: userData.profileName,
      profileDescription: userData.profileDescription,
      fullAccess: userData.fullAccess,
      active: userData.active,
      
      // Verificações de tipo de usuário
      isSuperAdmin: userData.profileName?.toUpperCase().includes("SUPER") || false,
      isAdmin: userData.profileName?.toUpperCase().includes("ADMIN") || false,
      isPortalUser: userData.idCustomer === null,
    };
  } catch (error) {
    console.error("[getUserProfile] Error:", error);
    return null;
  }
}

/**
 * Atualiza dados pessoais do perfil do usuário
 * Usuários comuns só podem editar seus próprios dados básicos
 */
export async function updateUserProfile(data: {
  firstName?: string;
  lastName?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUserSession = await getCurrentUser();
    if (!currentUserSession) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Validar dados
    if (data.firstName && data.firstName.trim().length === 0) {
      return { success: false, error: "Primeiro nome não pode ser vazio" };
    }

    if (data.lastName && data.lastName.trim().length === 0) {
      return { success: false, error: "Último nome não pode ser vazio" };
    }

    // Verificar se existe registro em sales_agents
    const existingAgent = await db
      .select({ id: salesAgents.id })
      .from(salesAgents)
      .where(eq(salesAgents.idUsers, currentUserSession.id))
      .limit(1);

    if (existingAgent.length > 0) {
      // Atualizar sales_agents existente
      await db
        .update(salesAgents)
        .set({
          firstName: data.firstName?.trim(),
          lastName: data.lastName?.trim(),
          dtupdate: new Date().toISOString(),
        })
        .where(eq(salesAgents.idUsers, currentUserSession.id));
    } else {
      // Criar novo registro em sales_agents
      const userDb = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, currentUserSession.id))
        .limit(1);

      if (userDb.length > 0) {
        await db.insert(salesAgents).values({
          slug: `agent-${currentUserSession.id}`,
          firstName: data.firstName?.trim() || "",
          lastName: data.lastName?.trim() || "",
          email: userDb[0].email || "",
          idUsers: currentUserSession.id,
          active: true,
          dtinsert: new Date().toISOString(),
          dtupdate: new Date().toISOString(),
        });
      }
    }

    console.log(`[updateUserProfile] ✅ Perfil atualizado: ${currentUserSession.id}`);
    
    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("[updateUserProfile] Error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro ao atualizar perfil" 
    };
  }
}

/**
 * Altera a senha do usuário logado
 * Valida senha atual antes de alterar
 */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUserSession = await getCurrentUser();
    if (!currentUserSession) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Validar nova senha
    if (!data.newPassword || data.newPassword.length < 8) {
      return { success: false, error: "Nova senha deve ter pelo menos 8 caracteres" };
    }

    // Buscar hash da senha atual do usuário
    const userDb = await db
      .select({ id: users.id, hashedPassword: users.hashedPassword })
      .from(users)
      .where(eq(users.id, currentUserSession.id))
      .limit(1);

    if (!userDb || userDb.length === 0 || !userDb[0].hashedPassword) {
      return { success: false, error: "Usuário não encontrado" };
    }

    // Validar senha atual
    const isValid = matchPassword(data.currentPassword, userDb[0].hashedPassword);
    if (!isValid) {
      return { success: false, error: "Senha atual incorreta" };
    }

    // Verificar se nova senha é igual à atual
    if (data.currentPassword === data.newPassword) {
      return { success: false, error: "Nova senha deve ser diferente da atual" };
    }

    // Atualizar senha no banco
    const newHashedPassword = hashPassword(data.newPassword);
    await db
      .update(users)
      .set({
        hashedPassword: newHashedPassword,
        initialPassword: data.newPassword,
        dtupdate: new Date().toISOString(),
      })
      .where(eq(users.id, currentUserSession.id));

    console.log(`[changePassword] ✅ Senha alterada: ${currentUserSession.id}`);
    return { success: true };
  } catch (error: any) {
    console.error("[changePassword] Error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro ao alterar senha" 
    };
  }
}

/**
 * Obtém resumo de permissões do usuário
 * Inclui: categoria, permissões (categoria + individuais), ISOs (categoria + individuais)
 */
export async function getUserPermissionsSummary() {
  try {
    const currentUserSession = await getCurrentUser();
    if (!currentUserSession) {
      return null;
    }

    // Buscar usuário e categoria
    const user = await db
      .select({
        id: users.id,
        idProfile: users.idProfile,
        idCustomer: users.idCustomer,
        profileName: profiles.name,
        profileDescription: profiles.description,
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(eq(users.id, currentUserSession.id))
      .limit(1);

    if (!user || user.length === 0) {
      return null;
    }

    const userData = user[0];
    const profileId = userData.idProfile;
    const userId = userData.id;

    // Verificar se é Super Admin (tem todas as permissões)
    const isSuperAdmin = userData.profileName?.toUpperCase().includes("SUPER") || false;

    // Buscar permissões da categoria
    let categoryPermissions: Array<{ id: number; name: string | null; group: string | null }> = [];
    if (profileId) {
      const catPerms = await db
        .select({
          id: functions.id,
          name: functions.name,
          group: functions.group,
        })
        .from(profileFunctions)
        .leftJoin(functions, eq(profileFunctions.idFunctions, functions.id))
        .where(and(
          eq(profileFunctions.idProfile, profileId),
          eq(profileFunctions.active, true)
        ));
      categoryPermissions = catPerms.filter((p): p is { id: number; name: string | null; group: string | null } => p.id !== null);
    }

    // Buscar permissões individuais
    let individualPermissions: Array<{ id: number; name: string | null; group: string | null }> = [];
    try {
      const indPerms = await db
        .select({
          id: functions.id,
          name: functions.name,
          group: functions.group,
        })
        .from(userFunctions)
        .leftJoin(functions, eq(userFunctions.idFunctions, functions.id))
        .where(and(
          eq(userFunctions.idUser, userId),
          eq(userFunctions.active, true)
        ));
      individualPermissions = indPerms.filter((p): p is { id: number; name: string | null; group: string | null } => p.id !== null);
    } catch (error) {
      console.warn("[getUserPermissionsSummary] user_functions table may not exist");
    }

    // Combinar permissões (remover duplicatas)
    const allPermissionsMap = new Map<number, { id: number; name: string | null; group: string | null }>();
    categoryPermissions.forEach(p => { if (p.id) allPermissionsMap.set(p.id, p); });
    individualPermissions.forEach(p => { if (p.id) allPermissionsMap.set(p.id, p); });
    const allPermissions = Array.from(allPermissionsMap.values());

    // Agrupar por grupo
    const permissionsByGroup = allPermissions.reduce((acc, perm) => {
      const group = perm.group || "Outros";
      if (!acc[group]) acc[group] = [];
      acc[group].push(perm);
      return acc;
    }, {} as Record<string, typeof allPermissions>);

    // Buscar ISOs da categoria
    let categoryISOs: Array<{ id: number; name: string | null; slug: string | null }> = [];
    if (profileId) {
      try {
        const catISOs = await db
          .select({
            id: customers.id,
            name: customers.name,
            slug: customers.slug,
          })
          .from(profileCustomers)
          .leftJoin(customers, eq(profileCustomers.idCustomer, customers.id))
          .where(and(
            eq(profileCustomers.idProfile, profileId),
            eq(profileCustomers.active, true)
          ));
        categoryISOs = catISOs.filter((c): c is { id: number; name: string | null; slug: string | null } => c.id !== null);
      } catch (error) {
        console.warn("[getUserPermissionsSummary] profile_customers table may not exist");
      }
    }

    // Buscar ISOs individuais
    let individualISOs: Array<{ id: number; name: string | null; slug: string | null }> = [];
    try {
      const indISOs = await db
        .select({
          id: customers.id,
          name: customers.name,
          slug: customers.slug,
        })
        .from(adminCustomers)
        .leftJoin(customers, eq(adminCustomers.idCustomer, customers.id))
        .where(and(
          eq(adminCustomers.idUser, userId),
          eq(adminCustomers.active, true)
        ));
      individualISOs = indISOs.filter((c): c is { id: number; name: string | null; slug: string | null } => c.id !== null);
    } catch (error) {
      console.warn("[getUserPermissionsSummary] admin_customers table may not exist");
    }

    // ISO principal
    let mainISO: { id: number; name: string | null; slug: string | null } | null = null;
    if (userData.idCustomer) {
      const mainISOResult = await db
        .select({
          id: customers.id,
          name: customers.name,
          slug: customers.slug,
        })
        .from(customers)
        .where(eq(customers.id, userData.idCustomer))
        .limit(1);
      
      if (mainISOResult && mainISOResult.length > 0) {
        mainISO = mainISOResult[0];
      }
    }

    // Combinar ISOs (remover duplicatas)
    const allISOsMap = new Map<number, { id: number; name: string | null; slug: string | null }>();
    categoryISOs.forEach(iso => { if (iso.id) allISOsMap.set(iso.id, iso); });
    individualISOs.forEach(iso => { if (iso.id) allISOsMap.set(iso.id, iso); });
    if (mainISO) allISOsMap.set(mainISO.id, mainISO);
    const allISOs = Array.from(allISOsMap.values());

    return {
      // Categoria
      category: profileId ? {
        id: profileId,
        name: userData.profileName,
        description: userData.profileDescription,
      } : null,

      // Permissões
      permissions: {
        fromCategory: categoryPermissions.length,
        individual: individualPermissions.length,
        total: allPermissions.length,
        byGroup: permissionsByGroup,
        isSuperAdmin,
      },

      // ISOs
      isos: {
        fromCategory: categoryISOs.length,
        individual: individualISOs.length,
        main: mainISO,
        total: allISOs.length,
        all: allISOs,
      },
    };
  } catch (error) {
    console.error("[getUserPermissionsSummary] Error:", error);
    return null;
  }
}

/**
 * Verifica se o usuário logado pode alterar sua própria senha
 */
export async function canChangeOwnPassword(): Promise<boolean> {
  try {
    const currentUserSession = await getCurrentUser();
    if (!currentUserSession) {
      return false;
    }

    // Sempre pode alterar sua própria senha
    return true;
  } catch (error) {
    console.error("[canChangeOwnPassword] Error:", error);
    return false;
  }
}
