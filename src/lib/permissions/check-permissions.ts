"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, profiles, profileFunctions, functions, adminCustomers, profileCustomers, customers, userFunctions, userCustomers } from "../../../drizzle/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { USER_TYPES, type UserType } from "./types";
import { cookies } from "next/headers";

const DEV_BYPASS_ENABLED = 
  process.env.NODE_ENV === "development" && 
  process.env.DEV_BYPASS_AUTH === "true" &&
  !process.env.VERCEL;

const SIMULATED_USER_COOKIE = "dev_simulated_user_id";

async function getSimulatedUserId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const simulatedUserId = cookieStore.get(SIMULATED_USER_COOKIE)?.value;
    if (simulatedUserId) {
      return parseInt(simulatedUserId, 10);
    }
  } catch (error) {
    // Cookies may not be available in some contexts
  }
  return null;
}

/**
 * Verifica se o usuário é Super Admin
 * Usa o campo user_type = 'SUPER_ADMIN' para verificação
 * Fallback: verifica nome do perfil para compatibilidade
 */
export async function isSuperAdmin(): Promise<boolean> {
  if (DEV_BYPASS_ENABLED) return true;
  
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return false;

    const user = await db
      .select({
        idProfile: users.idProfile,
        profileName: profiles.name,
        userType: users.userType,
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(eq(users.id, sessionUser.id))
      .limit(1);

    if (!user || user.length === 0) return false;

    // Primeiro: verificar user_type (novo sistema Multi-ISO)
    if (user[0].userType === USER_TYPES.SUPER_ADMIN) {
      return true;
    }

    // Fallback: verificar se o perfil contém "SUPER_ADMIN" ou "SUPER" no nome (compatibilidade)
    const profileName = user[0].profileName?.toUpperCase() || "";
    return profileName.includes("SUPER_ADMIN") || profileName.includes("SUPER");
  } catch (error) {
    console.error("Error checking super admin permissions:", error);
    return false;
  }
}

/**
 * Verifica se o usuário é Admin ISO (mas não Super Admin)
 * Usa user_type = 'ISO_PORTAL_ADMIN' para verificação
 * Fallback: verifica nome do perfil para compatibilidade
 */
export async function isAdminUser(): Promise<boolean> {
  if (DEV_BYPASS_ENABLED) return true;
  
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return false;

    const user = await db
      .select({
        idProfile: users.idProfile,
        profileName: profiles.name,
        userType: users.userType,
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(eq(users.id, sessionUser.id))
      .limit(1);

    if (!user || user.length === 0) return false;

    // Primeiro: verificar user_type (novo sistema Multi-ISO)
    if (user[0].userType === USER_TYPES.ISO_PORTAL_ADMIN) {
      return true;
    }

    // Fallback: verificar se o perfil contém "ADMIN" no nome (compatibilidade)
    const profileName = user[0].profileName?.toUpperCase() || "";
    const hasAdmin = profileName.includes("ADMIN");
    const isSuper = profileName.includes("SUPER_ADMIN") || profileName.includes("SUPER") || user[0].userType === USER_TYPES.SUPER_ADMIN;
    
    // Admin é quem tem "ADMIN" mas não "SUPER"
    return hasAdmin && !isSuper;
  } catch (error) {
    console.error("Error checking admin permissions:", error);
    return false;
  }
}

/**
 * Obtém todos os ISOs (customers) que o usuário tem acesso via tabela user_customers
 * @param userId - ID do usuário no banco de dados
 * @returns Array de IDs de customers
 */
export async function getUserMultiIsoAccess(userId: number): Promise<number[]> {
  try {
    const result = await db
      .select({
        idCustomer: userCustomers.idCustomer,
      })
      .from(userCustomers)
      .where(and(
        eq(userCustomers.idUser, userId),
        eq(userCustomers.active, true)
      ));

    return result
      .map((r) => r.idCustomer)
      .filter((id): id is number => id !== null && typeof id === "number");
  } catch (error) {
    console.error("[getUserMultiIsoAccess] Error:", error);
    return [];
  }
}

/**
 * Valida se o usuário tem permissão de delete
 * Apenas Super Admin pode deletar
 */
export async function validateDeletePermission(): Promise<boolean> {
  return await isSuperAdmin();
}

/**
 * Verifica se o usuário deve ver dados sensíveis mascarados
 * Super Admin: nunca mascara
 * Executivo/Core (user_type = 'USER'): mascara por padrão
 * Se can_view_sensitive_data = true: não mascara
 * @returns true se deve mascarar, false se pode ver dados completos
 */
export async function shouldMaskSensitiveData(): Promise<boolean> {
  if (DEV_BYPASS_ENABLED) return false;
  
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return true;

    // Super Admin sempre vê tudo
    const isSuper = await isSuperAdmin();
    if (isSuper) return false;

    // Buscar configuração do usuário
    const user = await db
      .select({
        userType: users.userType,
        canViewSensitiveData: users.canViewSensitiveData,
      })
      .from(users)
      .where(eq(users.id, sessionUser.id))
      .limit(1);

    if (!user || user.length === 0) return true;

    // Se tem permissão explícita, não mascara
    if (user[0].canViewSensitiveData === true) return false;

    // Executivo/Core (tipo USER) mascara por padrão
    // Admin também não mascara
    if (user[0].userType === USER_TYPES.ISO_PORTAL_ADMIN) return false;

    // Qualquer outro tipo de usuário mascara
    return true;
  } catch (error) {
    console.error("Error checking sensitive data permission:", error);
    return true;
  }
}

/**
 * Verifica se o usuário pode visualizar dados sensíveis (inverso de shouldMaskSensitiveData)
 * @returns true se pode ver dados completos, false se deve mascarar
 */
export async function canViewSensitiveData(): Promise<boolean> {
  const shouldMask = await shouldMaskSensitiveData();
  return !shouldMask;
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
 * Verifica se o usuário tem categoria CORE
 * Categoria CORE é identificada pelo campo categoryType do profile = "CORE"
 * Suporta View Mode: verifica usuário simulado primeiro (se existir)
 * @returns true se o usuário tem categoria CORE
 */
export async function isCoreProfile(): Promise<boolean> {
  if (DEV_BYPASS_ENABLED) return false;
  
  try {
    const simulatedUserId = await getSimulatedUserId();
    let targetUserId: number;
    
    if (simulatedUserId) {
      targetUserId = simulatedUserId;
    } else {
      const sessionUser = await getCurrentUser();
      if (!sessionUser) return false;
      targetUserId = sessionUser.id;
    }

    const user = await db
      .select({
        categoryType: profiles.categoryType,
        profileName: profiles.name,
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!user || user.length === 0) return false;

    const categoryType = user[0].categoryType?.toUpperCase() || "";
    if (categoryType === "CORE") return true;
    
    const profileName = user[0].profileName?.toUpperCase() || "";
    return profileName.includes("CORE");
  } catch (error) {
    console.error("Error checking CORE profile:", error);
    return false;
  }
}

/**
 * Verifica se o usuário tem categoria EXECUTIVO
 * Categoria EXECUTIVO é identificada pelo campo categoryType do profile = "EXECUTIVO"
 * Suporta View Mode: verifica usuário simulado primeiro (se existir)
 * @returns true se o usuário tem categoria EXECUTIVO
 */
export async function isExecutivoProfile(): Promise<boolean> {
  if (DEV_BYPASS_ENABLED) return false;
  
  try {
    const simulatedUserId = await getSimulatedUserId();
    let targetUserId: number;
    
    if (simulatedUserId) {
      targetUserId = simulatedUserId;
    } else {
      const sessionUser = await getCurrentUser();
      if (!sessionUser) return false;
      targetUserId = sessionUser.id;
    }

    const user = await db
      .select({
        categoryType: profiles.categoryType,
        profileName: profiles.name,
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!user || user.length === 0) return false;

    const categoryType = user[0].categoryType?.toUpperCase() || "";
    if (categoryType === "EXECUTIVO") return true;
    
    const profileName = user[0].profileName?.toUpperCase() || "";
    return profileName.includes("EXECUTIVO");
  } catch (error) {
    console.error("Error checking EXECUTIVO profile:", error);
    return false;
  }
}

/**
 * Verifica se o usuário tem uma função/permissão específica
 * Verifica AMBAS: permissões da categoria (profile_functions) + permissões individuais (user_functions)
 * @param functionName - Nome da função/permissão a verificar
 */
export async function hasPermission(functionName: string): Promise<boolean> {
  if (DEV_BYPASS_ENABLED) return true;
  
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return false;

    // Primeiro, buscar o usuário e seu perfil
    const user = await db
      .select({
        id: users.id,
        idProfile: users.idProfile,
      })
      .from(users)
      .where(eq(users.id, sessionUser.id))
      .limit(1);

    if (!user || user.length === 0) return false;

    const userId = user[0].id;
    const profileId = user[0].idProfile;

    // Buscar ID da função pelo nome
    const func = await db
      .select({ id: functions.id })
      .from(functions)
      .where(and(
        eq(functions.name, functionName),
        eq(functions.active, true)
      ))
      .limit(1);

    if (!func || func.length === 0) return false;

    const functionId = func[0].id;

    // 1. Verificar permissão na categoria (profile_functions)
    let hasCategoryPermission = false;
    if (profileId) {
      const categoryResult = await db
        .select({ id: profileFunctions.id })
        .from(profileFunctions)
        .where(and(
          eq(profileFunctions.idProfile, profileId),
          eq(profileFunctions.idFunctions, functionId),
          eq(profileFunctions.active, true)
        ))
        .limit(1);

      hasCategoryPermission = categoryResult.length > 0;
    }

    // 2. Verificar permissão individual (user_functions)
    let hasIndividualPermission = false;
    try {
      const individualResult = await db
        .select({ id: userFunctions.id })
        .from(userFunctions)
        .where(and(
          eq(userFunctions.idUser, userId),
          eq(userFunctions.idFunctions, functionId),
          eq(userFunctions.active, true)
        ))
        .limit(1);

      hasIndividualPermission = individualResult.length > 0;
    } catch (error) {
      // Se a tabela não existe, continuar sem erro
      console.warn("[hasPermission] user_functions table may not exist:", error);
    }

    // Retorna true se tem permissão em QUALQUER um (categoria OU individual)
    return hasCategoryPermission || hasIndividualPermission;
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
 * @returns Informações do usuário incluindo isSuperAdmin, isAdmin, idCustomer, profileName, allowedCustomers, userType, etc.
 */
export async function getCurrentUserInfo() {
  if (DEV_BYPASS_ENABLED) {
    // No modo DEV_BYPASS, buscar todos os customers ativos para simular Super Admin
    let allCustomerIds: number[] = [];
    try {
      const allCustomersResult = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.isActive, true));
      
      allCustomerIds = allCustomersResult
        .map((r) => r.id)
        .filter((id): id is number => id !== null && typeof id === "number");
    } catch (error) {
      console.error("[DEV_BYPASS] Erro ao buscar customers:", error);
    }

    return {
      id: 0,
      email: "dev@localhost",
      idCustomer: null,
      fullAccess: true,
      idProfile: null,
      active: true,
      profileName: "SUPER_ADMIN",
      profileDescription: "Development Bypass",
      isSuperAdmin: true,
      isAdmin: false,
      allowedCustomers: allCustomerIds,
      userType: USER_TYPES.SUPER_ADMIN,
    };
  }

  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return null;
    
    const simulatedUserId = await getSimulatedUserId();
    const targetUserId = simulatedUserId || sessionUser.id;
    const isSimulating = !!simulatedUserId;

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
        userType: users.userType,
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!user || user.length === 0) return null;

    const userData = user[0];
    const userType = userData.userType || null;
    const profileName = userData.profileName?.toUpperCase() || "";
    
    if (isSimulating) {
      console.log(`[View Mode] Simulating user ${targetUserId} (${userData.email})`);
    }
    
    // Determinar tipo de usuário usando user_type (novo) com fallback para nome do perfil (legado)
    const isSuperAdminValue = userType === USER_TYPES.SUPER_ADMIN || 
      profileName.includes("SUPER_ADMIN") || profileName.includes("SUPER");
    const isAdminValue = userType === USER_TYPES.ISO_PORTAL_ADMIN || 
      (profileName.includes("ADMIN") && !isSuperAdminValue);

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
      // Verificar categoria do perfil para determinar lógica de acesso
      // Usa categoryType (novo) com fallback para profileName (legado)
      let isCoreOrExecutivo = false;
      
      if (userData.idProfile) {
        const profileData = await db
          .select({ categoryType: profiles.categoryType, name: profiles.name })
          .from(profiles)
          .where(eq(profiles.id, userData.idProfile))
          .limit(1);
        
        const userCategory = profileData[0]?.categoryType?.toUpperCase() || "";
        const profileNameUpper = profileData[0]?.name?.toUpperCase() || "";
        
        // Verificar por categoryType OU por nome do perfil (fallback legado)
        isCoreOrExecutivo = 
          userCategory === "CORE" || 
          userCategory === "EXECUTIVO" ||
          profileNameUpper.includes("CORE") ||
          profileNameUpper.includes("EXECUTIVO");
      }
      
      if (isCoreOrExecutivo) {
        // CORE e EXECUTIVO: usar APENAS user_customers (segregação estrita de dados)
        if (userData.id) {
          allowedCustomers = await getUserMultiIsoAccess(userData.id);
        }
        
        if (isSimulating) {
          console.log(`[View Mode] CORE/EXECUTIVO user ${targetUserId}: allowed customers = [${allowedCustomers.join(', ')}]`);
        }
      } else {
        // Admin e outros: combinar ISOs de múltiplas fontes (comportamento legado)
        
        // 1. ISOs da tabela user_customers (sistema Multi-ISO)
        let multiIsoCustomers: number[] = [];
        if (userData.id) {
          multiIsoCustomers = await getUserMultiIsoAccess(userData.id);
        }

        // 2. ISOs da categoria do perfil (profile_customers - sistema legado)
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
            // Se a tabela não existe, continuar sem erros (compatibilidade)
            if (
              error?.code !== "42P01" &&
              !error?.message?.includes("does not exist") &&
              !(error?.message?.includes("relation") && error?.message?.includes("profile_customers"))
            ) {
              console.error("Erro ao buscar ISOs da categoria:", error);
            }
          }
        }

        // 3. ISOs individuais do admin (admin_customers - sistema legado)
        let individualISOs: number[] = [];
        if (isAdminValue && userData.id) {
          individualISOs = await getAdminAllowedCustomers(userData.id);
        }

        // 4. ISO principal (idCustomer)
        const mainISO: number[] = userData.idCustomer ? [userData.idCustomer] : [];

        // 5. Combinar todos (remover duplicatas)
        const allISOs = [...multiIsoCustomers, ...profileISOs, ...individualISOs, ...mainISO];
        allowedCustomers = Array.from(new Set(allISOs)).filter(
          (id): id is number => id !== null && typeof id === "number" && !isNaN(id)
        );
      }
    }

    return {
      ...userData,
      isSuperAdmin: isSuperAdminValue,
      isAdmin: isAdminValue,
      allowedCustomers,
      userType: userType as UserType | null,
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
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return false;

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
      .where(eq(users.id, sessionUser.id))
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
 * Obtém os menus autorizados para o perfil do usuário logado
 * Super Admin sempre retorna array vazio (significa todos autorizados)
 * @returns Array de IDs de menus autorizados
 */
export async function getUserAuthorizedMenus(): Promise<string[]> {
  try {
    // Dev bypass retorna vazio (todos autorizados)
    if (DEV_BYPASS_ENABLED) {
      return [];
    }

    const sessionUser = await getCurrentUser();
    if (!sessionUser) return [];

    // Super Admin sempre vê todos os menus
    const isSuper = await isSuperAdmin();
    if (isSuper) return [];

    // Buscar menus autorizados do perfil do usuário
    const userData = await db
      .select({
        idProfile: users.idProfile,
      })
      .from(users)
      .where(eq(users.id, sessionUser.id))
      .limit(1);

    if (!userData || userData.length === 0 || !userData[0].idProfile) {
      return [];
    }

    const profileId = userData[0].idProfile;

    // Buscar menus autorizados usando SQL raw (campo não está no schema drizzle)
    const result = await db.execute(sql`
      SELECT authorized_menus FROM profiles WHERE id = ${profileId}
    `);

    if (!result.rows || result.rows.length === 0) {
      return [];
    }

    const authorizedMenusJson = (result.rows[0] as any).authorized_menus;
    if (!authorizedMenusJson) {
      return [];
    }

    return JSON.parse(authorizedMenusJson);
  } catch (error) {
    console.error("Error getting user authorized menus:", error);
    return [];
  }
}

/**
 * Retorna o label da categoria do usuário para exibição na sidebar
 * @returns String com o nome da categoria: Super Admin, Admin, Executivo, Core
 */
export async function getUserCategoryLabel(): Promise<string> {
  try {
    if (DEV_BYPASS_ENABLED) {
      return "Super Admin";
    }

    const sessionUser = await getCurrentUser();
    if (!sessionUser) return "Usuário";

    // Verificar se é Super Admin pelo user_type
    const userData = await db
      .select({
        userType: users.userType,
        idProfile: users.idProfile,
      })
      .from(users)
      .where(eq(users.id, sessionUser.id))
      .limit(1);

    if (!userData || userData.length === 0) {
      return "Usuário";
    }

    const { userType, idProfile } = userData[0];

    // Super Admin pelo user_type
    if (userType === "SUPER_ADMIN") {
      return "Super Admin";
    }

    // Buscar categoryType do perfil
    if (idProfile) {
      const profileData = await db.execute(sql`
        SELECT name, category_type FROM profiles WHERE id = ${idProfile}
      `);

      if (profileData.rows && profileData.rows.length > 0) {
        const profile = profileData.rows[0] as { name: string; category_type: string | null };
        const categoryType = profile.category_type?.toUpperCase();
        const profileName = profile.name?.toUpperCase() || "";

        // Priorizar categoryType, depois fallback para nome do perfil
        if (categoryType === "ADMIN" || profileName.includes("ADMIN")) {
          return "Admin";
        }
        if (categoryType === "EXECUTIVO" || profileName.includes("EXECUTIVO")) {
          return "Executivo";
        }
        if (categoryType === "CORE" || profileName.includes("CORE")) {
          return "Core";
        }
      }
    }

    return "Usuário";
  } catch (error) {
    console.error("Error getting user category label:", error);
    return "Usuário";
  }
}

/**
 * Obtém os menus autorizados para um usuário específico por ID
 * Usado para simulação de View Mode
 * @param userId - ID do usuário
 * @returns Array de IDs de menus autorizados
 */
export async function getUserAuthorizedMenusById(userId: number): Promise<string[]> {
  try {
    const userData = await db
      .select({
        idProfile: users.idProfile,
        userType: users.userType,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userData || userData.length === 0) {
      return [];
    }

    if (userData[0].userType === "SUPER_ADMIN") {
      return [];
    }

    const profileId = userData[0].idProfile;
    if (!profileId) {
      return [];
    }

    const result = await db.execute(sql`
      SELECT authorized_menus FROM profiles WHERE id = ${profileId}
    `);

    if (!result.rows || result.rows.length === 0) {
      return [];
    }

    const authorizedMenusJson = (result.rows[0] as any).authorized_menus;
    if (!authorizedMenusJson) {
      return [];
    }

    return JSON.parse(authorizedMenusJson);
  } catch (error) {
    console.error("Error getting user authorized menus by id:", error);
    return [];
  }
}

/**
 * Obtém a categoria do usuário por ID (CORE, EXECUTIVO, ADMIN, etc)
 * Usado para simulação de View Mode
 * @param userId - ID do usuário
 * @returns String com a categoria ou null
 */
export async function getUserCategoryById(userId: number): Promise<string | null> {
  try {
    const userData = await db
      .select({
        userType: users.userType,
        idProfile: users.idProfile,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userData || userData.length === 0) {
      return null;
    }

    const { userType, idProfile } = userData[0];

    if (userType === "SUPER_ADMIN") {
      return "SUPER_ADMIN";
    }

    if (idProfile) {
      const profileData = await db.execute(sql`
        SELECT name, category_type FROM profiles WHERE id = ${idProfile}
      `);

      if (profileData.rows && profileData.rows.length > 0) {
        const profile = profileData.rows[0] as { name: string; category_type: string | null };
        const categoryType = profile.category_type?.toUpperCase();
        const profileName = profile.name?.toUpperCase() || "";

        if (categoryType === "ADMIN" || profileName.includes("ADMIN")) {
          return "ADMIN";
        }
        if (categoryType === "EXECUTIVO" || profileName.includes("EXECUTIVO")) {
          return "EXECUTIVO";
        }
        if (categoryType === "CORE" || profileName.includes("CORE")) {
          return "CORE";
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting user category by id:", error);
    return null;
  }
}

/**
 * Obtem todos os ISOs vinculados a um usuario
 * Combina: ISOs do perfil + ISOs individuais (admin_customers) + ISO principal
 * Super Admin retorna todos os ISOs ativos
 * @param userId - ID do usuario no banco de dados
 * @returns Array de objetos com id e nome dos ISOs
 */
export async function getUserLinkedIsos(userId: number): Promise<{ id: number; name: string | null; slug: string }[]> {
  try {
    console.log(`[getUserLinkedIsos] Buscando ISOs para userId: ${userId}`);

    // Buscar dados do usuario
    const userData = await db
      .select({
        idCustomer: users.idCustomer,
        idProfile: users.idProfile,
        profileName: profiles.name,
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!userData || userData.length === 0) {
      console.log(`[getUserLinkedIsos] Usuario nao encontrado`);
      return [];
    }

    const user = userData[0];
    const profileName = (user.profileName ?? "").toUpperCase();
    const isSuperAdminValue = profileName.includes("SUPER_ADMIN") || profileName.includes("SUPER");

    // Super Admin: retorna todos os ISOs ativos
    if (isSuperAdminValue) {
      console.log(`[getUserLinkedIsos] Super Admin detectado, retornando todos os ISOs`);
      const allCustomers = await db
        .select({
          id: customers.id,
          name: customers.name,
          slug: customers.slug,
        })
        .from(customers)
        .where(eq(customers.isActive, true));

      return allCustomers.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }));
    }

    // Usuarios normais: combinar ISOs de diferentes fontes
    const linkedIsoIds = new Set<number>();

    // 1. ISO principal
    if (user.idCustomer) {
      linkedIsoIds.add(user.idCustomer);
    }

    // 2. ISOs do perfil (profile_customers)
    if (user.idProfile) {
      try {
        const profileIsos = await db
          .select({ idCustomer: profileCustomers.idCustomer })
          .from(profileCustomers)
          .where(and(eq(profileCustomers.idProfile, user.idProfile), eq(profileCustomers.active, true)));

        profileIsos.forEach(p => {
          if (p.idCustomer) linkedIsoIds.add(p.idCustomer);
        });
      } catch (error) {
        console.log(`[getUserLinkedIsos] Tabela profile_customers nao existe ou erro:`, error);
      }
    }

    // 3. ISOs individuais (admin_customers)
    try {
      const adminIsos = await db
        .select({ idCustomer: adminCustomers.idCustomer })
        .from(adminCustomers)
        .where(and(eq(adminCustomers.idUser, userId), eq(adminCustomers.active, true)));

      adminIsos.forEach(a => {
        if (a.idCustomer) linkedIsoIds.add(a.idCustomer);
      });
    } catch (error) {
      console.log(`[getUserLinkedIsos] Erro ao buscar admin_customers:`, error);
    }

    // Buscar detalhes dos ISOs
    if (linkedIsoIds.size === 0) {
      console.log(`[getUserLinkedIsos] Nenhum ISO vinculado encontrado`);
      return [];
    }

    const isoDetails = await db
      .select({
        id: customers.id,
        name: customers.name,
        slug: customers.slug,
      })
      .from(customers)
      .where(and(eq(customers.isActive, true)));

    const result = isoDetails.filter(iso => linkedIsoIds.has(iso.id));
    console.log(`[getUserLinkedIsos] Encontrados ${result.length} ISOs vinculados`);
    return result;
  } catch (error) {
    console.error("[getUserLinkedIsos] Erro:", error);
    return [];
  }
}

/**
 * Obtem todas as permissoes de um usuario para um grupo especifico
 * Super Admin retorna todas as permissoes do grupo
 * @param userId - ID do usuario no banco de dados
 * @param group - Nome do grupo de permissoes (ex: "Estabelecimentos")
 * @returns Array de nomes das permissoes
 */
export async function getUserPermissions(userId: number, group: string): Promise<string[]> {
  try {
    console.log(`[getUserPermissions] Buscando permissoes para userId: ${userId}, grupo: ${group}`);

    // Buscar dados do usuario
    const userData = await db
      .select({
        idProfile: users.idProfile,
        profileName: profiles.name,
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!userData || userData.length === 0) {
      console.log(`[getUserPermissions] Usuario nao encontrado`);
      return [];
    }

    const user = userData[0];
    const profileName = (user.profileName ?? "").toUpperCase();
    const isSuperAdminValue = profileName.includes("SUPER_ADMIN") || profileName.includes("SUPER");

    // Super Admin: retorna todas as permissoes do grupo
    if (isSuperAdminValue) {
      console.log(`[getUserPermissions] Super Admin detectado, retornando todas as permissoes do grupo`);
      const allPermissions = await db
        .select({ name: functions.name })
        .from(functions)
        .where(and(eq(functions.group, group), eq(functions.active, true)));

      return allPermissions.map(p => p.name).filter((n): n is string => n !== null);
    }

    // Usuarios normais: buscar permissoes do perfil
    if (!user.idProfile) {
      console.log(`[getUserPermissions] Usuario sem perfil`);
      return [];
    }

    const permissions = await db
      .select({ name: functions.name })
      .from(profileFunctions)
      .innerJoin(functions, eq(profileFunctions.idFunctions, functions.id))
      .where(
        and(
          eq(profileFunctions.idProfile, user.idProfile),
          eq(profileFunctions.active, true),
          eq(functions.group, group),
          eq(functions.active, true)
        )
      );

    const result = permissions.map(p => p.name).filter((n): n is string => n !== null);
    console.log(`[getUserPermissions] Encontradas ${result.length} permissoes`);
    return result;
  } catch (error) {
    console.error("[getUserPermissions] Erro:", error);
    return [];
  }
}

/**
 * Verifica se um usuario e Super Admin pelo ID do banco de dados
 * @param userId - ID do usuario no banco de dados
 * @returns true se o usuario e Super Admin, false caso contrario
 */
export async function isSuperAdminById(userId: number): Promise<boolean> {
  try {
    const userData = await db
      .select({ 
        userType: users.userType,
        profileName: profiles.name 
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!userData || userData.length === 0) {
      return false;
    }

    if (userData[0].userType === USER_TYPES.SUPER_ADMIN) {
      return true;
    }

    const profileName = (userData[0].profileName ?? "").toUpperCase();
    return profileName.includes("SUPER_ADMIN") || profileName.includes("SUPER");
  } catch (error) {
    console.error("[isSuperAdminById] Erro:", error);
    return false;
  }
}

export async function checkPagePermission(
  group: string,
  permission: string = "Listar"
): Promise<string[]> {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
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

    // Buscar o usuário
    const user = await db
      .select({
        id: users.id,
        idProfile: users.idProfile,
      })
      .from(users)
      .where(eq(users.id, sessionUser.id))
      .limit(1);

    if (!user || user.length === 0) return [];

    const userId = user[0].id;
    const profileId = user[0].idProfile;

    // 1. Buscar permissões da categoria para o grupo específico
    let categoryPermissions: string[] = [];
    if (profileId) {
      const categoryResult = await db
        .select({
          functionName: functions.name,
        })
        .from(profileFunctions)
        .innerJoin(functions, eq(profileFunctions.idFunctions, functions.id))
        .where(
          and(
            eq(profileFunctions.idProfile, profileId),
            eq(functions.group, group),
            eq(functions.active, true),
            eq(profileFunctions.active, true)
          )
        );

      categoryPermissions = categoryResult
        .map((r) => r.functionName)
        .filter((name): name is string => name !== null && typeof name === "string");
    }

    // 2. Buscar permissões individuais para o grupo específico
    let individualPermissions: string[] = [];
    try {
      const individualResult = await db
        .select({
          functionName: functions.name,
        })
        .from(userFunctions)
        .innerJoin(functions, eq(userFunctions.idFunctions, functions.id))
        .where(
          and(
            eq(userFunctions.idUser, userId),
            eq(functions.group, group),
            eq(functions.active, true),
            eq(userFunctions.active, true)
          )
        );

      individualPermissions = individualResult
        .map((r) => r.functionName)
        .filter((name): name is string => name !== null && typeof name === "string");
    } catch (error) {
      // Se a tabela não existe, continuar sem erro
      console.warn("[checkPagePermission] user_functions table may not exist:", error);
    }

    // 3. Combinar permissões (remover duplicatas)
    const allPermissions = [...new Set([...categoryPermissions, ...individualPermissions])];

    // Se a permissão específica foi solicitada e não está na lista, retornar array vazio
    // (isso fará com que componentes que verificam permissions.includes() retornem false)
    if (permission && !allPermissions.includes(permission)) {
      // Não redirecionar, apenas retornar permissões (deixar o componente decidir)
      return allPermissions;
    }

    return allPermissions;
  } catch (error) {
    console.error("Error checking page permission:", error);
    return [];
  }
}

// =====================================================
// VERIFICAÇÃO DE ACESSO A PÁGINAS
// =====================================================

// PAGE_PERMISSION_MAP importado de menu-permissions.ts (não pode exportar objeto de "use server")
import { PAGE_PERMISSION_MAP } from "./menu-permissions";

/**
 * Verifica se o usuário tem acesso a uma página específica
 * Super Admin sempre tem acesso
 * Outros usuários precisam ter a permissão específica (categoria OU individual)
 * 
 * @param pathname - Caminho da página (ex: "/customers", "/config/users")
 * @returns true se tem acesso, false caso contrário
 */
export async function canAccessPage(pathname: string): Promise<boolean> {
  try {
    // Super Admin sempre tem acesso
    const isSuper = await isSuperAdmin();
    if (isSuper) return true;

    // Buscar mapeamento de permissão para a rota
    const permissionConfig = PAGE_PERMISSION_MAP[pathname];
    
    // Se a rota não está no mapeamento, permitir acesso (rotas públicas ou não mapeadas)
    if (!permissionConfig) {
      return true;
    }

    // Verificar se tem a permissão
    return await hasPermission(permissionConfig.function);
  } catch (error) {
    console.error("[canAccessPage] Error checking page access:", error);
    return false;
  }
}

/**
 * Obtém todas as páginas que o usuário pode acessar
 * Útil para filtrar o menu
 * 
 * @returns Array de pathnames que o usuário pode acessar
 */
export async function getAccessiblePages(): Promise<string[]> {
  try {
    // Super Admin tem acesso a tudo
    const isSuper = await isSuperAdmin();
    if (isSuper) {
      return Object.keys(PAGE_PERMISSION_MAP);
    }

    const accessiblePages: string[] = [];

    // Verificar cada página
    for (const [pathname, config] of Object.entries(PAGE_PERMISSION_MAP)) {
      const hasAccess = await hasPermission(config.function);
      if (hasAccess) {
        accessiblePages.push(pathname);
      }
    }

    return accessiblePages;
  } catch (error) {
    console.error("[getAccessiblePages] Error:", error);
    return [];
  }
}

/**
 * Obtém as URLs de menu que o usuário pode ver
 * Considera: Super Admin, Admin, e permissões específicas
 * 
 * @returns Objeto com flags de acesso e lista de URLs permitidas
 */
export async function getMenuAccessInfo(): Promise<{
  isSuperAdmin: boolean;
  isAdmin: boolean;
  allowedUrls: string[];
}> {
  try {
    const userInfo = await getCurrentUserInfo();
    
    if (!userInfo) {
      return {
        isSuperAdmin: false,
        isAdmin: false,
        allowedUrls: [],
      };
    }

    // Super Admin tem acesso a tudo
    if (userInfo.isSuperAdmin) {
      return {
        isSuperAdmin: true,
        isAdmin: true,
        allowedUrls: Object.keys(PAGE_PERMISSION_MAP),
      };
    }

    // Admin tem acesso a quase tudo (exceto categorias que é Super Admin only)
    if (userInfo.isAdmin) {
      const adminUrls = Object.keys(PAGE_PERMISSION_MAP).filter(url => 
        url !== "/config/categories" // Super Admin only
      );
      
      return {
        isSuperAdmin: false,
        isAdmin: true,
        allowedUrls: adminUrls,
      };
    }

    // Usuário comum - verificar permissões específicas
    const allowedUrls: string[] = [];
    
    for (const [pathname, config] of Object.entries(PAGE_PERMISSION_MAP)) {
      // Pular URLs que são admin-only
      if (["/customers", "/config", "/config/users", "/config/categories"].includes(pathname)) {
        continue;
      }
      
      const hasAccess = await hasPermission(config.function);
      if (hasAccess) {
        allowedUrls.push(pathname);
      }
    }

    return {
      isSuperAdmin: false,
      isAdmin: false,
      allowedUrls,
    };
  } catch (error) {
    console.error("[getMenuAccessInfo] Error:", error);
    return {
      isSuperAdmin: false,
      isAdmin: false,
      allowedUrls: [],
    };
  }
}

/**
 * Obtém o role de um usuário específico (por userId)
 * Usado para View Mode - retorna o role do usuário simulado
 * @param userId - ID do usuário
 * @returns 'super_admin' | 'admin' | 'executivo' | 'core' | null
 */
export async function getUserRoleById(userId: number): Promise<'super_admin' | 'admin' | 'executivo' | 'core' | null> {
  try {
    const isSuperAdminValue = await isSuperAdminById(userId);
    if (isSuperAdminValue) {
      return 'super_admin';
    }

    const user = await db
      .select({
        categoryType: profiles.categoryType,
        profileName: profiles.name,
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      console.log(`[getUserRoleById] User ${userId} not found`);
      return null;
    }

    const categoryType = user[0].categoryType?.toUpperCase() || "";
    const profileName = user[0].profileName?.toUpperCase() || "";

    // Admin tem acesso total (abaixo de Super Admin)
    if (categoryType === "ADMIN" || profileName.includes("ADMIN")) {
      return 'admin';
    }
    if (categoryType === "EXECUTIVO" || profileName.includes("EXECUTIVO")) {
      return 'executivo';
    }
    if (categoryType === "CORE" || profileName.includes("CORE")) {
      return 'core';
    }

    return null;
  } catch (error) {
    console.error(`[getUserRoleById] Error getting role for user ${userId}:`, error);
    return null;
  }
}

/**
 * Verifica se um usuário específico existe e está ativo
 * Usado para validar simulatedUserId antes de processar
 * @param userId - ID do usuário a verificar
 * @returns true se o usuário existe e está ativo
 */
export async function isUserActiveById(userId: number): Promise<boolean> {
  try {
    const user = await db
      .select({
        id: users.id,
        active: users.active,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      console.log(`[isUserActiveById] User ${userId} not found`);
      return false;
    }

    return user[0].active === true;
  } catch (error) {
    console.error(`[isUserActiveById] Error checking user ${userId}:`, error);
    return false;
  }
}
