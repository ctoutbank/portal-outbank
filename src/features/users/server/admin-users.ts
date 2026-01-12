"use server";

import { db } from "@/lib/db";
import { users, profiles, customers, adminCustomers, functions, profileFunctions, userFunctions, profileCustomers, salesAgents, userCustomers, merchants } from "../../../../drizzle/schema";
import { eq, and, ilike, inArray, sql, count, desc, asc, isNull, or } from "drizzle-orm";
import { getCurrentUserInfo, isSuperAdmin } from "@/lib/permissions/check-permissions";
import { nanoid } from "nanoid";
import { hashPassword } from "@/app/utils/password";
import { generateSlug } from "@/lib/utils";
import { revalidatePath } from "next/cache";

// =====================================================
// CONSTANTES E PROTEÇÕES
// =====================================================

/**
 * Email do Super Admin protegido que JAMAIS pode ser deletado ou desativado
 * Não pode ser exportado de arquivo "use server" - definido como constante local
 */
const PROTECTED_SUPER_ADMIN_EMAIL = "cto@outbank.com.br";

/**
 * Verifica se um usuário é o Super Admin protegido
 * Esta verificação é usada para IMPEDIR deleção, desativação ou alteração de permissões
 */
export async function isProtectedSuperAdmin(
  identifier: number | string
): Promise<boolean> {
  try {
    let user;
    
    if (typeof identifier === "number") {
      // Busca por ID do banco
      user = await db
        .select({ email: users.email, idClerk: users.idClerk })
        .from(users)
        .where(eq(users.id, identifier))
        .limit(1);
    } else if (identifier.includes("@")) {
      // É um email
      return identifier.toLowerCase() === PROTECTED_SUPER_ADMIN_EMAIL.toLowerCase();
    } else {
      // É um idClerk - buscar email
      user = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.idClerk, identifier))
        .limit(1);
    }
    
    if (!user || user.length === 0) {
      return false;
    }
    
    return user[0].email?.toLowerCase() === PROTECTED_SUPER_ADMIN_EMAIL.toLowerCase();
  } catch (error) {
    console.error("[isProtectedSuperAdmin] Erro ao verificar proteção:", error);
    return false;
  }
}

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
 * Lista todos os usuarios do sistema com filtros
 * Super Admin ve todos, Admin ve apenas usuarios dos ISOs autorizados
 * @param page - Numero da pagina
 * @param pageSize - Quantidade de registros por pagina
 * @param filters - Filtros de busca
 * @param userType - Tipo de usuario:
 *   - "portal": usuarios sem idCustomer (administradores do portal)
 *   - "iso_admin": usuarios com idCustomer E categoryType = 'ISO_ADMIN' (administradores dos ISOs)
 *   - "user_iso": usuarios com idCustomer E categoryType != 'ISO_ADMIN' (equipe dos ISOs)
 *   - "iso": todos usuarios com idCustomer (compatibilidade)
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
  },
  userType?: "portal" | "iso" | "iso_admin" | "user_iso"
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

  // Filtrar por tipo de usuario
  if (userType === "portal") {
    // Usuarios do portal: sem idCustomer
    whereConditions.push(isNull(users.idCustomer));
  } else if (userType === "iso_admin") {
    // ISO Admins: com idCustomer E categoryType = 'ISO_ADMIN'
    whereConditions.push(sql`${users.idCustomer} IS NOT NULL`);
    whereConditions.push(sql`${profiles.categoryType} = 'ISO_ADMIN'`);
  } else if (userType === "user_iso") {
    // Equipe dos ISOs: com idCustomer E categoryType != 'ISO_ADMIN' (ou null)
    whereConditions.push(sql`${users.idCustomer} IS NOT NULL`);
    whereConditions.push(sql`(${profiles.categoryType} IS NULL OR ${profiles.categoryType} != 'ISO_ADMIN')`);
  } else if (userType === "iso") {
    // Todos usuarios de ISOs: com idCustomer (compatibilidade)
    whereConditions.push(sql`${users.idCustomer} IS NOT NULL`);
  } else if (!filters?.customerId) {
    // Comportamento padrao: apenas usuarios do portal (sem id_customer)
    whereConditions.push(isNull(users.idCustomer));
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

    // Debug: verificar se customers está sendo populado
    if (customersList.length > 0) {
      console.log(`[getAllUsers] Usuário ${user.id} tem ${customersList.length} ISO(s):`, customersList.map(c => c.customerName || `ISO ${c.idCustomer}`).join(', '));
    }

    return {
      ...user,
      customers: customersList,
    };
  });

  const usersWithISOs = processedUsers;

  // Adicionar lastAccess como null (sem integração com Clerk)
  const usersWithLastAccess = usersWithISOs.map(user => ({ 
    ...user, 
    customers: user.customers || [],
    lastAccess: null 
  }));

  return {
    users: usersWithLastAccess,
    totalCount,
  };
}

