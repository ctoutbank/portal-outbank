"use server";

import { syncMccGroups } from "./mcc-groups";
import { syncMccs } from "./mcc";

/**
 * Função principal de sincronização de MCCs e MCC Groups da Dock
 * Sincroniza primeiro os grupos, depois os MCCs (pois MCC depende de MCC Group)
 */
export async function syncMccFromDock(): Promise<{
  groups: {
    inserted: number;
    updated: number;
    deactivated: number;
    errors: number;
  };
  mccs: {
    inserted: number;
    updated: number;
    deactivated: number;
    errors: number;
  };
}> {
  if (process.env.DOCK_SYNC_ENABLED !== "true") {
    console.log("[SYNC MCC] Sincronização desabilitada. Configure DOCK_SYNC_ENABLED=true para habilitar.");
    throw new Error("Sincronização desabilitada");
  }

  console.log("[SYNC MCC] Iniciando sincronização completa de MCCs da Dock...");
  const startTime = Date.now();

  try {
    // 1. Sincronizar grupos primeiro (MCC depende deles)
    const groupsStats = await syncMccGroups();

    // 2. Sincronizar MCCs
    const mccsStats = await syncMccs();

    const duration = Date.now() - startTime;
    console.log(`[SYNC MCC] Sincronização completa concluída em ${duration}ms`);

    return {
      groups: groupsStats,
      mccs: mccsStats,
    };
  } catch (error) {
    console.error("[SYNC MCC] Erro na sincronização:", error);
    throw error;
  }
}

