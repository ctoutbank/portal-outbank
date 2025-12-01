"use server";

import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { merchants, addresses, categories, legalNatures, configurations, customers, users } from "../../../../drizzle/schema";
import { currentUser } from "@clerk/nextjs/server";
import { generateSlug } from "@/lib/utils";

// Types
export type MerchantInsert = typeof merchants.$inferInsert;
export type MerchantDetail = typeof merchants.$inferSelect;
export type AddressInsert = typeof addresses.$inferInsert;
export type AddressDetail = typeof addresses.$inferSelect;

// Helper function to get slug by ID
export async function getSlugById(
  table: typeof legalNatures | typeof categories | typeof configurations,
  id: number
): Promise<string | null> {
  try {
    const result = await db
      .select({ slug: table.slug })
      .from(table)
      .where(eq(table.id, id))
      .limit(1);

    return result[0]?.slug || null;
  } catch (error) {
    console.error(`Erro ao buscar slug para id ${id}:`, error);
    return null;
  }
}

// Get current user customer slug
export async function getCurrentUserCustomerSlug(): Promise<string | null> {
  try {
    const userClerk = await currentUser();

    if (!userClerk) {
      throw new Error("Usuário não autenticado");
    }

    const result = await db
      .select({
        customerSlug: customers.slug,
      })
      .from(users)
      .innerJoin(customers, eq(users.idCustomer, customers.id))
      .where(eq(users.idClerk, userClerk.id))
      .limit(1);

    return result.length > 0 ? result[0].customerSlug : null;
  } catch (error) {
    console.error("Erro ao buscar slug do customer:", error);
    throw error;
  }
}

// Get current user customer ID
export async function getCurrentUserCustomerId(): Promise<number | null> {
  try {
    const userClerk = await currentUser();

    if (!userClerk) {
      throw new Error("Usuário não autenticado");
    }

    const result = await db
      .select({
        customerId: customers.id,
      })
      .from(users)
      .innerJoin(customers, eq(users.idCustomer, customers.id))
      .where(eq(users.idClerk, userClerk.id))
      .limit(1);

    return result.length > 0 ? result[0].customerId : null;
  } catch (error) {
    console.error("Erro ao buscar id do customer:", error);
    throw error;
  }
}

// Insert merchant
export async function insertMerchant(
  merchant: MerchantInsert
): Promise<number> {
  const result = await db
    .insert(merchants)
    .values({
      slug: merchant.slug || generateSlug(),
      name: merchant.name,
      active: merchant.active ?? true,
      dtinsert: new Date().toISOString(),
      dtupdate: new Date().toISOString(),
      idMerchant: merchant.idMerchant || "",
      idDocument: merchant.idDocument || "",
      corporateName: merchant.corporateName || "",
      email: merchant.email || "",
      areaCode: merchant.areaCode || "",
      number: merchant.number || "",
      phoneType: merchant.phoneType || "",
      language: merchant.language || "",
      timezone: merchant.timezone || "",
      slugCustomer: merchant.slugCustomer || "",
      riskAnalysisStatus: merchant.riskAnalysisStatus || "",
      riskAnalysisStatusJustification: merchant.riskAnalysisStatusJustification || "",
      legalPerson: merchant.legalPerson || "",
      openingDate: merchant.openingDate || null,
      inclusion: merchant.inclusion || "",
      openingDays: merchant.openingDays || "",
      openingHour: merchant.openingHour || null,
      closingHour: merchant.closingHour || null,
      municipalRegistration: merchant.municipalRegistration || "",
      stateSubcription: merchant.stateSubcription || "",
      hasTef: merchant.hasTef ?? false,
      hasPix: merchant.hasPix ?? false,
      hasTop: merchant.hasTop ?? false,
      establishmentFormat: merchant.establishmentFormat || "",
      revenue: merchant.revenue || "0",
      idCategory: merchant.idCategory || null,
      slugCategory: merchant.slugCategory || "",
      idConfiguration: merchant.idConfiguration || null,
      slugConfiguration: merchant.slugConfiguration || "",
      idAddress: merchant.idAddress || null,
      idLegalNature: merchant.idLegalNature || null,
      slugLegalNature: merchant.slugLegalNature || "",
      idSalesAgent: merchant.idSalesAgent || null,
      slugSalesAgent: merchant.slugSalesAgent || "",
      idMerchantBankAccount: merchant.idMerchantBankAccount || null,
      idCustomer: merchant.idCustomer || null,
      idMerchantPrice: merchant.idMerchantPrice || null,
    })
    .returning({ id: merchants.id });

  return result[0].id;
}

