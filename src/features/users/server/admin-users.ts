"use server";

import { db } from "@/lib/db";
import { users, profiles, customers, adminCustomers } from "../../../../drizzle/schema";
import { eq, and, ilike, or, inArray, sql, count, desc, asc } from "drizzle-orm";
import { getCurrentUserInfo, isSuperAdmin } from "@/lib/permissions/check-permissions";
import { nanoid } from "nanoid";
import { clerkClient } from "@clerk/nextjs/server";
import { hashPassword } from "@/app/utils/password";
import { generateSlug } from "@/lib/utils";
import { revalidatePath } from "next/cache";

// Função helper para gerar senha aleatória
async function generateRandomPassword(length = 8): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomPassword = "";
  for (let i = 0; i < length; i++) {
    randomPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return randomPassword;
}

/**
 * Lista todos os usuários do sistema com filtros
 * Super Admin vê todos, Admin vê apenas usuários dos ISOs autorizados
 */
export async function getAllUsers(
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    email?: string;
    name?: string;
    customerId?: number;
    profileId?: number;
    active?: boolean;
  }
) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo) {
    throw new Error("Usuário não autenticado");
  }

  const offset = (page - 1) * pageSize;
  const whereConditions = [];

  // Aplicar filtros
  if (filters?.email) {
    whereConditions.push(ilike(users.email, `%${filters.email}%`));
  }

  if (filters?.name) {
    // Buscar no Clerk pelo nome (será necessário ajustar conforme implementação)
    whereConditions.push(ilike(users.email, `%${filters.name}%`));
  }

  if (filters?.customerId) {
    whereConditions.push(eq(users.idCustomer, filters.customerId));
  }

  if (filters?.profileId) {
    whereConditions.push(eq(users.idProfile, filters.profileId));
  }

  if (filters?.active !== undefined) {
    whereConditions.push(eq(users.active, filters.active));
  }

  // Se for Admin (não Super Admin), filtrar apenas ISOs autorizados
  if (userInfo.isAdmin && !userInfo.isSuperAdmin && userInfo.allowedCustomers) {
    if (userInfo.allowedCustomers.length === 0) {
      // Admin sem ISOs autorizados retorna lista vazia
      return {
        users: [],
        totalCount: 0,
      };
    }
    whereConditions.push(inArray(users.idCustomer, userInfo.allowedCustomers));
  }

  // Contar total
  const totalCountResult = await db
    .select({ count: count() })
    .from(users)
    .leftJoin(customers, eq(users.idCustomer, customers.id))
    .leftJoin(profiles, eq(users.idProfile, profiles.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const totalCount = totalCountResult[0]?.count || 0;

  // Buscar usuários
  let result: Array<{
    id: number;
    email: string | null;
    idCustomer: number | null;
    idProfile: number | null;
    active: boolean | null;
    fullAccess: boolean | null;
    customerName: string | null;
    profileName: string | null;
    profileDescription: string | null;
    idClerk: string | null;
  }> = [];

  try {
    result = await db
      .select({
        id: users.id,
        email: users.email,
        idCustomer: users.idCustomer,
        idProfile: users.idProfile,
        active: users.active,
        fullAccess: users.fullAccess,
        customerName: customers.name,
        profileName: profiles.name,
        profileDescription: profiles.description,
        idClerk: users.idClerk,
      })
      .from(users)
      .leftJoin(customers, eq(users.idCustomer, customers.id))
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(users.id))
      .limit(pageSize)
      .offset(offset);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return {
      users: [],
      totalCount: 0,
    };
  }

  // Se não houver resultados, retornar vazio
  if (!result || result.length === 0) {
    return {
      users: [],
      totalCount,
    };
  }

  // Buscar todos os ISOs de admin_customers em batch (otimização)
  const userIds = result.map(u => u.id).filter((id): id is number => id !== null && id !== undefined);
  const adminCustomersMap = new Map<number, Array<{ idCustomer: number; customerName: string | null }>>();
  
  if (userIds.length > 0) {
    try {
      const allAdminCustomers = await db
        .select({
          idUser: adminCustomers.idUser,
          idCustomer: adminCustomers.idCustomer,
          customerName: customers.name,
        })
        .from(adminCustomers)
        .leftJoin(customers, eq(adminCustomers.idCustomer, customers.id))
        .where(and(
          inArray(adminCustomers.idUser, userIds),
          eq(adminCustomers.active, true)
        ));

      // Agrupar por idUser
      allAdminCustomers.forEach(ac => {
        if (ac.idUser && ac.idCustomer) {
          const list = adminCustomersMap.get(ac.idUser) || [];
          list.push({
            idCustomer: ac.idCustomer,
            customerName: ac.customerName,
          });
          adminCustomersMap.set(ac.idUser, list);
        }
      });
    } catch (error: any) {
      // Se a tabela não existe ou há erro, continuar sem erros
      const isTableError = error?.code === '42P01' || 
                          error?.message?.includes('does not exist') || 
                          (error?.message?.includes('relation') && error?.message?.includes('admin_customers'));
      if (!isTableError) {
        console.error('Erro ao buscar ISOs de admin_customers:', error);
      }
    }
  }

  // Processar usuários e combinar ISOs
  type UserWithCustomers = typeof result[0] & { 
    customers: Array<{ idCustomer: number; customerName: string | null }>;
    lastAccess?: string | null;
  };

  const processedUsers: UserWithCustomers[] = result.map((user) => {
    const customersSet = new Map<number, { idCustomer: number; customerName: string | null }>();
    
    // Adicionar ISO principal se existir
    if (user.idCustomer) {
      customersSet.set(user.idCustomer, {
        idCustomer: user.idCustomer,
        customerName: user.customerName,
      });
    }
    
    // Adicionar ISOs de admin_customers (se houver)
    const adminCustomersList = adminCustomersMap.get(user.id) || [];
    adminCustomersList.forEach(customer => {
      if (customer.idCustomer) {
        customersSet.set(customer.idCustomer, {
          idCustomer: customer.idCustomer,
          customerName: customer.customerName,
        });
      }
    });
    
    // Converter Map para Array (remove duplicatas automaticamente)
    const customersList = Array.from(customersSet.values());

    return {
      ...user,
      customers: customersList,
    };
  });

  const usersWithISOs = processedUsers;

  // Buscar últimos acessos do Clerk
  let usersWithLastAccess: UserWithCustomers[] = [];
  
  try {
    const clerk = await clerkClient();
    usersWithLastAccess = await Promise.all(
      usersWithISOs.map(async (user) => {
        let lastAccess: string | null = null;
        if (user.idClerk) {
          try {
            const clerkUser = await clerk.users.getUser(user.idClerk);
            lastAccess = clerkUser.lastSignInAt ? new Date(clerkUser.lastSignInAt).toISOString() : null;
          } catch (error) {
            // Não logar erro se usuário não existir no Clerk (pode ser esperado)
            if (error instanceof Error && !error.message.includes('not found')) {
              console.error(`Erro ao buscar último acesso do usuário ${user.idClerk}:`, error);
            }
          }
        }
        return {
          ...user,
          lastAccess,
        };
      })
    );
  } catch (error) {
    console.error('Erro ao buscar últimos acessos do Clerk:', error);
    // Retornar usuários sem últimos acessos se houver erro
    usersWithLastAccess = usersWithISOs.map(user => ({ ...user, lastAccess: null }));
  }

  return {
    users: usersWithLastAccess,
    totalCount,
  };
}

