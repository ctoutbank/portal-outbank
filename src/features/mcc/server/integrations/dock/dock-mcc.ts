"use server";

import { DockMccResponse } from "./dock-mcc-types";

/**
 * Busca todos os MCCs da API Dock
 * @param offset - Offset para paginação
 * @param limit - Limite de registros por requisição
 * @returns Array de MCCs
 */
export async function fetchDockMcc(
  offset: number = 0,
  limit: number = 1000
): Promise<DockMccResponse> {
  const baseUrl = process.env.DOCK_API_URL || process.env.DOCK_API_URL_PLATAFORMA_DADOS;
  
  if (!baseUrl) {
    throw new Error("DOCK_API_URL ou DOCK_API_URL_PLATAFORMA_DADOS não configurado");
  }

  const url = new URL(`${baseUrl}/mcc`);
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
      `Erro ao buscar MCCs da Dock: ${response.statusText} (${response.status})`
    );
  }

  const data: DockMccResponse = await response.json();
  return data;
}

/**
 * Busca todos os MCCs da Dock com paginação automática
 * @returns Array completo de MCCs
 */
export async function fetchAllDockMcc() {
  let offset = 0;
  const limit = 1000;
  let hasMoreData = true;
  const allMccs: any[] = [];

  while (hasMoreData) {
    const response = await fetchDockMcc(offset, limit);
    
    if (response.objects && response.objects.length > 0) {
      allMccs.push(...response.objects);
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

  return allMccs;
}