// Update merchant
export async function updateMerchant(merchant: MerchantDetail): Promise<void> {
  await db
    .update(merchants)
    .set({
      slug: merchant.slug,
      name: merchant.name,
      active: merchant.active,
      dtupdate: new Date().toISOString(),
      idMerchant: merchant.idMerchant || "",
      idDocument: merchant.idDocument || "",
      corporateName: merchant.corporateName || "",
      email: merchant.email || "",
      areaCode: merchant.areaCode || "",
      number: merchant.number || "",
      phoneType: merchant.phoneType || "",
      language: merchant.language || "",
      timezone: merchant.timezone || "",
      slugCustomer: merchant.slugCustomer || "",
      riskAnalysisStatus: merchant.riskAnalysisStatus || "",
      riskAnalysisStatusJustification: merchant.riskAnalysisStatusJustification || "",
      legalPerson: merchant.legalPerson || "",
      openingDate: merchant.openingDate || null,
      inclusion: merchant.inclusion || "",
      openingDays: merchant.openingDays || "",
      openingHour: merchant.openingHour || null,
      closingHour: merchant.closingHour || null,
      municipalRegistration: merchant.municipalRegistration || "",
      stateSubcription: merchant.stateSubcription || "",
      hasTef: merchant.hasTef ?? false,
      hasPix: merchant.hasPix ?? false,
      hasTop: merchant.hasTop ?? false,
      establishmentFormat: merchant.establishmentFormat || "",
      revenue: merchant.revenue || "0",
      idCategory: merchant.idCategory || null,
      slugCategory: merchant.slugCategory || "",
      idConfiguration: merchant.idConfiguration || null,
      slugConfiguration: merchant.slugConfiguration || "",
      idAddress: merchant.idAddress || null,
      idLegalNature: merchant.idLegalNature || null,
      slugLegalNature: merchant.slugLegalNature || "",
      idSalesAgent: merchant.idSalesAgent || null,
      slugSalesAgent: merchant.slugSalesAgent || "",
    })
    .where(eq(merchants.id, merchant.id));
}

// Insert address
export async function insertAddress(address: AddressInsert): Promise<number> {
  // Verifica se o endereço já existe
  const existingAddress = await db
    .select({ id: addresses.id })
    .from(addresses)
    .where(
      and(
        eq(addresses.streetAddress, address.streetAddress ?? ""),
        eq(addresses.streetNumber, address.streetNumber ?? ""),
        eq(addresses.neighborhood, address.neighborhood ?? ""),
        eq(addresses.city, address.city ?? ""),
        eq(addresses.state, address.state ?? ""),
        eq(addresses.zipCode, address.zipCode ?? "")
      )
    )
    .limit(1);

  // Se encontrar um endereço existente, retorna o ID dele
  if (existingAddress.length > 0) {
    return existingAddress[0].id;
  }

  // Se não encontrar, insere novo endereço
  const result = await db
    .insert(addresses)
    .values(address)
    .returning({ id: addresses.id });

  return result[0].id;
}

// Update address
export async function updateAddress(address: AddressDetail): Promise<void> {
  await db
    .update(addresses)
    .set(address)
    .where(eq(addresses.id, address.id));
}


