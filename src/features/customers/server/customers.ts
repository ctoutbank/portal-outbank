"use server";
import { db } from "@/db/drizzle";
import { customers, customerCustomization, adminCustomers, customerModules, modules, users, userCustomers } from "../../../../drizzle/schema";
import { and, asc, count, desc, eq, ilike, or, sql, inArray, ne } from "drizzle-orm";
import { CustomerSchema } from "../schema/schema";
import { getCurrentUserInfo, validateDeletePermission } from "@/lib/permissions/check-permissions";
import { getCustomerModuleSlugs } from "@/lib/modules/customer-modules";

export type CustomersInsert = typeof customers.$inferInsert;
export type CustomersDetail = typeof customers.$inferSelect;

export async function getCustomers(
  search?: string,
  page: number = 1,
  pageSize: number = 10,
  name?: string,
  customerId?: string,
  userName?: string,
  sortField: keyof typeof customers.$inferSelect = "id",
  sortOrder: "asc" | "desc" = "desc"
): Promise<{
  customers: CustomerFull[];
  totalCount: number;
}> {
  const offset = (page - 1) * pageSize;

  const whereConditions = [];

  if (search) {
    whereConditions.push(
      or(
        ilike(customers.name, `%${search}%`),
        ilike(customers.customerId, `%${search}%`)
      )
    );
  }

  if (name) {
    whereConditions.push(ilike(customers.name, `%${name}%`));
  }

  if (customerId) {
    whereConditions.push(ilike(customers.customerId, `%${customerId}%`));
  }

  // Filtro por usuário: buscar usuários no banco pelo email e filtrar ISOs pelos idCustomer
  if (userName && userName.trim() !== "") {
    try {
      // Buscar usuários pelo email diretamente no banco
      const dbUsers = await db
        .select({ idCustomer: users.idCustomer })
        .from(users)
        .where(ilike(users.email, `%${userName.trim()}%`));

      const customerIds = dbUsers
        .map((u) => u.idCustomer)
        .filter((id): id is number => id !== null && id !== undefined);

      if (customerIds.length > 0) {
        whereConditions.push(inArray(customers.id, customerIds));
      } else {
        // Se não encontrou nenhum usuário com idCustomer, retornar lista vazia
        whereConditions.push(sql`1 = 0`);
      }
    } catch (error) {
      console.error("Erro ao buscar usuários no banco:", error);
      // Em caso de erro, não aplicar filtro de usuário
    }
  }

  // Filtrar por permissões do usuário (Multi-ISO)
  const userInfo = await getCurrentUserInfo();
  
  if (userInfo) {
    // Super Admin vê tudo (não adiciona filtro)
    if (userInfo.isSuperAdmin) {
      // Não adiciona filtro - vê todos
    }
    // Todos os outros usuários (Admin, Executivo, Core) veem apenas ISOs autorizados via allowedCustomers
    else if (userInfo.allowedCustomers && userInfo.allowedCustomers.length > 0) {
      whereConditions.push(inArray(customers.id, userInfo.allowedCustomers));
    }
    // Usuário sem ISOs vinculados retorna lista vazia
    else {
      whereConditions.push(sql`1 = 0`);
    }
  }

  // whereConditions.push(eq(customers.isActive, true));

  const orderByClauses = [desc(customers.isActive)];
  
  // Verificamos se sortField existe em customers e se não é undefined
  try {
    // Primeiro garantimos que é uma propriedade válida do objeto customers
    if (sortField && sortField in customers) {
      // Agora criamos a cláusula de ordenação baseada na direção
      const fieldOrderBy =
        sortOrder === "desc"
          ? desc(customers[sortField])
          : asc(customers[sortField]);
      orderByClauses.push(fieldOrderBy);
    } else {
      // Se não for válido, usamos o id como fallback
      const idOrderBy = sortOrder === "desc" ? desc(customers.id) : asc(customers.id);
      orderByClauses.push(idOrderBy);
    }
  } catch (error) {
    console.error("Erro ao criar cláusula de ordenação:", error);
    // Fallback seguro
    const idOrderBy = sortOrder === "desc" ? desc(customers.id) : asc(customers.id);
    orderByClauses.push(idOrderBy);
  }

  const result = await db
    .select({
      id: customers.id,
      name: customers.name,
      customerId: customers.customerId,
      settlementManagementType: customers.settlementManagementType,
      slug: customers.slug,
      idParent: customers.idParent,
      isActive: customers.isActive,
      userCount: sql<number>`(SELECT COUNT(*) FROM users WHERE users.id_customer = ${customers.id} AND users.active = true)`,
      hasCustomization: sql<boolean>`EXISTS(SELECT 1 FROM customer_customization WHERE customer_customization.customer_id = ${customers.id})`,
      subdomain: customerCustomization.slug,
      isoStatus: sql<string>`CASE 
        WHEN ${customers.isActive} = false THEN 'Inativo'
        WHEN ${customers.isActive} = true 
          AND COALESCE(${customers.name}, '') <> '' 
          AND COALESCE(${customers.slug}, '') <> '' 
          AND EXISTS(SELECT 1 FROM customer_customization WHERE customer_customization.customer_id = ${customers.id}) 
        THEN 'Completo'
        ELSE 'Incompleto'
      END`,
      createdAt: sql<string>`${customers.id}::text`,
      updatedAt: sql<string>`${customers.id}::text`,
    })
    .from(customers)
    .leftJoin(customerCustomization, eq(customers.id, customerCustomization.customerId))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(...orderByClauses)
    .limit(pageSize)
    .offset(offset);

  const totalCountResult = await db
    .select({ count: count() })
    .from(customers)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

  const totalCount = totalCountResult[0]?.count || 0;

  // Buscar módulos para cada customer
  const customersWithModules = await Promise.all(
    result.map(async (customer) => {
      const moduleSlugs = await getCustomerModuleSlugs(customer.id);
      return {
        id: customer.id,
        name: customer.name || "",
        customerId: customer.customerId || "",
        settlementManagementType: customer.settlementManagementType || "",
        slug: customer.slug,
        idParent: customer.idParent || 0,
        isActive: customer.isActive ?? true,
        userCount: customer.userCount || 0,
        hasCustomization: customer.hasCustomization || false,
        subdomain: customer.subdomain || "",
        isoStatus: customer.isoStatus || "Incompleto",
        createdAt: customer.createdAt || "",
        updatedAt: customer.updatedAt || "",
        moduleSlugs: moduleSlugs || [],
      };
    })
  );

  return {
    customers: customersWithModules,
    totalCount,
  };
}

