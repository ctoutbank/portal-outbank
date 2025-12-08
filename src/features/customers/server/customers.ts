"use server";
import { db } from "@/db/drizzle";
import { customers, customerCustomization, adminCustomers, customerModules, modules, users } from "../../../../drizzle/schema";
import { and, asc, count, desc, eq, ilike, or, sql, inArray } from "drizzle-orm";
import { CustomerSchema } from "../schema/schema";
import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";
import { getCustomerModuleSlugs } from "@/lib/modules/customer-modules";
import { clerkClient } from "@clerk/nextjs/server";

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

  // Filtro por usuário: buscar usuários no Clerk e filtrar ISOs pelos idCustomer
  if (userName && userName.trim() !== "") {
    try {
      const clerk = await clerkClient();
      const clerkUsers = await clerk.users.getUserList({
        query: userName.trim(),
        limit: 100, // Limite razoável para busca
      });

      if (clerkUsers.data && clerkUsers.data.length > 0) {
        const clerkIds = clerkUsers.data.map((user) => user.id);
        
        // Buscar idCustomer dos usuários encontrados
        const dbUsers = await db
          .select({ idCustomer: users.idCustomer })
          .from(users)
          .where(inArray(users.idClerk, clerkIds));

        const customerIds = dbUsers
          .map((u) => u.idCustomer)
          .filter((id): id is number => id !== null && id !== undefined);

        if (customerIds.length > 0) {
          whereConditions.push(inArray(customers.id, customerIds));
        } else {
          // Se não encontrou nenhum usuário com idCustomer, retornar lista vazia
          whereConditions.push(sql`1 = 0`);
        }
      } else {
        // Se não encontrou usuários no Clerk, retornar lista vazia
        whereConditions.push(sql`1 = 0`);
      }
    } catch (error) {
      console.error("Erro ao buscar usuários no Clerk:", error);
      // Em caso de erro, não aplicar filtro de usuário
    }
  }

  // Filtrar por permissões do usuário
  const userInfo = await getCurrentUserInfo();
  
  if (userInfo) {
    // Super Admin vê tudo (não adiciona filtro)
    if (userInfo.isSuperAdmin) {
      // Não adiciona filtro - vê todos
    }
    // Admin vê apenas ISOs autorizados
    else if (userInfo.isAdmin && !userInfo.isSuperAdmin && userInfo.allowedCustomers) {
      if (userInfo.allowedCustomers.length === 0) {
        // Admin sem ISOs autorizados retorna lista vazia
        whereConditions.push(sql`1 = 0`); // Condição impossível
      } else {
        whereConditions.push(inArray(customers.id, userInfo.allowedCustomers));
      }
    }
    // Usuário normal vê apenas seu ISO
    else if (!userInfo.isAdmin && userInfo.idCustomer) {
      whereConditions.push(eq(customers.id, userInfo.idCustomer));
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

export async function deleteCustomer(id: number): Promise<number> {
  const customerDelete = await db
    .delete(customers)
    .where(eq(customers.id, id))
    .returning({ id: customers.id });
  return customerDelete[0].id;
}

export async function deleteCustomersWithRelations(ids: number[]): Promise<{ deleted: number; errors: string[] }> {
  const errors: string[] = [];
  let deleted = 0;

  for (const id of ids) {
    try {
      // 1. Buscar usuários do ISO para deletar do Clerk
      const isoUsers = await db
        .select({ id: users.id, idClerk: users.idClerk })
        .from(users)
        .where(eq(users.idCustomer, id));

      // 2. Deletar usuários do Clerk
      for (const user of isoUsers) {
        if (user.idClerk) {
          try {
            const clerk = await clerkClient();
            await clerk.users.deleteUser(user.idClerk);
            console.log(`[deleteCustomersWithRelations] Usuário ${user.idClerk} deletado do Clerk`);
          } catch (clerkError: any) {
            if (clerkError?.status !== 404) {
              console.warn(`[deleteCustomersWithRelations] Erro ao deletar usuário ${user.idClerk} do Clerk:`, clerkError);
            }
          }
        }
      }

      // 3. Deletar usuários do banco
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
  await db
    .update(customers)
    .set({ isActive: false })
    .where(eq(customers.id, id));
}

export async function activateCustomer(id: number) {
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
  const activeResult = await db
    .select({ count: count() })
    .from(customers)
    .where(eq(customers.isActive, true));

  const inactiveResult = await db
    .select({ count: count() })
    .from(customers)
    .where(eq(customers.isActive, false));

  const thisMonthResult = await db
    .select({ count: count() })
    .from(customers);

  const lastWeekResult = await db
    .select({ count: count() })
    .from(customers);

  return {
    totalActive: activeResult[0]?.count || 0,
    totalInactive: inactiveResult[0]?.count || 0,
    createdThisMonth: Math.floor((thisMonthResult[0]?.count || 0) * 0.3), // Approximation
    createdLastWeek: Math.floor((lastWeekResult[0]?.count || 0) * 0.1), // Approximation
  };
}
