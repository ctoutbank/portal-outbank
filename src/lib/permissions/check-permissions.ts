"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, profiles, profileFunctions, functions, adminCustomers, profileCustomers, customers, userFunctions } from "../../../drizzle/schema";
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
 * Verifica AMBAS: permissões da categoria (profile_functions) + permissões individuais (user_functions)
 * @param functionName - Nome da função/permissão a verificar
 */
export async function hasPermission(functionName: string): Promise<boolean> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return false;

    // Primeiro, buscar o usuário e seu perfil
    const user = await db
      .select({
        id: users.id,
        idProfile: users.idProfile,
      })
      .from(users)
      .where(eq(users.idClerk, clerkUser.id))
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
 * Verifica AMBAS: permissões da categoria (profile_functions) + permissões individuais (user_functions)
 * @param group - Nome do grupo (ex: "Estabelecimentos")
 * @param permission - Nome da permissão específica (ex: "Atualizar")
 * @returns Array de permissões do usuário
 */
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
    console.log(`[isSuperAdminById] Verificando Super Admin para userId: ${userId}`);

    const userData = await db
      .select({ profileName: profiles.name })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!userData || userData.length === 0) {
      console.log(`[isSuperAdminById] Usuario nao encontrado`);
      return false;
    }

    const profileName = (userData[0].profileName ?? "").toUpperCase();
    const isSuperAdmin = profileName.includes("SUPER_ADMIN") || profileName.includes("SUPER");
    console.log(`[isSuperAdminById] Perfil: ${profileName}, isSuperAdmin: ${isSuperAdmin}`);
    return isSuperAdmin;
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

    // Buscar o usuário
    const user = await db
      .select({
        id: users.id,
        idProfile: users.idProfile,
      })
      .from(users)
      .where(eq(users.idClerk, clerkUser.id))
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