/**
 * Lista usuários do tenant (ISO) - APENAS usuários criados dentro do tenant
 * Esta função é usada no ambiente tenant para mostrar apenas:
 * - Usuários com idCustomer = ID do tenant atual
 * - ISO Admin do tenant
 * 
 * EXCLUI automaticamente:
 * - Super Admin (userType = 'SUPER_ADMIN')
 * - Usuários CORE (categoryType = 'CORE')
 * - Usuários EXECUTIVO (categoryType = 'EXECUTIVO')
 * - Usuários do portal (sem idCustomer ou com idCustomer diferente)
 * - Usuários marcados como invisíveis (isInvisible = true)
 */
export async function getTenantUsers(
  tenantCustomerId: number,
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    email?: string;
    name?: string;
    profileId?: number;
    active?: boolean;
  }
) {
  const offset = (page - 1) * pageSize;
  const whereConditions = [];

  // OBRIGATÓRIO: Usuário deve pertencer ao tenant (idCustomer = tenant ID)
  whereConditions.push(eq(users.idCustomer, tenantCustomerId));

  // Excluir Super Admin por userType
  whereConditions.push(
    or(
      isNull(users.userType),
      sql`${users.userType} != 'SUPER_ADMIN'`
    )
  );

  // Excluir usuários marcados como invisíveis
  whereConditions.push(
    or(
      isNull(users.isInvisible),
      eq(users.isInvisible, false)
    )
  );

  // Aplicar filtros opcionais
  if (filters?.email) {
    whereConditions.push(ilike(users.email, `%${filters.email}%`));
  }

  if (filters?.profileId) {
    whereConditions.push(eq(users.idProfile, filters.profileId));
  }

  if (filters?.active !== undefined) {
    whereConditions.push(eq(users.active, filters.active));
  }

  // Contar total
  const totalCountResult = await db
    .select({ count: count() })
    .from(users)
    .leftJoin(profiles, eq(users.idProfile, profiles.id))
    .where(and(...whereConditions));

  const totalCount = totalCountResult[0]?.count || 0;

  // Buscar usuários com exclusão de CORE e EXECUTIVO por categoryType do perfil
  const result = await db
    .select({
      id: users.id,
      email: users.email,
      idCustomer: users.idCustomer,
      idProfile: users.idProfile,
      active: users.active,
      fullAccess: users.fullAccess,
      profileName: profiles.name,
      profileDescription: profiles.description,
      categoryType: profiles.categoryType,
      userType: users.userType,
      idClerk: users.idClerk,
    })
    .from(users)
    .leftJoin(profiles, eq(users.idProfile, profiles.id))
    .where(and(...whereConditions))
    .orderBy(desc(users.id))
    .limit(pageSize)
    .offset(offset);

  // Filtrar CORE e EXECUTIVO por categoryType ou nome do perfil (pós-query para fallback legado)
  const filteredUsers = result.filter(user => {
    const categoryType = user.categoryType?.toUpperCase() || "";
    const profileName = user.profileName?.toUpperCase() || "";
    
    // Excluir CORE
    if (categoryType === "CORE" || profileName.includes("CORE")) {
      return false;
    }
    
    // Excluir EXECUTIVO
    if (categoryType === "EXECUTIVO" || profileName.includes("EXECUTIVO")) {
      return false;
    }
    
    // Excluir Super Admin por nome do perfil (fallback)
    if (profileName.includes("SUPER_ADMIN") || profileName.includes("SUPER ADMIN")) {
      return false;
    }
    
    return true;
  });

  return {
    users: filteredUsers.map(user => ({
      ...user,
      customerName: null, // Não precisamos do nome do customer, já é o tenant atual
      customers: [], // Não usado no contexto tenant
      lastAccess: null,
    })),
    totalCount: filteredUsers.length, // Ajustar count após filtragem
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
 * Lista todas as categorias disponíveis
 */
export async function getAllProfiles() {
  try {
    const result = await db
      .select({
        id: profiles.id,
        name: profiles.name,
        description: profiles.description,
        active: profiles.active,
        categoryType: profiles.categoryType,
      })
      .from(profiles)
      .where(eq(profiles.active, true))
      .orderBy(asc(profiles.name));

    return result;
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
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
  isInvisible?: boolean; // Se o usuário deve ser invisível nos ISOs
}) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode criar Admins");
  }

  const { firstName, lastName, email, password, customerIds = [], isInvisible = false } = data;

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

  // Criar no banco (sem Clerk)
  const created = await db
    .insert(users)
    .values({
      slug: generateSlug(),
      dtinsert: new Date().toISOString(),
      dtupdate: new Date().toISOString(),
      active: true,
      email,
      idCustomer: null, // Admin não tem ISO específico, usa admin_customers
      idClerk: null,
      idProfile,
      idAddress: null,
      fullAccess: false,
      hashedPassword,
      initialPassword: finalPassword,
      isInvisible,
    })
    .returning({ id: users.id });

  const userId = created[0].id;

  // Atribuir ISOs ao Admin
  if (customerIds.length > 0) {
    for (const customerId of customerIds) {
      await assignCustomerToAdmin(userId, customerId);
    }
  }

  // Enviar email de boas-vindas do portal
  try {
    const { sendWelcomePasswordEmailPortal } = await import("@/lib/send-email");
    await sendWelcomePasswordEmailPortal(email, finalPassword, `${firstName} ${lastName}`);
    console.log(`[createAdminUser] ✅ Email de boas-vindas enviado para ${email}`);
  } catch (emailError) {
    // Não bloquear criação do usuário se email falhar
    console.error(`[createAdminUser] ⚠️ Falha ao enviar email de boas-vindas (não crítico):`, emailError);
  }

  revalidatePath("/config/users");
  
  return {
    id: userId,
    email,
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
    isoCommissionLinks?: Array<{ customerId: number; commissionType: string }>; // Vínculos ISO com tipo de comissão
    password?: string; // Nova senha (opcional)
    hasMerchantsAccess?: boolean; // Acesso a estabelecimentos
    canViewSensitiveData?: boolean; // Permissão para visualizar dados sensíveis
    canValidateMdr?: boolean; // Permissão para aprovar tabelas de taxas MDR
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

  // Atualizar senha localmente se fornecida
  if (data.password && data.password.trim().length > 0) {
    const newPassword = data.password.trim();
    
    // Validar tamanho mínimo da senha
    if (newPassword.length < 8) {
      throw new Error("A senha deve ter pelo menos 8 caracteres");
    }

    // Verificar se a senha é igual ao email
    const userEmail = user.email?.toLowerCase().trim() || "";
    const passwordLower = newPassword.toLowerCase().trim();
    if (passwordLower === userEmail) {
      throw new Error("A senha não pode ser igual ao email. Por favor, escolha uma senha diferente do endereço de email.");
    }

    // Atualizar hash da senha e senha inicial no banco de dados
    const hashedPassword = hashPassword(newPassword);
    
    await db
      .update(users)
      .set({
        hashedPassword: hashedPassword,
        initialPassword: newPassword,
        dtupdate: new Date().toISOString(),
      })
      .where(eq(users.id, userId));

    console.log(`[updateUserPermissions] ✅ Senha atualizada com sucesso para usuário ID: ${userId}`);
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

  if (data.canViewSensitiveData !== undefined) {
    updateData.canViewSensitiveData = data.canViewSensitiveData;
  }

  if (data.canValidateMdr !== undefined) {
    updateData.canValidateMdr = data.canValidateMdr;
  }

  await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId));

  // =====================================================
  // DETECÇÃO DE MUDANÇA DE CATEGORIA (ISO Admin ↔ Portal)
  // =====================================================
  // Quando a categoria muda, atualiza commission_type em user_customers automaticamente
  // e envia email se for promoção para Portal
  if (data.idProfile !== undefined && data.idProfile !== user.idProfile) {
    try {
      // Buscar category_type do perfil antigo
      const oldProfile = user.idProfile ? await db
        .select({ categoryType: profiles.categoryType, name: profiles.name })
        .from(profiles)
        .where(eq(profiles.id, user.idProfile))
        .limit(1) : [];
      
      // Buscar category_type do novo perfil
      const newProfile = await db
        .select({ categoryType: profiles.categoryType, name: profiles.name })
        .from(profiles)
        .where(eq(profiles.id, data.idProfile))
        .limit(1);
      
      const oldCategoryType = oldProfile[0]?.categoryType?.toUpperCase() || '';
      const newCategoryType = newProfile[0]?.categoryType?.toUpperCase() || '';
      
      console.log(`[updateUserPermissions] Detectada mudança de categoria: ${oldCategoryType} → ${newCategoryType}`);
      
      // Verificar se é uma promoção (ISO_ADMIN → CORE/EXECUTIVO)
      const isPromotion = oldCategoryType === 'ISO_ADMIN' && 
        (newCategoryType === 'CORE' || newCategoryType === 'EXECUTIVO');
      
      // Verificar se é um descredenciamento (CORE/EXECUTIVO → ISO_ADMIN)
      const isDemotion = (oldCategoryType === 'CORE' || oldCategoryType === 'EXECUTIVO') && 
        newCategoryType === 'ISO_ADMIN';
      
      // Verificar se é mudança entre CORE ↔ EXECUTIVO
      const isPortalCategoryChange = 
        (oldCategoryType === 'CORE' && newCategoryType === 'EXECUTIVO') ||
        (oldCategoryType === 'EXECUTIVO' && newCategoryType === 'CORE');
      
      if (isPromotion || isDemotion || isPortalCategoryChange) {
        // Buscar todos os vínculos do usuário em user_customers
        const userLinks = await db
          .select()
          .from(userCustomers)
          .where(eq(userCustomers.idUser, userId));
        
        if (userLinks.length > 0) {
          if (isPromotion || isPortalCategoryChange) {
            // Promoção ou mudança de categoria Portal: atualizar commission_type para a nova categoria
            const newCommissionType = newCategoryType as 'CORE' | 'EXECUTIVO';
            
            await db
              .update(userCustomers)
              .set({ commissionType: newCommissionType })
              .where(eq(userCustomers.idUser, userId));
            
            console.log(`[updateUserPermissions] ✅ commission_type atualizado para ${newCommissionType} em ${userLinks.length} vínculo(s)`);
          } else if (isDemotion) {
            // Descredenciamento: remover commission_type (margens cessadas)
            await db
              .update(userCustomers)
              .set({ commissionType: null })
              .where(eq(userCustomers.idUser, userId));
            
            console.log(`[updateUserPermissions] ✅ commission_type removido (NULL) de ${userLinks.length} vínculo(s) - margens cessadas`);
          }
        }
        
        // Enviar email de promoção se for ISO_ADMIN → CORE/EXECUTIVO
        if (isPromotion) {
          try {
            const { sendPortalPromotionEmail } = await import("@/lib/send-email");
            // Usar email como identificação do usuário
            const userName = user.email?.split('@')[0] || 'Usuário';
            
            await sendPortalPromotionEmail(
              user.email || '',
              userName,
              newCategoryType as 'CORE' | 'EXECUTIVO'
            );
            
            console.log(`[updateUserPermissions] ✅ Email de promoção enviado para ${user.email}`);
          } catch (emailError) {
            // Não bloquear a operação se o email falhar
            console.error(`[updateUserPermissions] ⚠️ Falha ao enviar email de promoção (não crítico):`, emailError);
          }
        }
      }
    } catch (categoryError) {
      console.error(`[updateUserPermissions] ⚠️ Erro ao processar mudança de categoria (não crítico):`, categoryError);
      // Não bloquear a operação principal
    }
  }

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

  // Atualizar acesso a estabelecimentos se fornecido
  if (data.hasMerchantsAccess !== undefined) {
    const profileIdToUse = data.idProfile || user.idProfile;
    if (profileIdToUse) {
      try {
        await updateMerchantsAccessForProfile(profileIdToUse, data.hasMerchantsAccess);
      } catch (error: any) {
        console.error("Erro ao atualizar acesso a estabelecimentos:", error);
        // Não bloquear atualização se houver erro (pode ser que a tabela não exista ainda)
        if (!error?.message?.includes("does not exist") && !error?.message?.includes("relation")) {
          throw error;
        }
      }
    }
  }

  // Atualizar vínculos ISO com tipo de comissão se fornecido
  if (data.isoCommissionLinks !== undefined && Array.isArray(data.isoCommissionLinks)) {
    try {
      const { saveUserIsoCommissionLinks } = await import("@/features/customers/users/_actions/user-actions");
      await saveUserIsoCommissionLinks(userId, data.isoCommissionLinks);
    } catch (error: any) {
      console.error("Erro ao atualizar vínculos de comissão:", error);
      throw error;
    }
  }

  revalidatePath("/config/users");
  revalidatePath("/margens");
  
  return true;
}

