"use server";

import { fetchAllDockMccGroups } from "../dock-mcc-groups";
import {
  getMccGroupById,
  insertMccGroup,
  updateMccGroup,
  deactivateMccGroup,
} from "@/features/mcc/server/mcc-groups";
import type { DockMccGroup } from "../dock-mcc-types";

/**
 * Sincroniza grupos MCC da Dock com o banco de dados
 */
export async function syncMccGroups(): Promise<{
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
    console.log("[SYNC MCC] Iniciando sincronização de MCC Groups...");
    
    const dockGroups = await fetchAllDockMccGroups();
    console.log(`[SYNC MCC] Encontrados ${dockGroups.length} grupos MCC na Dock`);

    for (const dockGroup of dockGroups) {
      try {
        const existingGroup = await getMccGroupById(dockGroup.id);
        const dbOperation = dockGroup.database_operation || 'i';

        if (dbOperation === 'd') {
          // Deletar (soft delete)
          if (existingGroup) {
            await deactivateMccGroup(dockGroup.id);
            stats.deactivated++;
          }
        } else if (existingGroup) {
          // Atualizar
          // Campos obrigatórios: id, description, availability_date, database_operation
          await updateMccGroup(dockGroup.id, {
            description: dockGroup.description, // Obrigatório
            availabilityDate: dockGroup.availability_date || null, // Obrigatório
            databaseOperation: dbOperation, // Obrigatório
            isActive: true,
          });
          stats.updated++;
        } else {
          // Inserir
          // Validar campos obrigatórios antes de inserir
          if (!dockGroup.id || !dockGroup.description || !dockGroup.availability_date || !dbOperation) {
            console.error(`[SYNC MCC] Grupo MCC ${dockGroup.id} com campos obrigatórios faltando. Pulando.`);
            stats.errors++;
            continue;
          }
          
          await insertMccGroup({
            id: dockGroup.id, // Obrigatório
            description: dockGroup.description, // Obrigatório
            availabilityDate: dockGroup.availability_date, // Obrigatório
            databaseOperation: dbOperation, // Obrigatório
            isActive: true,
          });
          stats.inserted++;
        }
      } catch (error) {
        console.error(`[SYNC MCC] Erro ao processar grupo MCC ${dockGroup.id}:`, error);
        stats.errors++;
      }
    }

    console.log(`[SYNC MCC] Sincronização de MCC Groups concluída:`, stats);
    return stats;
  } catch (error) {
    console.error("[SYNC MCC] Erro ao sincronizar MCC Groups:", error);
    throw error;
  }
}

