"use server";

import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { configurations, merchants } from "../../../../drizzle/schema";

export type ConfigurationInsert = typeof configurations.$inferInsert;
export type ConfigurationUpdate = typeof configurations.$inferSelect;

/**
 * Busca configurações por ID do merchant
 * Replicado do Outbank-One
 */
export async function getConfigurationsByMerchantId(id: number) {
  try {
    console.log("Buscando configuração para o merchant ID:", id);

    // Primeiro, buscar o idConfiguration do merchant
    const merchant = await db
      .select({
        idConfiguration: merchants.idConfiguration,
      })
      .from(merchants)
      .where(eq(merchants.id, id))
      .limit(1);

    const idConfiguration = merchant[0]?.idConfiguration;
    console.log("ID da configuração encontrado:", idConfiguration);

    if (!idConfiguration) {
      console.log("Nenhuma configuração associada a este merchant");
      return null;
    }

    // Agora buscar a configuração pelo ID
    const result = await db
      .select()
      .from(configurations)
      .where(eq(configurations.id, idConfiguration));

    console.log("Configuração encontrada:", result[0]);
    return result[0] || null;
  } catch (error) {
    console.error("Erro ao buscar configuração do merchant:", error);
    return null;
  }
}

export async function insertConfiguration(configuration: ConfigurationInsert) {
  const result = await db
    .insert(configurations)
    .values(configuration)
    .returning({
      id: configurations.id,
    });
  console.log("result", result);
  return result[0] || null;
}

export async function updateConfiguration(configuration: ConfigurationUpdate) {
  const result = await db
    .update(configurations)
    .set(configuration)
    .where(eq(configurations.id, configuration.id))
    .returning({
      id: configurations.id,
    });
  return result[0] || null;
}