/**
 * Garante que a função VIEW_ALL_MERCHANTS existe no banco de dados
 * Se não existir, cria a função
 * @returns ID da função VIEW_ALL_MERCHANTS
 */
async function ensureViewAllMerchantsFunction(): Promise<number> {
  try {
    // Verificar se a função já existe
    const existingFunction = await db
      .select()
      .from(functions)
      .where(eq(functions.name, "VIEW_ALL_MERCHANTS"))
      .limit(1);

    if (existingFunction && existingFunction.length > 0) {
      return existingFunction[0].id;
    }

    // Criar a função se não existir
    const slug = `view-all-merchants-${nanoid(10)}`;
    const result = await db
      .insert(functions)
      .values({
        slug,
        name: "VIEW_ALL_MERCHANTS",
        group: "Estabelecimentos",
        active: true,
      })
      .returning({ id: functions.id });

    return result[0]?.id || 0;
  } catch (error) {
    console.error("Erro ao garantir função VIEW_ALL_MERCHANTS:", error);
    throw error;
  }
}

/**
 * Verifica se um perfil tem acesso a estabelecimentos
 * @param profileId - ID do perfil
 * @returns true se o perfil tem acesso, false caso contrário
 */
export async function profileHasMerchantsAccess(profileId: number): Promise<boolean> {
  try {
    const functionId = await ensureViewAllMerchantsFunction();
    
    if (!functionId) {
      return false;
    }

    const result = await db
      .select()
      .from(profileFunctions)
      .where(
        and(
          eq(profileFunctions.idProfile, profileId),
          eq(profileFunctions.idFunctions, functionId),
          eq(profileFunctions.active, true)
        )
      )
      .limit(1);

    return result && result.length > 0;
  } catch (error) {
    console.error("Erro ao verificar acesso a estabelecimentos:", error);
    return false;
  }
}

