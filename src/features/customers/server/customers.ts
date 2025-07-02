"use server";
import { db } from "@/db/drizzle";
import { customers } from "../../../../drizzle/schema";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { CustomerSchema } from "../schema/schema";

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

  // Verificamos se sortField existe em customers e se não é undefined
  let orderByClause;
  try {
    // Primeiro garantimos que é uma propriedade válida do objeto customers
    if (sortField && sortField in customers) {
      // Agora criamos a cláusula de ordenação baseada na direção
      orderByClause =
        sortOrder === "desc"
          ? desc(customers[sortField])
          : customers[sortField];
    } else {
      // Se não for válido, usamos o id como fallback
      orderByClause = sortOrder === "desc" ? desc(customers.id) : customers.id;
    }
  } catch (error) {
    console.error("Erro ao criar cláusula de ordenação:", error);
    // Fallback seguro
    orderByClause = sortOrder === "desc" ? desc(customers.id) : customers.id;
  }

  const result = await db
    .select()
    .from(customers)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(orderByClause)
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
