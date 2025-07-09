"use server";

import { db } from "@/server/db";
import { sql } from "drizzle-orm";

import { eq } from "drizzle-orm";

import { legalNatures } from "../../../../../drizzle/schema";
import { LegalNature } from "./types";

async function updateLegalNature(
  legalNature: LegalNature,
  existingSlug: string
) {
  try {
    const DtUpdate = legalNature.dtUpdate
      ? new Date(legalNature.dtUpdate).toISOString()
      : new Date().toISOString();

    await db
      .update(legalNatures)
      .set({
        active: legalNature.active,
        dtupdate: DtUpdate,
        name: legalNature.name,
        code: legalNature.code,
      })
      .where(eq(legalNatures.slug, existingSlug));

    console.log(`Legal nature with slug ${existingSlug} updated successfully.`);
  } catch (error) {
    console.error(
      `Error updating legal nature with slug ${existingSlug}:`,
      error
    );
  }
}

async function insertLegalNature(legalNature: LegalNature) {
  try {
    const existing = await db
      .select()
      .from(legalNatures)
      .where(eq(legalNatures.slug, legalNature.slug));

    if (existing.length > 0) {
      console.log(
        "LegalNature with this slug already exists. Skipping insert."
      );
      return; // Não realiza o insert
    }

    const DtInsert = legalNature.dtInsert
      ? new Date(legalNature.dtInsert).toISOString()
      : null;
    const DtUpdate = legalNature.dtUpdate
      ? new Date(legalNature.dtUpdate).toISOString()
      : null;

    await db.insert(legalNatures).values({
      slug: legalNature.slug,
      active: legalNature.active,
      dtinsert: DtInsert,
      dtupdate: DtUpdate,
      name: legalNature.name,
      code: legalNature.code,
    });
  } catch (error) {
    console.error("Error inserting legal nature:", error);
  }
}

export async function getOrCreateLegalNature(legalNature: LegalNature) {
  try {
    const result = await db
      .select({ slug: legalNatures.slug })
      .from(legalNatures)
      .where(sql`${legalNatures.slug} = ${legalNature.slug}`);
    if (result.length > 0 && result[0].slug) {
      // A natureza legal existe, então atualizamos com os novos valores
      await updateLegalNature(legalNature, result[0].slug);
      return result[0].slug;
    } else {
      await insertLegalNature(legalNature);
      return legalNature.slug;
    }
  } catch (error) {
    console.error("Error getting or creating legal nature:", error);
    return legalNature.slug; // Retorna o slug original em caso de erro
  }
}
