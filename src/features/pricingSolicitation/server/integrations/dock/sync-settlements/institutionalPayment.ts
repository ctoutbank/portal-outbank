"use server";

import { db } from "@/server/db";
import { sql, eq } from "drizzle-orm";
import { PaymentInstitution } from "./types";
import { paymentInstitution } from "../../../../../drizzle/schema";

async function insertPaymentInstitution(
  paymentInstitutions: PaymentInstitution,
  customerId: number
) {
  try {
    const existing = await db
      .select()
      .from(paymentInstitution)
      .where(eq(paymentInstitution.slug, paymentInstitutions.slug));

    if (existing.length > 0) {
      console.log(
        "PaymentInstitution with this slug already exists. Skipping insert."
      );
      return; // Não realiza o insert
    }

    await db.insert(paymentInstitution).values({
      slug: paymentInstitutions.slug,
      name: paymentInstitutions.name,
      idCustomer: paymentInstitutions.customerId,
      settlementManagementType: paymentInstitutions.settlementManagementType,
      idCustomerDb: customerId,
    });
  } catch (error) {
    console.error("Error inserting paymentInstitution:", error);
  }
}

export async function getOrCreatePaymentInstitution(
  paymentInstitutions: PaymentInstitution,
  customerId: number
) {
  try {
    const result = await db
      .select({ slug: paymentInstitution.slug })
      .from(paymentInstitution)
      .where(sql`${paymentInstitution.slug} = ${paymentInstitutions.slug}`);
    if (result.length > 0) {
      return result[0].slug;
    } else {
      await insertPaymentInstitution(paymentInstitutions, customerId);
      return paymentInstitutions.slug;
    }
  } catch (error) {
    console.error("Error getting or creating paymentInstitution:", error);
  }
}
