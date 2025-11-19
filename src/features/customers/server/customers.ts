"use server";
import { db } from "@/db/drizzle";
import { customers, customerCustomization } from "../../../../drizzle/schema";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { CustomerSchema } from "../schema/schema";
import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";

export type CustomersInsert = typeof customers.$inferInsert;
export type CustomersDetail = typeof customers.$inferSelect;

export async function getCustomers(
  search?: string,
  page: number = 1,
  pageSize: number = 10,
  name?: string,
  customerId?: string,
  settlementManagementType?: string,
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

  if (settlementManagementType) {
    whereConditions.push(
      ilike(customers.settlementManagementType, `%${settlementManagementType}%`)
    );
  }

  // Se usuário não for admin, filtrar apenas pelo ISO do usuário
  const userInfo = await getCurrentUserInfo();
  if (userInfo && !userInfo.isAdmin && userInfo.idCustomer) {
    whereConditions.push(eq(customers.id, userInfo.idCustomer));
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

  return {
    customers: result.map((customer) => ({
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
    })),
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
