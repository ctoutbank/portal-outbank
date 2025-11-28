"use server";

import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { configurations } from "../../../../drizzle/schema";
import { generateSlug } from "@/lib/utils";

export type ConfigurationDetail = typeof configurations.$inferSelect;
export type ConfigurationInsert = typeof configurations.$inferInsert;

export async function insertConfiguration(
  configuration: ConfigurationInsert
): Promise<number> {
  const result = await db
    .insert(configurations)
    .values({
      ...configuration,
      slug: configuration.slug || generateSlug(),
      dtinsert: configuration.dtinsert || new Date().toISOString(),
      dtupdate: configuration.dtupdate || new Date().toISOString(),
    })
    .returning({
      id: configurations.id,
    });

  return result[0].id;
}

export async function updateConfiguration(
  configuration: ConfigurationDetail
): Promise<void> {
  await db
    .update(configurations)
    .set({
      slug: configuration.slug,
      active: configuration.active,
      lockCpAnticipationOrder: configuration.lockCpAnticipationOrder,
      lockCnpAnticipationOrder: configuration.lockCnpAnticipationOrder,
      url: configuration.url,
      dtupdate: new Date().toISOString(),
      anticipationRiskFactorCp: configuration.anticipationRiskFactorCp,
      anticipationRiskFactorCnp: configuration.anticipationRiskFactorCnp,
      waitingPeriodCp: configuration.waitingPeriodCp,
      waitingPeriodCnp: configuration.waitingPeriodCnp,
    })
    .where(eq(configurations.id, configuration.id));
}