/**
 * Atribui ou remove a função VIEW_ALL_MERCHANTS de um perfil
 * @param profileId - ID do perfil
 * @param hasAccess - true para atribuir, false para remover
 */
async function updateMerchantsAccessForProfile(profileId: number, hasAccess: boolean): Promise<void> {
  try {
    const functionId = await ensureViewAllMerchantsFunction();
    
    if (!functionId) {
      throw new Error("Não foi possível criar ou encontrar a função VIEW_ALL_MERCHANTS");
    }

    // Verificar se já existe registro
    const existing = await db
      .select()
      .from(profileFunctions)
      .where(
        and(
          eq(profileFunctions.idProfile, profileId),
          eq(profileFunctions.idFunctions, functionId)
        )
      )
      .limit(1);

    if (hasAccess) {
      // Atribuir função
      if (existing && existing.length > 0) {
        // Atualizar para ativo se já existir
        await db
          .update(profileFunctions)
          .set({
            active: true,
            dtupdate: new Date().toISOString(),
          })
          .where(eq(profileFunctions.id, existing[0].id));
      } else {
        // Criar novo registro
        const slug = `profile-${profileId}-function-${functionId}-${nanoid(10)}`;
        await db.insert(profileFunctions).values({
          slug,
          idProfile: profileId,
          idFunctions: functionId,
          active: true,
        });
      }
    } else {
      // Remover função (desativar)
      if (existing && existing.length > 0) {
        await db
          .update(profileFunctions)
          .set({
            active: false,
            dtupdate: new Date().toISOString(),
          })
          .where(eq(profileFunctions.id, existing[0].id));
      }
    }
  } catch (error) {
    console.error("Erro ao atualizar acesso a estabelecimentos:", error);
    throw error;
  }
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

/**
 * Obtém as atribuições de um usuário que serão transferidas na deleção
 */
export async function getUserAttributions(userId: number) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode ver atribuições de usuários");
  }

  try {
    // Buscar ISOs gerenciados pelo usuário
    const managedCustomers = await db
      .select({
        id: adminCustomers.id,
        idCustomer: adminCustomers.idCustomer,
        customerName: customers.name,
      })
      .from(adminCustomers)
      .leftJoin(customers, eq(adminCustomers.idCustomer, customers.id))
      .where(and(eq(adminCustomers.idUser, userId), eq(adminCustomers.active, true)));

    return {
      managedCustomers,
      totalCustomers: managedCustomers.length,
    };
  } catch (error) {
    console.error("Erro ao buscar atribuições do usuário:", error);
    return {
      managedCustomers: [],
      totalCustomers: 0,
    };
  }
}

