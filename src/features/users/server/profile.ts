"use server";

import { db } from "@/lib/db";
import { users, profiles, customers, adminCustomers, profileFunctions, functions, userFunctions, profileCustomers } from "../../../../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { hashPassword } from "@/app/utils/password";
import { revalidatePath } from "next/cache";
/**
 * Email do Super Admin protegido - definido localmente (não pode importar de "use server")
 */
const PROTECTED_SUPER_ADMIN_EMAIL = "cto@outbank.com.br";

// =====================================================
// SERVER ACTIONS PARA PERFIL DO USUÁRIO
// =====================================================

/**
 * Obtém o perfil completo do usuário logado
 * Inclui dados do Clerk (nome, email) e do banco (categoria, ISOs, permissões)
 */
export async function getUserProfile() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return null;
    }

    // Buscar usuário no banco
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
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(eq(users.idClerk, clerkUser.id))
      .limit(1);

    if (!user || user.length === 0) {
      return null;
    }

    const userData = user[0];

    return {
      // Dados do Clerk
      id: userData.id,
      clerkId: clerkUser.id,
      firstName: clerkUser.firstName || "",
      lastName: clerkUser.lastName || "",
      email: clerkUser.emailAddresses[0]?.emailAddress || userData.email || "",
      imageUrl: clerkUser.imageUrl,
      
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
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Validar dados
    if (data.firstName && data.firstName.trim().length === 0) {
      return { success: false, error: "Primeiro nome não pode ser vazio" };
    }

    if (data.lastName && data.lastName.trim().length === 0) {
      return { success: false, error: "Último nome não pode ser vazio" };
    }

    // Atualizar no Clerk
    const clerk = await clerkClient();
    await clerk.users.updateUser(clerkUser.id, {
      firstName: data.firstName?.trim(),
      lastName: data.lastName?.trim(),
    });

    console.log(`[updateUserProfile] ✅ Perfil atualizado: ${clerkUser.id}`);
    
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
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Validar nova senha
    if (!data.newPassword || data.newPassword.length < 8) {
      return { success: false, error: "Nova senha deve ter pelo menos 8 caracteres" };
    }

    // Validar senha atual no Clerk
    const clerk = await clerkClient();
    
    try {
      const validation = await clerk.users.verifyPassword({
        userId: clerkUser.id,
        password: data.currentPassword,
      });

      if (!validation.verified) {
        return { success: false, error: "Senha atual incorreta" };
      }
    } catch (verifyError: any) {
      if (verifyError?.status === 400 || verifyError?.message?.includes("password")) {
        return { success: false, error: "Senha atual incorreta" };
      }
      throw verifyError;
    }

    // Verificar se nova senha é igual à atual
    if (data.currentPassword === data.newPassword) {
      return { success: false, error: "Nova senha deve ser diferente da atual" };
    }

    // Atualizar senha no Clerk
    await clerk.users.updateUser(clerkUser.id, {
      password: data.newPassword,
      skipPasswordChecks: false,
    });

    // Atualizar hash no banco também (para backup/compatibilidade)
    const hashedPassword = hashPassword(data.newPassword);
    const userDb = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.idClerk, clerkUser.id))
      .limit(1);

    if (userDb && userDb.length > 0) {
      await db
        .update(users)
        .set({
          hashedPassword,
          dtupdate: new Date().toISOString(),
        })
        .where(eq(users.id, userDb[0].id));
    }

    console.log(`[changePassword] ✅ Senha alterada: ${clerkUser.id}`);
    return { success: true };
  } catch (error: any) {
    console.error("[changePassword] Error:", error);
    
    // Tratar erros específicos do Clerk
    if (error?.status === 422 && error?.errors) {
      const passwordError = error.errors.find((e: any) => 
        e.code === "form_password_pwned" || 
        e.message?.toLowerCase().includes("password")
      );
      
      if (passwordError) {
        if (passwordError.code === "form_password_pwned") {
          return { success: false, error: "Senha comprometida: Essa senha foi encontrada em vazamentos de dados." };
        }
        return { success: false, error: passwordError.message || "Senha não atende aos requisitos de segurança" };
      }
    }
    
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
    const clerkUser = await currentUser();
    if (!clerkUser) {
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
      .where(eq(users.idClerk, clerkUser.id))
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
      categoryPermissions = catPerms;
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
      individualPermissions = indPerms;
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
        categoryISOs = catISOs;
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
      individualISOs = indISOs;
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
 * O Super Admin protegido (cto@outbank.com.br) só pode ter a senha alterada por ele mesmo
 */
export async function canChangeOwnPassword(): Promise<boolean> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return false;
    }

    // Sempre pode alterar sua própria senha
    return true;
  } catch (error) {
    console.error("[canChangeOwnPassword] Error:", error);
    return false;
  }
}