/**
 * Obtém os ISOs autorizados para um Admin
 */
export async function getAdminCustomers(adminUserId: number) {
  try {
    const result = await db
      .select({
        id: adminCustomers.id,
        idCustomer: adminCustomers.idCustomer,
        customerName: customers.name,
        customerSlug: customers.slug,
        active: adminCustomers.active,
      })
      .from(adminCustomers)
      .leftJoin(customers, eq(adminCustomers.idCustomer, customers.id))
      .where(and(eq(adminCustomers.idUser, adminUserId), eq(adminCustomers.active, true)));

    return result;
  } catch (error: any) {
    // Se a tabela não existe, retornar array vazio em vez de quebrar
    if (error?.code === '42P01' || error?.message?.includes('does not exist') || (error?.message?.includes('relation') && error?.message?.includes('admin_customers'))) {
      console.warn('Tabela admin_customers não existe ainda. Retornando array vazio. Execute a migration 0002_add_admin_customers_table.sql');
      return [];
    }
    // Para outros erros, relançar
    console.error('Erro ao buscar ISOs autorizados para Admin:', error);
    throw error;
  }
}

/**
 * Atribui um ISO a um Admin
 */
export async function assignCustomerToAdmin(adminUserId: number, customerId: number) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode atribuir ISOs a Admins");
  }

  try {
    // Verificar se já existe
    const existing = await db
      .select()
      .from(adminCustomers)
      .where(and(eq(adminCustomers.idUser, adminUserId), eq(adminCustomers.idCustomer, customerId)))
      .limit(1);

    if (existing.length > 0) {
      // Atualizar para ativo se estiver inativo
      await db
        .update(adminCustomers)
        .set({
          active: true,
          dtupdate: new Date().toISOString(),
        })
        .where(eq(adminCustomers.id, existing[0].id));
      return existing[0].id;
    }

    // Criar novo registro
    const slug = `admin-${adminUserId}-customer-${customerId}-${nanoid(10)}`;
    const result = await db
      .insert(adminCustomers)
      .values({
        idUser: adminUserId,
        idCustomer: customerId,
        slug,
        active: true,
      })
      .returning({ id: adminCustomers.id });

    return result[0]?.id;
  } catch (error: any) {
    // Se a tabela não existe, retornar erro mais amigável
    if (error?.code === '42P01' || error?.message?.includes('does not exist') || error?.message?.includes('relation') && error?.message?.includes('admin_customers')) {
      console.error('Tabela admin_customers não existe. Execute a migration 0002_add_admin_customers_table.sql');
      throw new Error('Tabela admin_customers não existe. Execute a migration 0002_add_admin_customers_table.sql no banco de dados de produção.');
    }
    throw error;
  }
}