/**
 * Desativa um usuário (soft delete)
 * @param userId - ID do usuário a ser desativado
 * @returns Objeto com resultado da operação
 */
export async function deactivateUser(userId: number): Promise<{ success: boolean; error?: string }> {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode desativar usuários");
  }

  // PROTEÇÃO ABSOLUTA: Verificar se é o Super Admin protegido
  const isProtected = await isProtectedSuperAdmin(userId);
  if (isProtected) {
    console.error(`[deactivateUser] ❌ BLOQUEADO: Tentativa de desativar Super Admin protegido (${PROTECTED_SUPER_ADMIN_EMAIL})`);
    throw new Error(`PROTEÇÃO ABSOLUTA: O usuário ${PROTECTED_SUPER_ADMIN_EMAIL} NÃO pode ser desativado`);
  }

  try {
    // Verificar se o usuário existe
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return { success: false, error: "Usuário não encontrado" };
    }

    // Verificar se já está desativado
    if (!user[0].active) {
      return { success: false, error: "Usuário já está desativado" };
    }

    // Desativar usuário (soft delete)
    await db
      .update(users)
      .set({
        active: false,
        dtupdate: new Date().toISOString(),
      })
      .where(eq(users.id, userId));

    console.log(`[deactivateUser] ✅ Usuário ${userId} (${user[0].email}) desativado com sucesso`);
    
    revalidatePath("/config/users");
    
    return { success: true };
  } catch (error) {
    console.error("[deactivateUser] Erro ao desativar usuário:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    };
  }
}

/**
 * Reativa um usuário desativado
 * @param userId - ID do usuário a ser reativado
 * @returns Objeto com resultado da operação
 */
export async function reactivateUser(userId: number): Promise<{ success: boolean; error?: string }> {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode reativar usuários");
  }

  try {
    // Verificar se o usuário existe
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return { success: false, error: "Usuário não encontrado" };
    }

    // Verificar se já está ativo
    if (user[0].active) {
      return { success: false, error: "Usuário já está ativo" };
    }

    // Reativar usuário
    await db
      .update(users)
      .set({
        active: true,
        dtupdate: new Date().toISOString(),
      })
      .where(eq(users.id, userId));

    console.log(`[reactivateUser] ✅ Usuário ${userId} (${user[0].email}) reativado com sucesso`);
    
    revalidatePath("/config/users");
    
    return { success: true };
  } catch (error) {
    console.error("[reactivateUser] Erro ao reativar usuário:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    };
  }
}

/**
 * Deleta um usuário do portal e transfere suas atribuições para outro usuário
 * @param userIdToDelete - ID do usuário a ser deletado
 * @param transferToUserId - ID do usuário que receberá as atribuições (opcional, padrão: Super Admin logado)
 */
