"use server";

import { fetchAllDockMcc } from "../dock-mcc";
import {
  getMccByCode,
  insertMcc,
  updateMcc,
  deactivateMcc,
} from "@/features/mcc/server/mcc";
import type { DockMcc } from "../dock-mcc-types";

/**
 * Sincroniza MCCs da Dock com o banco de dados
 */
export async function syncMccs(): Promise<{
  inserted: number;
  updated: number;
  deactivated: number;
  errors: number;
}> {
  const stats = {
    inserted: 0,
    updated: 0,
    deactivated: 0,
    errors: 0,
  };

  try {
    console.log("[SYNC MCC] Iniciando sincronização de MCCs...");
    
    const dockMccs = await fetchAllDockMcc();
    console.log(`[SYNC MCC] Encontrados ${dockMccs.length} MCCs na Dock`);

    for (const dockMcc of dockMccs) {
      try {
        const existingMcc = await getMccByCode(dockMcc.code);
        const dbOperation = dockMcc.database_operation || 'i';

        if (dbOperation === 'd') {
          // Deletar (soft delete)
          if (existingMcc) {
            await deactivateMcc(dockMcc.code);
            stats.deactivated++;
          }
        } else if (existingMcc) {
          // Atualizar
          await updateMcc(dockMcc.code, {
            description: dockMcc.description,
            mccGroupId: dockMcc.mcc_group_id,
            availabilityDate: dockMcc.availability_date || null,
            databaseOperation: dbOperation,
            isActive: true,
          });
          stats.updated++;
        } else {
          // Inserir
          await insertMcc({
            code: dockMcc.code,
            description: dockMcc.description,
            mccGroupId: dockMcc.mcc_group_id,
            availabilityDate: dockMcc.availability_date || null,
            databaseOperation: dbOperation,
            isActive: true,
          });
          stats.inserted++;
        }
      } catch (error) {
        console.error(`[SYNC MCC] Erro ao processar MCC ${dockMcc.code}:`, error);
        stats.errors++;
      }
    }

    console.log(`[SYNC MCC] Sincronização de MCCs concluída:`, stats);
    return stats;
  } catch (error) {
    console.error("[SYNC MCC] Erro ao sincronizar MCCs:", error);
    throw error;
  }
}

