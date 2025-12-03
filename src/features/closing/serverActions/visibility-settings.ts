"use server";

import { db } from "@/lib/db";
import { pageVisibilitySettings } from "@/../../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { isSuperAdmin } from "@/lib/permissions/check-permissions";

export async function getVisibilitySettings(pageSlug: string = "closing") {
  try {
    // Buscar configuração global (sem userId e profileId)
    const globalSettings = await db
      .select()
      .from(pageVisibilitySettings)
      .where(
        and(
          eq(pageVisibilitySettings.pageSlug, pageSlug),
          eq(pageVisibilitySettings.active, true),
          isNull(pageVisibilitySettings.userId),
          isNull(pageVisibilitySettings.profileId)
        )
      )
      .limit(1);

    if (globalSettings.length > 0) {
      const hiddenSections = globalSettings[0].hiddenSections as string[] || [];
      return { hiddenSections: Array.isArray(hiddenSections) ? hiddenSections : [] };
    }

    return { hiddenSections: [] };
  } catch (error) {
    console.error("Erro ao buscar configurações de visibilidade:", error);
    return { hiddenSections: [] };
  }
}

export async function saveVisibilitySettings(
  hiddenSections: string[],
  pageSlug: string = "closing"
) {
  // Verificar se é Super Admin ANTES de qualquer operação
  const isSuper = await isSuperAdmin();
  if (!isSuper) {
    throw new Error("Apenas Super Administradores podem editar o layout global");
  }

  try {
    // Verificar se já existe configuração global para esta página
    const existing = await db
      .select()
      .from(pageVisibilitySettings)
      .where(
        and(
          eq(pageVisibilitySettings.pageSlug, pageSlug),
          isNull(pageVisibilitySettings.userId),
          isNull(pageVisibilitySettings.profileId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Atualizar configuração global existente
      await db
        .update(pageVisibilitySettings)
        .set({
          hiddenSections: hiddenSections as any,
          dtupdate: new Date().toISOString(),
        })
        .where(eq(pageVisibilitySettings.id, existing[0].id));
    } else {
      // Criar nova configuração global (userId e profileId NULL)
      await db.insert(pageVisibilitySettings).values({
        pageSlug,
        userId: null,
        profileId: null,
        hiddenSections: hiddenSections as any,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar configurações de visibilidade:", error);
    throw new Error("Erro ao salvar configurações");
  }
}