export async function deleteUserWithTransfer(
  userIdToDelete: number,
  transferToUserId?: number
) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode deletar usuários");
  }

  // PROTEÇÃO ABSOLUTA: Verificar se é o Super Admin protegido
  const isProtected = await isProtectedSuperAdmin(userIdToDelete);
  if (isProtected) {
    console.error(`[deleteUserWithTransfer] ❌ BLOQUEADO: Tentativa de deletar Super Admin protegido (${PROTECTED_SUPER_ADMIN_EMAIL})`);
    throw new Error(`PROTEÇÃO ABSOLUTA: O usuário ${PROTECTED_SUPER_ADMIN_EMAIL} NÃO pode ser deletado. Esta é uma proteção permanente do sistema.`);
  }

  // Verificar se o usuário é ISO Admin (tem idCustomer)
  const userToCheck = await db
    .select({ idCustomer: users.idCustomer })
    .from(users)
    .where(eq(users.id, userIdToDelete))
    .limit(1);

  if (userToCheck.length > 0 && userToCheck[0].idCustomer) {
    const customerId = userToCheck[0].idCustomer;

    // Verificar se o ISO tem estabelecimentos cadastrados
    const merchantCount = await db
      .select({ count: count() })
      .from(merchants)
      .where(eq(merchants.idCustomer, customerId));

    if (merchantCount[0]?.count > 0) {
      throw new Error(`Não é possível deletar este ISO Admin. O ISO possui ${merchantCount[0].count} estabelecimento(s) cadastrado(s). Remova os estabelecimentos primeiro.`);
    }

    // Verificar se o ISO tem consultores cadastrados (via slugCustomer)
    const customerData = await db
      .select({ slug: customers.slug })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (customerData.length > 0 && customerData[0].slug) {
      const salesAgentCount = await db
        .select({ count: count() })
        .from(salesAgents)
        .where(eq(salesAgents.slugCustomer, customerData[0].slug));

      if (salesAgentCount[0]?.count > 0) {
        throw new Error(`Não é possível deletar este ISO Admin. O ISO possui ${salesAgentCount[0].count} consultor(es) cadastrado(s). Remova os consultores primeiro.`);
      }
    }
  }

  // Se não foi especificado um usuário para transferir, usar o Super Admin logado
  const targetUserId = transferToUserId || userInfo.id;

  if (userIdToDelete === targetUserId) {
    throw new Error("Não é possível transferir atribuições para o próprio usuário que será deletado");
  }

  try {
    // 1. Verificar se o usuário a ser deletado existe
    const userToDelete = await db
      .select()
      .from(users)
      .where(eq(users.id, userIdToDelete))
      .limit(1);

    if (!userToDelete || userToDelete.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    // 2. Verificar se o usuário de destino existe
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!targetUser || targetUser.length === 0) {
      throw new Error("Usuário de destino para transferência não encontrado");
    }

    // 3. Transferir admin_customers (ISOs gerenciados)
    try {
      const adminCustomersToTransfer = await db
        .select()
        .from(adminCustomers)
        .where(eq(adminCustomers.idUser, userIdToDelete));

      for (const ac of adminCustomersToTransfer) {
        // Verificar se o usuário de destino já gerencia este ISO
        const existing = await db
          .select()
          .from(adminCustomers)
          .where(and(
            eq(adminCustomers.idUser, targetUserId),
            eq(adminCustomers.idCustomer, ac.idCustomer!)
          ))
          .limit(1);

        if (existing.length > 0) {
          // Atualizar para ativo se existir
          await db
            .update(adminCustomers)
            .set({ active: true, dtupdate: new Date().toISOString() })
            .where(eq(adminCustomers.id, existing[0].id));
        } else {
          // Criar novo registro
          await db
            .insert(adminCustomers)
            .values({
              idUser: targetUserId,
              idCustomer: ac.idCustomer,
              slug: `admin-${targetUserId}-customer-${ac.idCustomer}-${nanoid(10)}`,
              active: true,
            });
        }
      }

      // Deletar os registros do usuário a ser deletado
      await db
        .delete(adminCustomers)
        .where(eq(adminCustomers.idUser, userIdToDelete));

      console.log(`[deleteUserWithTransfer] ISOs transferidos de usuário ${userIdToDelete} para ${targetUserId}`);
    } catch (error) {
      console.error("Erro ao transferir admin_customers:", error);
    }

    // 4. Deletar o usuário do banco de dados
    await db.delete(users).where(eq(users.id, userIdToDelete));
    console.log(`[deleteUserWithTransfer] Usuário ${userIdToDelete} deletado com sucesso`);

    revalidatePath("/config/users");

    return {
      success: true,
      deletedUserId: userIdToDelete,
      transferredToUserId: targetUserId,
    };
  } catch (error) {
    console.error("Erro ao deletar usuário com transferência:", error);
    throw error;
  }
}

/**
 * Lista usuários disponíveis para receber transferência de atribuições
 */
