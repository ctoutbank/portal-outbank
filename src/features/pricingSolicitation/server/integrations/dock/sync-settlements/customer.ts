"use server";

import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { customers } from "../../../../../drizzle/schema";
import { getIdBySlugs } from "./getIdBySlugs";
import { Customer } from "./types";

async function insertCustomer(
  customer: Customer[],
): Promise<{ id: number; slug: string | null }[] | null> {
  try {
    const uniqueCustomers = Array.from(
      new Map(customer.map((item) => [item.slug, item])).values()
    );
    let countChecked = 0;
    let countCreated = 0;
    const results: { id: number; slug: string | null }[] = [];

    for (const customerItem of uniqueCustomers) {
      const checkDB = await db
        .select({ id: customers.id, slug: customers.slug })
        .from(customers)
        .where(eq(customers.slug, customerItem.slug));

      if (checkDB && checkDB.length > 0) {
        countChecked = countChecked + 1;
        results.push(checkDB[0]);
      } else {
        countCreated = countCreated + 1;
        const inserted = await db
          .insert(customers)
          .values(customerItem)
          .returning({ id: customers.id, slug: customers.slug });
        if (inserted && inserted[0]) results.push(inserted[0]);
      }
    }

    return results;
  } catch (error) {
    console.error("Error inserting customer:", error);
    return null;
  }
}

export async function getOrCreateCustomer(
  customer: Customer[]
) {
  try {
    const slugs = customer.map((customer) => customer.slug);

    const customerIds = await getIdBySlugs("customers", slugs);
    const filteredList = customer.filter(
      (customer) =>
        !customerIds?.some(
          (existingCustomer) => existingCustomer.slug === customer.slug
        )
    );
    if (filteredList.length > 0) {
      const insertedIds = await insertCustomer(filteredList);
      const nonNullInsertedIds =
        insertedIds
          ?.filter((id) => id.slug !== null)
          .map((id) => ({ id: id.id, slug: id.slug as string })) ?? [];
      return (
        customerIds?.concat(nonNullInsertedIds ?? []) || nonNullInsertedIds
      );
    } else {
      return customerIds;
    }
  } catch (error) {
    console.error("Error getting or creating customer:", error);
  }
}
