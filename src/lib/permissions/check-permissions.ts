"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, profiles, profileFunctions, functions, adminCustomers, profileCustomers, customers } from "../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Verifica se o usuário é Super Admin
 * Um usuário é considerado Super Admin se o nome do seu perfil contém "SUPER_ADMIN" ou "SUPER" (case-insensitive)
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return false;

    const user = await db
      .select({
        idProfile: users.idProfile,
        profileName: profiles.name,
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(eq(users.idClerk, clerkUser.id))
      .limit(1);

    if (!user || user.length === 0) return false;

    // Verificar se o perfil contém "SUPER_ADMIN" ou "SUPER" no nome
    const profileName = user[0].profileName?.toUpperCase() || "";
    return profileName.includes("SUPER_ADMIN") || profileName.includes("SUPER");
  } catch (error) {
    console.error("Error checking super admin permissions:", error);
    return false;
  }
}

/**
 * Verifica se o usuário é Admin (mas não Super Admin)
 * Um usuário é considerado Admin se o nome do seu perfil contém "ADMIN" mas não "SUPER"
 */
export async function isAdminUser(): Promise<boolean> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return false;

    const user = await db
      .select({
        idProfile: users.idProfile,
        profileName: profiles.name,
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(eq(users.idClerk, clerkUser.id))
      .limit(1);

    if (!user || user.length === 0) return false;

    // Verificar se o perfil contém "ADMIN" no nome
    const profileName = user[0].profileName?.toUpperCase() || "";
    const hasAdmin = profileName.includes("ADMIN");
    const isSuper = profileName.includes("SUPER_ADMIN") || profileName.includes("SUPER");
    
    // Admin é quem tem "ADMIN" mas não "SUPER"
    return hasAdmin && !isSuper;
  } catch (error) {
    console.error("Error checking admin permissions:", error);
    return false;
  }
}

/**
 * Verifica se o usuário é Admin ou Super Admin
 */
export async function isAdminOrSuperAdmin(): Promise<boolean> {
  const isSuper = await isSuperAdmin();
  const isAdmin = await isAdminUser();
  return isSuper || isAdmin;
}

/**
 * Verifica se o usuário tem uma função/permissão específica
 * @param functionName - Nome da função/permissão a verificar
 */
export async function hasPermission(functionName: string): Promise<boolean> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return false;

    const result = await db
      .select({
        functionName: functions.name,
      })
      .from(users)
      .innerJoin(profiles, eq(users.idProfile, profiles.id))
      .innerJoin(profileFunctions, eq(profiles.id, profileFunctions.idProfile))
      .innerJoin(functions, eq(profileFunctions.idFunctions, functions.id))
      .where(
        and(
          eq(users.idClerk, clerkUser.id),
          eq(functions.name, functionName),
          eq(profiles.active, true),
          eq(functions.active, true),
          eq(profileFunctions.active, true)
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

/**
 * Obtém os ISOs autorizados para um Admin
 * @param adminUserId - ID do usuário Admin
 * @returns Array de IDs de customers (ISOs) que o Admin pode gerenciar
 */
export async function getAdminAllowedCustomers(adminUserId: number): Promise<number[]> {
  try {
    const result = await db
      .select({
        idCustomer: adminCustomers.idCustomer,
      })
      .from(adminCustomers)
      .where(and(eq(adminCustomers.idUser, adminUserId), eq(adminCustomers.active, true)))
      .limit(100);

    if (!result || result.length === 0) return [];

    return result
      .map((r) => r.idCustomer)
      .filter((id): id is number => id !== null && typeof id === "number");
  } catch (error) {
    // Se a tabela não existir ainda, retorna array vazio
    console.error("Error getting admin allowed customers:", error);
    return [];
  }
}

/**
 * Obtém informações completas do usuário logado
 * @returns Informações do usuário incluindo isSuperAdmin, isAdmin, idCustomer, profileName, allowedCustomers, etc.
 */
export async function getCurrentUserInfo() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        idCustomer: users.idCustomer,
        fullAccess: users.fullAccess,
        idProfile: users.idProfile,
        active: users.active,
        profileName: profiles.name,
        profileDescription: profiles.description,
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(eq(users.idClerk, clerkUser.id))
      .limit(1);

    if (!user || user.length === 0) return null;

    const userData = user[0];
    const profileName = userData.profileName?.toUpperCase() || "";
    const isSuperAdminValue = profileName.includes("SUPER_ADMIN") || profileName.includes("SUPER");
    const isAdminValue = profileName.includes("ADMIN") && !isSuperAdminValue;

    // Super Admin tem acesso a TODOS os ISOs
    let allowedCustomers: number[] = [];
    
    if (isSuperAdminValue) {
      // Super Admin: buscar todos os customers ativos
      try {
        const allCustomersResult = await db
          .select({
            id: customers.id,
          })
          .from(customers)
          .where(eq(customers.isActive, true));

        allowedCustomers = allCustomersResult
          .map((r) => r.id)
          .filter((id): id is number => id !== null && typeof id === "number");
      } catch (error: any) {
        console.error("Erro ao buscar todos os ISOs para Super Admin:", error);
        allowedCustomers = [];
      }
    } else {
      // Usuários normais: combinar ISOs da categoria + individuais + principal
      
      // 1. ISOs da categoria (herdados automaticamente)
      let profileISOs: number[] = [];
      if (userData.idProfile) {
        try {
          const profileCustomersResult = await db
            .select({
              idCustomer: profileCustomers.idCustomer,
            })
            .from(profileCustomers)
            .where(
              and(
                eq(profileCustomers.idProfile, userData.idProfile),
                eq(profileCustomers.active, true)
              )
            );

          profileISOs = profileCustomersResult
            .map((r) => r.idCustomer)
            .filter((id): id is number => id !== null && typeof id === "number");
        } catch (error: any) {
          // Se a tabela não existe, continuar sem erros (compatibilidade com versões antigas)
          if (
            error?.code !== "42P01" &&
            !error?.message?.includes("does not exist") &&
            !(error?.message?.includes("relation") && error?.message?.includes("profile_customers"))
          ) {
            console.error("Erro ao buscar ISOs da categoria:", error);
          }
        }
      }

      // 2. ISOs individuais (admin_customers)
      let individualISOs: number[] = [];
      if (isAdminValue && userData.id) {
        individualISOs = await getAdminAllowedCustomers(userData.id);
      }

      // 3. ISO principal (idCustomer)
      const mainISO: number[] = userData.idCustomer ? [userData.idCustomer] : [];

      // 4. Combinar todos (remover duplicatas)
      const allISOs = [...profileISOs, ...individualISOs, ...mainISO];
      allowedCustomers = Array.from(new Set(allISOs)).filter(
        (id): id is number => id !== null && typeof id === "number" && !isNaN(id)
      );
    }

    return {
      ...userData,
      isSuperAdmin: isSuperAdminValue,
      isAdmin: isAdminValue,
      allowedCustomers, // Super Admin: todos os ISOs | Outros: categoria + individual + principal
    };
  } catch (error) {
    console.error("Error getting user info:", error);
    return null;
  }
}