export async function getAvailableTransferTargets(excludeUserId: number) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode listar usuários para transferência");
  }

  try {
    // Buscar usuários do portal (sem id_customer) que não sejam o usuário a ser excluído
    const availableUsers = await db
      .select({
        id: users.id,
        email: users.email,
        profileName: profiles.name,
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(and(
        isNull(users.idCustomer),
        eq(users.active, true),
        sql`${users.id} != ${excludeUserId}`
      ))
      .orderBy(asc(users.email));

    return availableUsers;
  } catch (error) {
    console.error("Erro ao buscar usuários disponíveis para transferência:", error);
    return [];
  }
}

// =====================================================
// PERMISSÕES INDIVIDUAIS (user_functions)
// =====================================================

/**
 * Obtém permissões individuais de um usuário (da tabela user_functions)
 * Essas são permissões adicionais às da categoria
 */
export async function getUserIndividualPermissions(userId: number) {
  try {
    const result = await db
      .select({
        id: userFunctions.id,
        idFunction: userFunctions.idFunctions,
        functionName: functions.name,
        functionGroup: functions.group,
        active: userFunctions.active,
      })
      .from(userFunctions)
      .leftJoin(functions, eq(userFunctions.idFunctions, functions.id))
      .where(and(
        eq(userFunctions.idUser, userId),
        eq(userFunctions.active, true)
      ));

    return result;
  } catch (error) {
    console.error("[getUserIndividualPermissions] Erro:", error);
    return [];
  }
}

/**
 * Atualiza permissões individuais de um usuário
 * Apenas Super Admin pode fazer isso
 */
export async function updateUserIndividualPermissions(
  userId: number, 
  functionIds: number[]
): Promise<{ success: boolean; error?: string }> {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode atualizar permissões individuais");
  }

  // Proteção: não alterar permissões do CTO
  const isProtected = await isProtectedSuperAdmin(userId);
  if (isProtected) {
    console.warn(`[updateUserIndividualPermissions] Tentativa de alterar permissões do Super Admin protegido bloqueada`);
    throw new Error(`PROTEÇÃO: Não é permitido alterar permissões do usuário ${PROTECTED_SUPER_ADMIN_EMAIL}`);
  }

  try {
    // Desativar todas as permissões individuais atuais (soft delete)
    await db
      .update(userFunctions)
      .set({ active: false, dtupdate: new Date().toISOString() })
      .where(eq(userFunctions.idUser, userId));

    // Se não há novas permissões, retornar
    if (functionIds.length === 0) {
      console.log(`[updateUserIndividualPermissions] Permissões individuais removidas do usuário ${userId}`);
      return { success: true };
    }

    // Verificar quais já existem (para reativar)
    const existing = await db
      .select()
      .from(userFunctions)
      .where(and(
        eq(userFunctions.idUser, userId),
        inArray(userFunctions.idFunctions, functionIds)
      ));

    const existingFunctionIds = existing.map(e => Number(e.idFunctions));
    const newFunctionIds = functionIds.filter(id => !existingFunctionIds.includes(id));

    // Reativar existentes
    if (existingFunctionIds.length > 0) {
      await db
        .update(userFunctions)
        .set({ active: true, dtupdate: new Date().toISOString() })
        .where(and(
          eq(userFunctions.idUser, userId),
          inArray(userFunctions.idFunctions, existingFunctionIds)
        ));
    }

    // Inserir novas
    if (newFunctionIds.length > 0) {
      const now = new Date().toISOString();
      const values = newFunctionIds.map(idFunction => ({
        slug: generateSlug(),
        idUser: userId,
        idFunctions: idFunction,
        active: true,
        dtinsert: now,
        dtupdate: now,
      }));

      await db.insert(userFunctions).values(values);
    }

    console.log(`[updateUserIndividualPermissions] ✅ Permissões individuais atualizadas para usuário ${userId}: ${functionIds.length} permissões`);
    
    revalidatePath(`/config/users/${userId}`);
    return { success: true };
  } catch (error) {
    console.error("[updateUserIndividualPermissions] Erro:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    };
  }
}

/**
 * Obtém TODAS as permissões de um usuário (categoria + individuais)
 * Retorna a união sem duplicatas
 */
export async function getUserAllPermissions(userId: number) {
  try {
    // Buscar usuário e sua categoria
    const user = await db
      .select({ idProfile: users.idProfile })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return { 
        categoryPermissions: [], 
        individualPermissions: [], 
        allPermissions: [],
        grouped: {} as Record<string, Array<{ id: number; name: string | null; group: string | null }>>
      };
    }

    const profileId = user[0].idProfile;

    // 1. Buscar permissões da categoria (profile_functions)
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

    // 2. Buscar permissões individuais (user_functions)
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
    const individualPermissions = indPerms.filter((p): p is { id: number; name: string | null; group: string | null } => p.id !== null);

    // 3. União (sem duplicatas)
    const allPermissionsMap = new Map<number, { id: number; name: string | null; group: string | null }>();
    
    categoryPermissions.forEach(p => {
      if (p.id) allPermissionsMap.set(p.id, p);
    });
    
    individualPermissions.forEach(p => {
      if (p.id) allPermissionsMap.set(p.id, p);
    });

    const allPermissions = Array.from(allPermissionsMap.values());

    // 4. Agrupar por grupo
    const grouped = allPermissions.reduce((acc, perm) => {
      const group = perm.group || "Outros";
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(perm);
      return acc;
    }, {} as Record<string, typeof allPermissions>);

    return {
      categoryPermissions,
      individualPermissions,
      allPermissions,
      grouped,
    };
  } catch (error) {
    console.error("[getUserAllPermissions] Erro:", error);
    return { 
      categoryPermissions: [], 
      individualPermissions: [], 
      allPermissions: [],
      grouped: {} as Record<string, Array<{ id: number; name: string | null; group: string | null }>>
    };
  }
}