/**
 * Remove um ISO de um Admin
 */
export async function removeCustomerFromAdmin(adminUserId: number, customerId: number) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode remover ISOs de Admins");
  }

  try {
    await db
      .update(adminCustomers)
      .set({
        active: false,
        dtupdate: new Date().toISOString(),
      })
      .where(and(eq(adminCustomers.idUser, adminUserId), eq(adminCustomers.idCustomer, customerId)));

    return true;
  } catch (error: any) {
    // Se a tabela não existe, retornar erro mais amigável
    if (error?.code === '42P01' || error?.message?.includes('does not exist') || error?.message?.includes('relation') && error?.message?.includes('admin_customers')) {
      console.error('Tabela admin_customers não existe. Execute a migration 0002_add_admin_customers_table.sql');
      throw new Error('Tabela admin_customers não existe. Execute a migration 0002_add_admin_customers_table.sql no banco de dados de produção.');
    }
    throw error;
  }
}

/**
 * Atualiza os ISOs autorizados de um Admin (substitui lista completa)
 */
export async function updateAdminCustomers(adminUserId: number, customerIds: number[]) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode atualizar ISOs de Admins");
  }

  try {
    // Desativar todos os existentes
    await db
      .update(adminCustomers)
      .set({
        active: false,
        dtupdate: new Date().toISOString(),
      })
      .where(eq(adminCustomers.idUser, adminUserId));

    // Criar novos ou reativar existentes
    for (const customerId of customerIds) {
      await assignCustomerToAdmin(adminUserId, customerId);
    }

    return true;
  } catch (error: any) {
    // Se a tabela não existe, retornar erro mais amigável
    if (error?.code === '42P01' || error?.message?.includes('does not exist') || error?.message?.includes('relation') && error?.message?.includes('admin_customers')) {
      console.error('Tabela admin_customers não existe. Execute a migration 0002_add_admin_customers_table.sql');
      throw new Error('Tabela admin_customers não existe. Execute a migration 0002_add_admin_customers_table.sql no banco de dados de produção.');
    }
    throw error;
  }
}

/**
 * Lista todos os perfis disponíveis
 */
export async function getAllProfiles() {
  try {
    const result = await db
      .select({
        id: profiles.id,
        name: profiles.name,
        description: profiles.description,
        active: profiles.active,
      })
      .from(profiles)
      .where(eq(profiles.active, true))
      .orderBy(asc(profiles.name));

    return result;
  } catch (error) {
    console.error('Erro ao buscar perfis:', error);
    return [];
  }
}

/**
 * Lista todos os ISOs (para Super Admin) ou ISOs autorizados (para Admin)
 */