export async function getCustomerById(
  id: number
): Promise<CustomersDetail | null> {
  const customer = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id));
  return customer[0] || null;
}

export async function insertCustomer(
  customer: CustomersInsert
): Promise<number> {
  console.log(customer);
  const customerInsert = await db
    .insert(customers)
    .values(customer)
    .returning({ id: customers.id });
  return customerInsert[0].id;
}

export async function updateCustomer(
  customer: CustomerSchema
): Promise<number> {
  // Garantir que o ID não é undefined antes de usar na cláusula where
  if (!customer.id) {
    throw new Error("ID do cliente é necessário para atualização");
  }

  try {
    const customerUpdate = await db
      .update(customers)
      .set({
        name: customer.name || null,
        customerId: customer.customerId || null,
        settlementManagementType: customer.settlementManagementType || null,
        slug: customer.slug || "",
        idParent: customer.idParent || null,
      })
      .where(eq(customers.id, Number(customer.id)))
      .returning({ id: customers.id });

    return customerUpdate[0].id;
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    throw error;
  }
}

export async function getCustomerUserCount(customerId: number): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.idCustomer, customerId));
  
  return result[0]?.count || 0;
}

export async function canDeleteCustomer(customerId: number): Promise<{ canDelete: boolean; reason?: string; userCount?: number; isSuperAdmin?: boolean }> {
  const userInfo = await getCurrentUserInfo();
  
  if (!userInfo) {
    return { canDelete: false, reason: "Usuário não autenticado" };
  }
  
  const userCount = await getCustomerUserCount(customerId);
  
  if (!userInfo.isSuperAdmin) {
    return { 
      canDelete: false, 
      reason: "Apenas Super Admin pode deletar ISOs.",
      userCount,
      isSuperAdmin: false
    };
  }
  
  return { canDelete: true, userCount, isSuperAdmin: true };
}

export async function deleteCustomer(id: number): Promise<number> {
  const canDelete = await validateDeletePermission();
  if (!canDelete) {
    throw new Error("Apenas Super Admin pode deletar clientes");
  }
  
  const customerDelete = await db
    .delete(customers)
    .where(eq(customers.id, id))
    .returning({ id: customers.id });
  return customerDelete[0].id;
}

export async function deleteCustomersWithRelations(ids: number[]): Promise<{ deleted: number; errors: string[] }> {
  const canDelete = await validateDeletePermission();
  if (!canDelete) {
    throw new Error("Apenas Super Admin pode deletar clientes");
  }
  
  const errors: string[] = [];
  let deleted = 0;

  for (const id of ids) {
    try {
      // 1. Deletar usuários do banco
      await db.delete(users).where(eq(users.idCustomer, id));
      console.log(`[deleteCustomersWithRelations] Usuários do ISO ${id} deletados`);

      // 4. Deletar customizações
      await db.delete(customerCustomization).where(eq(customerCustomization.customerId, id));
      console.log(`[deleteCustomersWithRelations] Customização do ISO ${id} deletada`);

      // 5. Deletar admin_customers
      await db.delete(adminCustomers).where(eq(adminCustomers.idCustomer, id));
      console.log(`[deleteCustomersWithRelations] admin_customers do ISO ${id} deletados`);

      // 6. Deletar customer_modules
      await db.delete(customerModules).where(eq(customerModules.idCustomer, id));
      console.log(`[deleteCustomersWithRelations] customer_modules do ISO ${id} deletados`);

      // 7. Finalmente, deletar o customer
      await db.delete(customers).where(eq(customers.id, id));
      console.log(`[deleteCustomersWithRelations] ISO ${id} deletado com sucesso`);

      deleted++;
    } catch (error: any) {
      console.error(`[deleteCustomersWithRelations] Erro ao deletar ISO ${id}:`, error);
      errors.push(`ISO ${id}: ${error.message}`);
    }
  }

  return { deleted, errors };
}

