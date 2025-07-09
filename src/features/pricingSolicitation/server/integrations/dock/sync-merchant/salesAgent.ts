"use server";

import { db } from "@/server/db";
import { eq, sql } from "drizzle-orm";
import { salesAgents } from "../../../../../drizzle/schema";
import { saleAgent } from "./types";

async function updateSaleAgent(saleAgent: saleAgent, existingSlug: string) {
  try {
    const DtUpdate = saleAgent.dtUpdate
      ? new Date(saleAgent.dtUpdate).toISOString()
      : new Date().toISOString();

    await db
      .update(salesAgents)
      .set({
        active: saleAgent.active,
        dtupdate: DtUpdate,
        firstName: saleAgent.firstName,
        lastName: saleAgent.lastName,
        documentId: saleAgent.documentId,
        email: saleAgent.email,
        slugCustomer: saleAgent.slugCustomer,
      })
      .where(eq(salesAgents.slug, existingSlug));

    console.log(`Sales agent with slug ${existingSlug} updated successfully.`);
  } catch (error) {
    console.error(
      `Error updating sales agent with slug ${existingSlug}:`,
      error
    );
  }
}

async function insertSaleAgent(saleAgent: saleAgent) {
  try {
    const existing = await db
      .select()
      .from(salesAgents)
      .where(eq(salesAgents.slug, saleAgent.slug));

    if (existing.length > 0) {
      return;
    }

    await db.insert(salesAgents).values({
      slug: saleAgent.slug,
      active: saleAgent.active,
      dtinsert: saleAgent.dtInsert
        ? new Date(saleAgent.dtInsert).toISOString()
        : null,
      dtupdate: saleAgent.dtUpdate
        ? new Date(saleAgent.dtUpdate).toISOString()
        : null,
      firstName: saleAgent.firstName,
      lastName: saleAgent.lastName,
      documentId: saleAgent.documentId,
      email: saleAgent.email,
      slugCustomer: saleAgent.slugCustomer,
    });
  } catch (error) {
    console.error("Error inserting sale agent:", error);
  }
}

export async function getOrCreateSaleAgent(saleAgent: saleAgent) {
  try {
    const result = await db
      .select({ slug: salesAgents.slug })
      .from(salesAgents)
      .where(sql`${salesAgents.slug} = ${saleAgent.slug}`);
    if (result.length > 0 && result[0].slug) {
      // O agente de vendas existe, então atualizamos com os novos valores
      await updateSaleAgent(saleAgent, result[0].slug);
      return result[0].slug;
    } else {
      await insertSaleAgent(saleAgent);
      return saleAgent.slug;
    }
  } catch (error) {
    console.error("Error getting or creating sale agent:", error);
    return saleAgent.slug; // Retorna o slug original em caso de erro
  }
}