// =====================================================
// HERANÇA DE ISOs (categoria + individuais)
// =====================================================

/**
 * Obtém TODOS os ISOs de um usuário (categoria + individuais)
 * Retorna a união sem duplicatas
 */
export async function getUserAllCustomers(userId: number) {
  try {
    // Buscar usuário e sua categoria
    const user = await db
      .select({ idProfile: users.idProfile })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return {
        categoryCustomers: [],
        individualCustomers: [],
        allCustomers: [],
      };
    }

    const profileId = user[0].idProfile;

    // 1. Buscar ISOs da categoria (profile_customers)
    let categoryCustomers: Array<{ id: number; name: string | null; slug: string | null }> = [];
    if (profileId) {
      try {
        const catCustomers = await db
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
        categoryCustomers = catCustomers.filter((c): c is { id: number; name: string | null; slug: string | null } => c.id !== null);
      } catch (error) {
        console.warn("[getUserAllCustomers] Tabela profile_customers pode não existir:", error);
      }
    }

    // 2. Buscar ISOs individuais (admin_customers)
    let individualCustomers: Array<{ id: number; name: string | null; slug: string | null }> = [];
    try {
      const indCustomers = await db
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
      individualCustomers = indCustomers.filter((c): c is { id: number; name: string | null; slug: string | null } => c.id !== null);
    } catch (error) {
      console.warn("[getUserAllCustomers] Erro ao buscar admin_customers:", error);
    }

    // 3. União (sem duplicatas)
    const allCustomersMap = new Map<number, { id: number; name: string | null; slug: string | null }>();
    
    categoryCustomers.forEach(c => {
      if (c.id) allCustomersMap.set(c.id, c);
    });
    
    individualCustomers.forEach(c => {
      if (c.id) allCustomersMap.set(c.id, c);
    });

    const allCustomers = Array.from(allCustomersMap.values());

    return {
      categoryCustomers,
      individualCustomers,
      allCustomers,
    };
  } catch (error) {
    console.error("[getUserAllCustomers] Erro:", error);
    return {
      categoryCustomers: [],
      individualCustomers: [],
      allCustomers: [],
    };
  }
}

// =====================================================
// CRIAR USUÁRIO PORTAL (NÃO-ISO)
// =====================================================

interface CreatePortalUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  idProfile: number;
  idCustomer?: number | null;
  fullAccess?: boolean;
  isoCommissionLinks?: Array<{ customerId: number; commissionType: string }>;
}

export async function createPortalUser(data: CreatePortalUserInput): Promise<{ userId: number }> {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo?.isSuperAdmin) {
    throw new Error("Apenas Super Admin pode criar usuários do portal");
  }

  const {
    firstName,
    lastName,
    email,
    password,
    idProfile,
    idCustomer,
    fullAccess = false,
    isoCommissionLinks = [],
  } = data;

  const normalizedEmail = email.trim().toLowerCase();

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw new Error("E-mail inválido");
  }

  // Verificar se email já existe
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("Este e-mail já está cadastrado no sistema");
  }

  // Gerar senha se não fornecida
  const finalPassword = password && password.trim() !== "" 
    ? password.trim() 
    : await generateRandomPassword();

  if (finalPassword.length < 8) {
    throw new Error("A senha deve ter pelo menos 8 caracteres");
  }

  const hashedPassword = hashPassword(finalPassword);
  const slug = generateSlug();
  const now = new Date().toISOString();

  // Criar usuário
  const created = await db
    .insert(users)
    .values({
      slug,
      dtinsert: now,
      dtupdate: now,
      active: true,
      email: normalizedEmail,
      idCustomer: idCustomer ?? null,
      idClerk: null,
      idProfile,
      idAddress: null,
      fullAccess,
      hashedPassword,
      initialPassword: finalPassword,
      userType: "USER",
    })
    .returning({ id: users.id });

  const userId = created[0].id;

  // Salvar firstName e lastName na tabela sales_agents
  try {
    await db.insert(salesAgents).values({
      slug: generateSlug(),
      active: true,
      dtinsert: now,
      dtupdate: now,
      firstName,
      lastName,
      email: normalizedEmail,
      idUsers: userId,
    });
  } catch (salesAgentError) {
    console.error("[createPortalUser] Erro ao salvar em sales_agents:", salesAgentError);
  }

  // Salvar vínculos ISO com tipo de comissão
  if (isoCommissionLinks.length > 0) {
    const { saveUserIsoCommissionLinks } = await import("@/features/customers/users/_actions/user-actions");
    await saveUserIsoCommissionLinks(userId, isoCommissionLinks);
  }

  // Enviar email de boas-vindas
  try {
    const { sendWelcomePasswordEmailPortal } = await import("@/lib/send-email");
    await sendWelcomePasswordEmailPortal(normalizedEmail, finalPassword, firstName);
  } catch (emailError) {
    console.error("[createPortalUser] Erro ao enviar email:", emailError);
  }

  revalidatePath("/config/users");
  return { userId };
}
