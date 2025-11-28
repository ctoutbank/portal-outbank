"use server";

import { db } from "@/lib/db";
import { categories, legalNatures, salesAgents, customers, establishmentFormat, accountType, bank } from "../../../../drizzle/schema";
import { eq, asc } from "drizzle-orm";
import { UserMerchantsAccess } from "./merchants";

export type CnaeMccDropdown = {
  value: string;
  label: string;
  cnae: string;
  mcc: string;
};

export type LegalNatureDropdown = {
  value: number;
  label: string;
};

export type SalesAgentDropdown = {
  value: number;
  label: string;
};

export type EstablishmentFormatDropdown = {
  value: string;
  label: string;
};

/**
 * Busca CNAE/MCC para dropdown
 * Replicado do Outbank-One
 */
export async function getCnaeMccForDropdown(): Promise<CnaeMccDropdown[]> {
  try {
    const result = await db
      .select({
        value: categories.id,
        label: categories.name,
        cnae: categories.cnae,
        mcc: categories.mcc,
      })
      .from(categories)
      .orderBy(asc(categories.cnae));

    if (!result) return [];

    return result.map((item) => ({
      value: item.value.toString(),
      label: `${item.cnae} - ${item.label}`,
      cnae: item.cnae || "",
      mcc: item.mcc || "",
    }));
  } catch (error) {
    console.error("Error fetching CNAE/MCC:", error);
    return [];
  }
}

/**
 * Busca naturezas jurídicas para dropdown
 * Replicado do Outbank-One
 */
export async function getLegalNaturesForDropdown(): Promise<LegalNatureDropdown[]> {
  try {
    const result = await db
      .select({
        value: legalNatures.id,
        label: legalNatures.name,
      })
      .from(legalNatures)
      .orderBy(asc(legalNatures.id));

    return result.map((item) => ({
      value: item.value,
      label: item.label ?? "",
    }));
  } catch (error) {
    console.error("Error fetching legal natures:", error);
    return [];
  }
}

/**
 * Busca consultores comerciais para dropdown
 * Replicado do Outbank-One, adaptado para Portal-Outbank
 */
export async function getSalesAgentForDropdown(
  userAccess: UserMerchantsAccess
): Promise<SalesAgentDropdown[]> {
  try {
    // Se tem fullAccess, buscar todos os sales agents dos allowedCustomers
    if (userAccess.fullAccess && userAccess.allowedCustomers.length > 0) {
      const result = await db
        .select({
          value: salesAgents.id,
          label: salesAgents.firstName,
        })
        .from(salesAgents)
        .innerJoin(customers, eq(salesAgents.slugCustomer, customers.slug))
        .where(eq(customers.id, userAccess.allowedCustomers[0])) // Usar o primeiro allowedCustomer
        .orderBy(asc(salesAgents.id));

      return result.map((item) => ({
        value: item.value,
        label: item.label ?? "",
      }));
    }

    // Se não tem fullAccess mas tem idCustomer, buscar desse customer
    if (userAccess.idCustomer) {
      const result = await db
        .select({
          value: salesAgents.id,
          label: salesAgents.firstName,
        })
        .from(salesAgents)
        .innerJoin(customers, eq(salesAgents.slugCustomer, customers.slug))
        .where(eq(customers.id, userAccess.idCustomer))
        .orderBy(asc(salesAgents.id));

      return result.map((item) => ({
        value: item.value,
        label: item.label ?? "",
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching sales agents:", error);
    return [];
  }
}

/**
 * Busca formatos de estabelecimento para dropdown
 * Replicado do Outbank-One
 */
export async function getEstablishmentFormatForDropdown(): Promise<EstablishmentFormatDropdown[]> {
  try {
    const result = await db
      .select({
        value: establishmentFormat.code,
        label: establishmentFormat.name,
      })
      .from(establishmentFormat)
      .orderBy(asc(establishmentFormat.code));

    return result.map((item) => ({
      value: item.value ?? "",
      label: item.label ?? "",
    }));
  } catch (error) {
    console.error("Error fetching establishment formats:", error);
    return [];
  }
}

