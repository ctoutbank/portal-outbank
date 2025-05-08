"use server";
import { db } from "@/db/drizzle";
import { CustomerSchema } from "../schema/schema";
import { CustomersInsert } from "../server/customers";
import { eq, sql } from "drizzle-orm";
import { customers } from "../../../../drizzle/schema";


export async function insertCustomerFormAction(data: CustomerSchema) {
    try {
        const idParent = await db.select({ id: customers.id })
            .from(customers)
            .where(
                sql`${customers.name} = 'outbank' AND ${customers.id} = 4`
            )
            .then(result => result[0]?.id || null);

        const customerInsert: CustomersInsert = {
            slug: data.slug || "",
            name: data.name,
            customerId: data.customerId || null,
            settlementManagementType: data.settlementManagementType || null,
            idParent: idParent,
        }

        const result = await db.insert(customers).values(customerInsert).returning({ id: customers.id });
        
        return result[0]?.id || null;
    } catch (error) {
        console.error("Erro ao inserir cliente:", error);
        throw error;
    }
}

export async function updateCustomerFormAction(data: CustomerSchema) {
    if (!data.id) {
        throw new Error("Id is required");
    }

    try {
        const customerUpdate = await db.update(customers)
            .set({
                name: data.name || null,
                customerId: data.customerId || null,
                settlementManagementType: data.settlementManagementType || null,
                slug: data.slug || "",
                idParent: data.idParent || null
            })
            .where(eq(customers.id, Number(data.id)))
            .returning({ id: customers.id });
            
        return customerUpdate[0].id;
    } catch (error) {
        console.error("Erro ao atualizar cliente:", error);
        throw error;
    }
}

