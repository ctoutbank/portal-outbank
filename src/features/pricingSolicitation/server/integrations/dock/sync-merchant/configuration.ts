"use server";

import { db } from "@/server/db";

import { eq, sql } from "drizzle-orm";
import { configurations } from "../../../../../drizzle/schema";
import { configuration } from "./types";

async function updateConfiguration(
  configuration: configuration,
  existingSlug: string
) {
  try {
    const DtUpdate = configuration.dtUpdate
      ? new Date(configuration.dtUpdate).toISOString()
      : new Date().toISOString();

    await db
      .update(configurations)
      .set({
        active: configuration.active,
        dtupdate: DtUpdate,
        lockCpAnticipationOrder: configuration.lockCpAnticipationOrder,
        lockCnpAnticipationOrder: configuration.lockCnpAnticipationOrder,
        url: configuration.url,
        anticipationRiskFactorCp: configuration.anticipationRiskFactorCp
          ? String(configuration.anticipationRiskFactorCp)
          : null,
        anticipationRiskFactorCnp: configuration.anticipationRiskFactorCnp
          ? String(configuration.anticipationRiskFactorCnp)
          : null,
        waitingPeriodCp: configuration.waitingPeriodCp
          ? String(configuration.waitingPeriodCp)
          : null,
        waitingPeriodCnp: configuration.waitingPeriodCnp
          ? String(configuration.waitingPeriodCnp)
          : null,
      })
      .where(eq(configurations.slug, existingSlug));

    console.log(
      `Configuration with slug ${existingSlug} updated successfully.`
    );
  } catch (error) {
    console.error(
      `Error updating configuration with slug ${existingSlug}:`,
      error
    );
  }
}

async function insertConfiguration(configuration: configuration) {
  try {
    const existing = await db
      .select()
      .from(configurations)
      .where(eq(configurations.slug, configuration.slug));

    if (existing.length > 0) {
      console.log(
        "Configuration with this slug already exists. Skipping insert."
      );
      return; // Não realiza o insert
    }

    const DtInsert = configuration.dtInsert
      ? new Date(configuration.dtInsert).toISOString()
      : null;
    const DtUpdate = configuration.dtUpdate
      ? new Date(configuration.dtUpdate).toISOString()
      : null;

    await db.insert(configurations).values({
      slug: configuration.slug,
      active: configuration.active,
      dtinsert: DtInsert,
      dtupdate: DtUpdate,
      lockCpAnticipationOrder: configuration.lockCpAnticipationOrder,
      lockCnpAnticipationOrder: configuration.lockCnpAnticipationOrder,
      url: configuration.url,
      anticipationRiskFactorCp: configuration.anticipationRiskFactorCp
        ? String(configuration.anticipationRiskFactorCp)
        : null,
      anticipationRiskFactorCnp: configuration.anticipationRiskFactorCnp
        ? String(configuration.anticipationRiskFactorCnp)
        : null,
      waitingPeriodCp: configuration.waitingPeriodCp
        ? String(configuration.waitingPeriodCp)
        : null,
      waitingPeriodCnp: configuration.waitingPeriodCnp
        ? String(configuration.waitingPeriodCnp)
        : null,
    });
  } catch (error) {
    console.error("Error inserting configuration:", error);
  }
}

export async function getOrCreateConfiguration(configuration: configuration) {
  try {
    const result = await db
      .select({ slug: configurations.slug })
      .from(configurations)
      .where(sql`${configurations.slug} = ${configuration.slug}`);
    if (result.length > 0 && result[0].slug) {
      // A configuração existe, então atualizamos com os novos valores
      await updateConfiguration(configuration, result[0].slug);
      return result[0].slug;
    } else {
      await insertConfiguration(configuration);
      return configuration.slug;
    }
  } catch (error) {
    console.error("Error getting or creating configuration:", error);
    return configuration.slug; // Retorna o slug original em caso de erro
  }
}
