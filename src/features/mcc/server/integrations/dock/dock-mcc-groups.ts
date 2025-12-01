"use server";

import { DockMccGroupResponse } from "./dock-mcc-types";

/**
 * Busca todos os grupos MCC da API Dock
 * @param offset - Offset para paginação
 * @param limit - Limite de registros por requisição
 * @returns Array de grupos MCC
 */
export async function fetchDockMccGroups(
  offset: number = 0,
  limit: number = 1000
): Promise<DockMccGroupResponse> {
  const baseUrl = process.env.DOCK_API_URL || process.env.DOCK_API_URL_PLATAFORMA_DADOS;
  
  if (!baseUrl) {
    throw new Error("DOCK_API_URL ou DOCK_API_URL_PLATAFORMA_DADOS não configurado");
  }

  const url = new URL(`${baseUrl}/mcc_group`);
  url.searchParams.append("limit", limit.toString());
  url.searchParams.append("offset", offset.toString());

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DOCK_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Erro ao buscar MCC Groups da Dock: ${response.statusText} (${response.status})`
    );
  }

  const data: DockMccGroupResponse = await response.json();
  return data;
}

/**
 * Busca todos os grupos MCC da Dock com paginação automática
 * @returns Array completo de grupos MCC
 */
export async function fetchAllDockMccGroups() {
  let offset = 0;
  const limit = 1000;
  let hasMoreData = true;
  const allGroups: any[] = [];

  while (hasMoreData) {
    const response = await fetchDockMccGroups(offset, limit);
    
    if (response.objects && response.objects.length > 0) {
      allGroups.push(...response.objects);
    }

    // Verificar se há mais dados
    if (response.meta) {
      const totalCount = response.meta.total_count || 0;
      offset += limit;
      hasMoreData = offset < totalCount;
    } else {
      // Se não houver meta, verificar se retornou menos que o limite
      hasMoreData = response.objects && response.objects.length === limit;
      offset += limit;
    }
  }

  return allGroups;
}