/**
 * Verifica se o usuário tem acesso restrito a dados sensíveis de clientes
 * Se retornar true, CPF, CNPJ, email e telefone devem ser mascarados
 * Super Admin sempre retorna false (sempre vê tudo)
 * @returns true se deve mascarar dados, false se pode ver tudo
 */
export async function hasRestrictedDataAccess(): Promise<boolean> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return false;

    // Super Admin sempre vê tudo
    const isSuper = await isSuperAdmin();
    if (isSuper) return false;

    // Buscar perfil do usuário
    const user = await db
      .select({
        idProfile: users.idProfile,
        restrictCustomerData: profiles.restrictCustomerData,
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(eq(users.idClerk, clerkUser.id))
      .limit(1);

    if (!user || user.length === 0) return false;

    return user[0].restrictCustomerData || false;
  } catch (error) {
    console.error("Error checking restricted data access:", error);
    return false; // Em caso de erro, não restringir (mostrar tudo)
  }
}

/**
 * Verifica se o usuário tem acesso à visualização de estabelecimentos
 * Super Admin sempre tem acesso
 * Outros usuários precisam ter a função "VIEW_ALL_MERCHANTS" atribuída ao seu perfil
 * @returns true se o usuário tem acesso, false caso contrário
 */
export async function hasMerchantsAccess(): Promise<boolean> {
  try {
    // Super Admin sempre tem acesso
    const isSuper = await isSuperAdmin();
    if (isSuper) return true;

    // Verificar se tem a permissão específica
    return await hasPermission("VIEW_ALL_MERCHANTS");
  } catch (error) {
    console.error("Error checking merchants access:", error);
    return false;
  }
}

/**
 * Verifica permissões de página (adaptado do Outbank-One)
 * Retorna array de permissões do usuário para um grupo específico
 * @param group - Nome do grupo (ex: "Estabelecimentos")
 * @param permission - Nome da permissão específica (ex: "Atualizar")
 * @returns Array de permissões do usuário
 */
export async function checkPagePermission(
  group: string,
  permission: string = "Listar"
): Promise<string[]> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return [];
    }

    // Super Admin tem todas as permissões
    const isSuper = await isSuperAdmin();
    if (isSuper) {
      // Retornar permissões padrão para Super Admin
      return [
        "Listar",
        "Atualizar",
        "Inserir",
        "Deletar",
        "Configurar dados Bancários",
        "Configurar Taxas do EC",
        "Inserir documentos EC",
      ];
    }

    // Buscar permissões do usuário para o grupo específico
    const result = await db
      .select({
        functionName: functions.name,
      })
      .from(users)
      .innerJoin(profiles, eq(users.idProfile, profiles.id))
      .innerJoin(profileFunctions, eq(profiles.id, profileFunctions.idProfile))
      .innerJoin(functions, eq(profileFunctions.idFunctions, functions.id))
      .where(
        and(
          eq(users.idClerk, clerkUser.id),
          eq(functions.group, group),
          eq(profiles.active, true),
          eq(functions.active, true),
          eq(profileFunctions.active, true)
        )
      );

    const permissions = result
      .map((r) => r.functionName)
      .filter((name): name is string => name !== null && typeof name === "string");

    // Se a permissão específica foi solicitada e não está na lista, retornar array vazio
    // (isso fará com que componentes que verificam permissions.includes() retornem false)
    if (permission && !permissions.includes(permission)) {
      // Não redirecionar, apenas retornar permissões (deixar o componente decidir)
      return permissions;
    }

    return permissions;
  } catch (error) {
    console.error("Error checking page permission:", error);
    return [];
  }
}