export async function getAvailableCustomers() {
  try {
    const userInfo = await getCurrentUserInfo();
    if (!userInfo) {
      console.error('Usuário não autenticado ao buscar ISOs disponíveis');
      return [];
    }

    // Super Admin vê todos
    if (userInfo.isSuperAdmin) {
      const result = await db
        .select({
          id: customers.id,
          name: customers.name,
          slug: customers.slug,
          isActive: customers.isActive,
        })
        .from(customers)
        .where(eq(customers.isActive, true))
        .orderBy(asc(customers.name));

      return result;
    }

    // Admin vê apenas ISOs autorizados
    if (userInfo.isAdmin && !userInfo.isSuperAdmin && userInfo.allowedCustomers) {
      if (userInfo.allowedCustomers.length === 0) {
        return [];
      }

      const result = await db
        .select({
          id: customers.id,
          name: customers.name,
          slug: customers.slug,
          isActive: customers.isActive,
        })
        .from(customers)
        .where(and(inArray(customers.id, userInfo.allowedCustomers), eq(customers.isActive, true)))
        .orderBy(asc(customers.name));

      return result;
    }

    // Usuário normal vê apenas seu ISO
    if (userInfo.idCustomer) {
      const result = await db
        .select({
          id: customers.id,
          name: customers.name,
          slug: customers.slug,
          isActive: customers.isActive,
        })
        .from(customers)
        .where(and(eq(customers.id, userInfo.idCustomer), eq(customers.isActive, true)))
        .limit(1);

      return result;
    }

    return [];
  } catch (error) {
    console.error('Erro ao buscar ISOs disponíveis:', error);
    return [];
  }
}

/**
 * Cria um novo Admin (apenas Super Admin pode criar)
 */
export async function createAdminUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  customerIds?: number[]; // ISOs autorizados para o Admin
}) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode criar Admins");
  }

  const { firstName, lastName, email, password, customerIds = [] } = data;

  // Validar email
  if (!email || !email.includes("@")) {
    throw new Error("Email inválido");
  }

  // Gerar senha
  const finalPassword = password && password.trim() !== "" 
    ? password 
    : await generateRandomPassword(12);

  if (finalPassword.length < 8) {
    throw new Error("A senha deve ter pelo menos 8 caracteres.");
  }

  const hashedPassword = hashPassword(finalPassword);

  // Buscar perfil ADMIN (não SUPER_ADMIN)
  const adminProfile = await db
    .select()
    .from(profiles)
    .where(and(
      ilike(profiles.name, "%ADMIN%"),
      sql`UPPER(${profiles.name}) NOT LIKE '%SUPER%'`
    ))
    .limit(1);

  if (!adminProfile || adminProfile.length === 0) {
    throw new Error("Perfil ADMIN não encontrado no banco.");
  }

  const idProfile = adminProfile[0].id;

  // Criar no Clerk
  const clerk = await clerkClient();
  let clerkUser;
  try {
    clerkUser = await clerk.users.createUser({
      firstName,
      lastName,
      emailAddress: [email],
      password: finalPassword,
      publicMetadata: {
        isFirstLogin: true,
      },
    });
  } catch (error: any) {
    console.error("Erro ao criar usuário no Clerk:", error);
    if (error?.errors?.some((e: any) => e.code === "form_password_pwned")) {
      throw new Error("Senha comprometida: Essa senha foi encontrada em vazamentos de dados.");
    }
    throw new Error(`Erro ao criar usuário no Clerk: ${error?.message || "Erro desconhecido"}`);
  }

  // Criar no banco
  const created = await db
    .insert(users)
    .values({
      slug: generateSlug(),
      dtinsert: new Date().toISOString(),
      dtupdate: new Date().toISOString(),
      active: true,
      email,
      idCustomer: null, // Admin não tem ISO específico, usa admin_customers
      idClerk: clerkUser.id,
      idProfile,
      idAddress: null,
      fullAccess: false,
      hashedPassword,
      initialPassword: finalPassword,
    })
    .returning({ id: users.id });

  const userId = created[0].id;

  // Atribuir ISOs ao Admin
  if (customerIds.length > 0) {
    for (const customerId of customerIds) {
      await assignCustomerToAdmin(userId, customerId);
    }
  }

  revalidatePath("/config/users");
  
  return {
    id: userId,
    email,
    clerkId: clerkUser.id,
  };
}

/**
 * Atualiza permissões de um usuário (perfil, ISO, fullAccess)
 */
