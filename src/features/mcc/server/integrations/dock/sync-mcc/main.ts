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
  // Verificar variáveis de ambiente necessárias
  if (!process.env.DOCK_API_URL && !process.env.DOCK_API_URL_PLATAFORMA_DADOS) {
    throw new Error("DOCK_API_URL ou DOCK_API_URL_PLATAFORMA_DADOS não configurado");
  }

  if (!process.env.DOCK_API_KEY) {
    throw new Error("DOCK_API_KEY não configurado");
  }

  // Aviso se DOCK_SYNC_ENABLED não estiver configurado, mas permite execução manual
  if (process.env.DOCK_SYNC_ENABLED !== "true") {
    console.warn("[SYNC MCC] DOCK_SYNC_ENABLED não está configurado como 'true'. A sincronização manual está sendo executada.");
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