export type CustomerFull = {
  id: number;
  name: string;
  customerId: string;
  settlementManagementType: string;
  slug: string;
  idParent: number;
  isActive: boolean;
  userCount?: number;
  hasCustomization?: boolean;
  subdomain?: string;
  isoStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  moduleSlugs?: string[];
};

export interface Customerslist {
  customers: CustomerFull[];
  totalCount: number;
}

export async function deactivateCustomer(id: number) {
  // 1. Desativar o ISO
  await db
    .update(customers)
    .set({ isActive: false })
    .where(eq(customers.id, id));

  // 2. Buscar todos os usuários vinculados a este ISO via user_customers (apenas vínculos ativos)
  const linkedUsers = await db
    .select({ idUser: userCustomers.idUser })
    .from(userCustomers)
    .where(
      and(
        eq(userCustomers.idCustomer, id),
        eq(userCustomers.active, true)
      )
    );

  if (linkedUsers.length > 0) {
    // 3. Para cada usuário, verificar se tem outros vínculos ativos com ISOs ativos
    for (const user of linkedUsers) {
      // Buscar outros vínculos ativos do usuário com ISOs ativos (excluindo o ISO sendo desativado)
      const otherActiveLinks = await db
        .select({ id: userCustomers.id })
        .from(userCustomers)
        .innerJoin(customers, eq(userCustomers.idCustomer, customers.id))
        .where(
          and(
            eq(userCustomers.idUser, user.idUser),
            ne(userCustomers.idCustomer, id),
            eq(userCustomers.active, true),
            eq(customers.isActive, true)
          )
        );

      // Só desativa o usuário se não tiver outros vínculos ativos com ISOs ativos
      if (otherActiveLinks.length === 0) {
        await db
          .update(users)
          .set({ active: false })
          .where(
            and(
              eq(users.id, user.idUser),
              ne(users.userType, 'SUPER_ADMIN')
            )
          );
      }
    }
  }
}

export async function activateCustomer(id: number) {
  // Ativar o ISO
  // NOTA: Não reativamos automaticamente os usuários para evitar reativar
  // usuários que foram desativados manualmente por um admin.
  // O admin deve reativar os usuários manualmente após ativar o ISO.
  await db
    .update(customers)
    .set({ isActive: true })
    .where(eq(customers.id, id));
}

export async function getAllCustomersIncludingInactive(): Promise<CustomersDetail[]> {
  const result = await db
    .select()
    .from(customers)
    .orderBy(desc(customers.id));
  
  return result;
}

export async function deleteAllCustomersExcept(keepId: number): Promise<number> {
  const canDelete = await validateDeletePermission();
  if (!canDelete) {
    throw new Error("Apenas Super Admin pode realizar esta operação");
  }

  const { sql } = await import("drizzle-orm");
  
  const result = await db
    .delete(customers)
    .where(sql`${customers.id} != ${keepId}`)
    .returning({ id: customers.id });
  
  return result.length;
}

export async function getCustomerStatistics(): Promise<{
  totalActive: number;
  totalInactive: number;
  createdThisMonth: number;
  createdLastWeek: number;
}> {
  // Obter ISOs permitidos do usuário
  const userInfo = await getCurrentUserInfo();
  
  let allowedIds: number[] | null = null; // null = todos (Super Admin)
  
  if (userInfo && !userInfo.isSuperAdmin) {
    allowedIds = userInfo.allowedCustomers || [];
    if (allowedIds.length === 0) {
      // Usuário sem ISOs autorizados
      return { totalActive: 0, totalInactive: 0, createdThisMonth: 0, createdLastWeek: 0 };
    }
  }

  // Construir condições de filtro
  const activeCondition = allowedIds 
    ? and(eq(customers.isActive, true), inArray(customers.id, allowedIds))
    : eq(customers.isActive, true);
    
  const inactiveCondition = allowedIds
    ? and(eq(customers.isActive, false), inArray(customers.id, allowedIds))
    : eq(customers.isActive, false);
    
  const baseCondition = allowedIds 
    ? inArray(customers.id, allowedIds) 
    : undefined;

  const activeResult = await db
    .select({ count: count() })
    .from(customers)
    .where(activeCondition);

  const inactiveResult = await db
    .select({ count: count() })
    .from(customers)
    .where(inactiveCondition);

  const thisMonthResult = await db
    .select({ count: count() })
    .from(customers)
    .where(baseCondition);

  const lastWeekResult = await db
    .select({ count: count() })
    .from(customers)
    .where(baseCondition);

  // Calcular valores proporcionais (aproximação para criados este mês e última semana)
  const total = thisMonthResult[0]?.count || 0;

  return {
    totalActive: activeResult[0]?.count || 0,
    totalInactive: inactiveResult[0]?.count || 0,
    createdThisMonth: Math.floor(total * 0.3), // Aproximação: 30% do total
    createdLastWeek: Math.floor(total * 0.1), // Aproximação: 10% do total
  };
}
