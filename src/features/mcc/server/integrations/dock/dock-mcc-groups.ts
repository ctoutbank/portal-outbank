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
  // URL base da Plataforma de Dados - precisa ser configurada pela Dock
  const baseUrl = process.env.DOCK_API_URL_PLATAFORMA_DADOS;
  
  if (!baseUrl) {
    throw new Error(
      "DOCK_API_URL_PLATAFORMA_DADOS não configurado. " +
      "Esta variável deve ser fornecida pela Dock durante o onboarding técnico."
    );
  }

  if (!process.env.DOCK_API_KEY) {
    throw new Error("DOCK_API_KEY não configurado");
  }

  // Prefixo de versão da API - configurável via variável de ambiente
  // Padrão: sem prefixo (pode ser /v1, /v2, etc. - a confirmar com Dock)
  const apiVersion = process.env.DOCK_API_DADOS_VERSION || '';
  const versionPath = apiVersion ? `/${apiVersion}` : '';
  
  // Construir URL completa
  // Formato esperado: {BASE_URL}{VERSION}/mcc_group ou {BASE_URL}/mcc_group
  const basePath = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const mccGroupPath = `${versionPath}/mcc_group`.replace('//', '/'); // Remove dupla barra se necessário
  const url = new URL(`${basePath}${mccGroupPath}`);
  url.searchParams.append("limit", limit.toString());
  url.searchParams.append("offset", offset.toString());

  // Headers de autenticação - usando mesmo padrão das outras APIs da Dock
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.DOCK_API_KEY}`,
  };

  // Adicionar X-Customer se estiver configurado (usado em outras APIs)
  if (process.env.DOCK_X_CUSTOMER) {
    headers["X-Customer"] = process.env.DOCK_X_CUSTOMER;
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(
      `Erro ao buscar MCC Groups da Dock: ${response.statusText} (${response.status}). URL: ${url.toString()}. Detalhes: ${errorText}`
    );
  }

  const rawData = await response.json();
  
  // Adaptar resposta - estrutura pode variar
  // Se for array direto, converter para formato esperado
  let data: DockMccGroupResponse;
  if (Array.isArray(rawData)) {
    data = { objects: rawData };
  } else {
    data = rawData as DockMccGroupResponse;
  }
  
  return data;
}

/**
 * Busca todos os grupos MCC da Dock com paginação automática
 * @returns Array completo de grupos MCC
 * 
 * Nota: A forma de paginação precisa ser confirmada com a Dock.
 * Atualmente assume padrão limit/offset, mas pode ser diferente.
 */
export async function fetchAllDockMccGroups() {
  let offset = 0;
  const limit = parseInt(process.env.DOCK_API_DADOS_LIMIT || '1000', 10);
  let hasMoreData = true;
  const allGroups: any[] = [];
  let consecutiveErrors = 0;
  const maxErrors = 3;

  while (hasMoreData) {
    try {
      const response = await fetchDockMccGroups(offset, limit);
      
      // Estrutura da resposta precisa ser confirmada com Dock
      // Assumindo padrão objects + meta, mas pode ser diferente
      if (response.objects && response.objects.length > 0) {
        allGroups.push(...response.objects);
        consecutiveErrors = 0; // Reset contador de erros
      }

      // Verificar se há mais dados
      if (response.meta) {
        const totalCount = response.meta.total_count || 0;
        offset += limit;
        hasMoreData = offset < totalCount;
      } else {
        // Se não houver meta, verificar se retornou menos que o limite
        // Isso indica que não há mais dados
        hasMoreData = response.objects ? response.objects.length === limit : false;
        offset += limit;
      }

      // Rate limiting conservador - delay entre requisições
      const rateLimitDelay = parseInt(process.env.DOCK_API_DADOS_RATE_LIMIT_DELAY || '100', 10);
      if (hasMoreData && rateLimitDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
      }
    } catch (error) {
      consecutiveErrors++;
      if (consecutiveErrors >= maxErrors) {
        console.error(`[DOCK MCC] Muitos erros consecutivos (${consecutiveErrors}). Parando sincronização.`);
        throw error;
      }
      console.warn(`[DOCK MCC] Erro na requisição (tentativa ${consecutiveErrors}/${maxErrors}):`, error);
      // Retry com delay exponencial
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, consecutiveErrors) * 1000));
    }
  }

  return allGroups;
}

