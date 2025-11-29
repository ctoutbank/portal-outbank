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
          // Campos obrigatórios: code, description, availability_date, database_operation
          // mcc_group_id pode ser nulo, mas geralmente tem valor
          await updateMcc(dockMcc.code, {
            description: dockMcc.description, // Obrigatório
            mccGroupId: dockMcc.mcc_group_id ?? existingMcc.mccGroupId, // Pode ser nulo
            availabilityDate: dockMcc.availability_date || null, // Obrigatório
            databaseOperation: dbOperation, // Obrigatório
            isActive: true,
          });
          stats.updated++;
        } else {
          // Inserir
          // Validar campos obrigatórios antes de inserir
          if (!dockMcc.code || !dockMcc.description || !dockMcc.availability_date || !dbOperation) {
            console.error(`[SYNC MCC] MCC ${dockMcc.code} com campos obrigatórios faltando. Pulando.`);
            stats.errors++;
            continue;
          }
          
          // mcc_group_id pode ser nulo na Dock, mas no nosso banco é NOT NULL (FK obrigatória)
          // Se for nulo, precisamos pular a inserção
          if (dockMcc.mcc_group_id === null || dockMcc.mcc_group_id === undefined) {
            console.warn(`[SYNC MCC] MCC ${dockMcc.code} sem mcc_group_id. Pulando inserção (FK obrigatória).`);
            stats.errors++;
            continue;
          }
          
          await insertMcc({
            code: dockMcc.code, // Obrigatório
            description: dockMcc.description, // Obrigatório
            mccGroupId: dockMcc.mcc_group_id, // Obrigatório para inserção (FK)
            availabilityDate: dockMcc.availability_date, // Obrigatório
            databaseOperation: dbOperation, // Obrigatório
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