export async function updateUserPermissions(
  userId: number,
  data: {
    idProfile?: number;
    idCustomer?: number | null;
    fullAccess?: boolean;
    customerIds?: number[]; // Para Admin, atualizar ISOs autorizados
  }
) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo) {
    throw new Error("Usuário não autenticado");
  }

  // Verificar se usuário existe
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existingUser || existingUser.length === 0) {
    throw new Error("Usuário não encontrado");
  }

  const user = existingUser[0];

  // Super Admin pode atualizar qualquer usuário
  // Admin só pode atualizar usuários dos ISOs autorizados
  if (!userInfo.isSuperAdmin) {
    if (userInfo.isAdmin && !userInfo.isSuperAdmin) {
      // Admin só pode atualizar se o usuário estiver em um ISO autorizado
      if (user.idCustomer && userInfo.allowedCustomers && !userInfo.allowedCustomers.includes(user.idCustomer)) {
        throw new Error("Você não tem permissão para atualizar este usuário");
      }

      // Admin não pode criar outros Admins ou Super Admins
      if (data.idProfile) {
        const profile = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, data.idProfile))
          .limit(1);

        if (profile && profile.length > 0) {
          const profileName = profile[0].name?.toUpperCase() || "";
          if (profileName.includes("ADMIN") || profileName.includes("SUPER")) {
            throw new Error("Admin não pode atribuir perfil ADMIN ou SUPER_ADMIN");
          }
        }
      }
    } else {
      throw new Error("Apenas Admin ou Super Admin pode atualizar permissões");
    }
  }

  // Atualizar usuário
  const updateData: any = {
    dtupdate: new Date().toISOString(),
  };

  if (data.idProfile !== undefined) {
    updateData.idProfile = data.idProfile;
  }

  if (data.idCustomer !== undefined) {
    updateData.idCustomer = data.idCustomer;
  }

  if (data.fullAccess !== undefined) {
    updateData.fullAccess = data.fullAccess;
  }

  await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId));

  // Se for Admin e tiver customerIds, atualizar admin_customers
  if (data.customerIds !== undefined && Array.isArray(data.customerIds) && userInfo.isSuperAdmin) {
    // Verificar se o perfil do usuário é Admin
    const userProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, data.idProfile || user.idProfile || 0))
      .limit(1);

    if (userProfile && userProfile.length > 0) {
      const profileName = userProfile[0].name?.toUpperCase() || "";
      const isAdminProfile = profileName.includes("ADMIN") && !profileName.includes("SUPER");

      if (isAdminProfile) {
        try {
          await updateAdminCustomers(userId, data.customerIds);
        } catch (error: any) {
          // Se a tabela não existe, apenas logar warning e continuar
          if (error?.code === '42P01' || error?.message?.includes('does not exist') || (error?.message?.includes('relation') && error?.message?.includes('admin_customers'))) {
            console.warn('Tabela admin_customers não existe. ISOs autorizados não foram atualizados. Execute a migration 0002_add_admin_customers_table.sql');
          } else {
            // Para outros erros, relançar
            console.error('Erro ao atualizar ISOs autorizados:', error);
            throw error;
          }
        }
      }
    }
  }

  revalidatePath("/config/users");
  
  return true;
}

/**
 * Atribui o perfil SUPER_ADMIN a um usuário por email
 * @param email - Email do usuário a ser promovido a Super Admin
 * @returns Objeto com informações da atualização
 */
export async function assignSuperAdminToUser(email: string) {
  try {
    // Normalizar email para lowercase
    const normalizedEmail = email.trim().toLowerCase();

    // Buscar perfil SUPER_ADMIN (nome contém "SUPER" case-insensitive)
    const superAdminProfile = await db
      .select()
      .from(profiles)
      .where(
        and(
          ilike(profiles.name, "%SUPER%"),
          eq(profiles.active, true)
        )
      )
      .orderBy(asc(profiles.name))
      .limit(1);

    if (!superAdminProfile || superAdminProfile.length === 0) {
      throw new Error(
        "Perfil SUPER_ADMIN não encontrado. Certifique-se de que existe um perfil com 'SUPER' no nome."
      );
    }

    const superAdminProfileId = superAdminProfile[0].id;

    // Buscar usuário por email (case-insensitive)
    const userResult = await db
      .select()
      .from(users)
      .where(ilike(users.email, normalizedEmail))
      .limit(1);

    if (!userResult || userResult.length === 0) {
      throw new Error(`Usuário com email ${email} não encontrado.`);
    }

    const user = userResult[0];

    // Atualizar perfil do usuário
    await db
      .update(users)
      .set({
        idProfile: superAdminProfileId,
        dtupdate: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    return {
      success: true,
      userId: user.id,
      email: user.email,
      profileId: superAdminProfileId,
      profileName: superAdminProfile[0].name,
    };
  } catch (error) {
    console.error("Error assigning Super Admin to user:", error);
    throw error;
  }
}
