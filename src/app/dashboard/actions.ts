"use server";

import { db } from "@/db/drizzle";
import { and, count, sql, inArray, or, not, isNull } from "drizzle-orm";
import { merchants, payout, transactions, customers } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getMerchantModuleBadges } from "@/lib/modules/merchant-modules";
import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";

export interface MerchantData {
  id: number;
  name: string;
  bruto: number;
  lucro: number;
  crescimento: number;
  moduleSlugs?: string[];
  customerId?: number | null;
  customerName?: string | null;
}

// Interface para os dados do cliente
export interface CustomerData {
  id: number;
  name: string;
  bruto: number;
  lucro: number;
  crescimento: number; // Percentual de crescimento em relação ao período anterior
}

// Interface para os dados do dashboard
export interface DashboardData {
  totalEstabelecimentos: number;
  totalTransacoes: number;
  totalBruto: number;
  totalLucro: number;
  topMerchants: MerchantData[];
  lastUpdate: Date;
}

// Cache de dados do dashboard - agora indexado por usuário
const dashboardCacheByUser = new Map<string, DashboardData>();
const lastCacheUpdateByUser = new Map<string, Date>();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutos

// Função utilitária para converter UUID para VARCHAR nas comparações
function uuidToVarchar(field: unknown) {
  return sql`${field}::varchar`;
}

// Função auxiliar para obter os slugs dos ISOs permitidos do usuário
async function getUserAllowedCustomerSlugs(): Promise<{ slugs: string[]; customerIds: number[] }> {
  const userInfo = await getCurrentUserInfo();

  if (!userInfo || userInfo.allowedCustomers.length === 0) {
    console.log("[Dashboard] Usuário não tem ISOs vinculados");
    return { slugs: [], customerIds: [] };
  }

  console.log(`[Dashboard] ISOs permitidos para o usuário: ${userInfo.allowedCustomers.join(', ')}`);

  const customerSlugsResult = await db
    .select({
      id: customers.id,
      slug: customers.slug
    })
    .from(customers)
    .where(inArray(customers.id, userInfo.allowedCustomers));

  const slugs = customerSlugsResult.map(c => c.slug).filter(Boolean) as string[];
  const customerIds = customerSlugsResult.map(c => c.id);

  console.log(`[Dashboard] Slugs dos ISOs: ${slugs.join(', ')}`);

  return { slugs, customerIds };
}

// Função auxiliar para obter o ID único do usuário para cache
async function getUserCacheKey(): Promise<string> {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo) return "anonymous";
  return `user-${userInfo.id}-${userInfo.allowedCustomers.sort().join('-')}`;
}

// Obter o total e contagem de estabelecimentos dos ISOs do usuário
export async function getMerchantsStats() {
  try {
    const { slugs } = await getUserAllowedCustomerSlugs();

    if (slugs.length === 0) {
      return { totalEstabelecimentos: 0 };
    }

    // Contar merchants de TODOS os ISOs permitidos
    const merchantsCount = await db
      .select({ count: count() })
      .from(merchants)
      .where(inArray(merchants.slugCustomer, slugs));

    console.log(`[Dashboard] Total de merchants dos ISOs do usuário: ${merchantsCount[0]?.count || 0}`);

    return {
      totalEstabelecimentos: merchantsCount[0]?.count || 0
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas de estabelecimentos:", error);
    return {
      totalEstabelecimentos: 0
    };
  }
}

// Obter o total e contagem de transações dos ISOs do usuário
export async function getTransactionsStats() {
  try {
    const { slugs } = await getUserAllowedCustomerSlugs();

    if (slugs.length === 0) {
      return { totalTransacoes: 0, totalBruto: 0 };
    }

    // Buscar todos os merchants dos ISOs permitidos
    const isoMerchants = await db
      .select({
        id: merchants.id,
        slug: merchants.slug
      })
      .from(merchants)
      .where(inArray(merchants.slugCustomer, slugs));

    console.log(`[Dashboard] Total de merchants dos ISOs: ${isoMerchants.length}`);

    if (isoMerchants.length === 0) {
      return {
        totalTransacoes: 0,
        totalBruto: 0
      };
    }

    // Extrair slugs dos merchants
    const merchantSlugs = isoMerchants.map(m => m.slug).filter(Boolean) as string[];

    // Buscar transações por customer slugs ou merchant slugs
    const transactionsCount = await db
      .select({ count: count() })
      .from(transactions)
      .where(
        or(
          inArray(transactions.slugCustomer, slugs),
          inArray(uuidToVarchar(transactions.slugMerchant), merchantSlugs)
        )
      );

    const transactionsTotal = await db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.totalAmount}), 0)`
      })
      .from(transactions)
      .where(
        or(
          inArray(transactions.slugCustomer, slugs),
          inArray(uuidToVarchar(transactions.slugMerchant), merchantSlugs)
        )
      );

    console.log(`[Dashboard] Total de transações: ${transactionsCount[0]?.count || 0}`);
    console.log(`[Dashboard] Total bruto: ${Number(transactionsTotal[0]?.total || 0)}`);

    return {
      totalTransacoes: transactionsCount[0]?.count || 0,
      totalBruto: Number(transactionsTotal[0]?.total || 0)
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas de transações:", error);
    console.error(error);
    return {
      totalTransacoes: 0,
      totalBruto: 0
    };
  }
}

// Obter o total de lucro (baseado em payouts) dos ISOs do usuário
export async function getProfit() {
  try {
    const { slugs, customerIds } = await getUserAllowedCustomerSlugs();

    if (slugs.length === 0 || customerIds.length === 0) {
      return { totalLucro: 0 };
    }

    // Buscar todos os merchants dos ISOs permitidos
    const isoMerchants = await db
      .select({
        id: merchants.id
      })
      .from(merchants)
      .where(inArray(merchants.slugCustomer, slugs));

    console.log(`[Dashboard] Total de merchants para lucro: ${isoMerchants.length}`);

    if (isoMerchants.length === 0) {
      return {
        totalLucro: 0
      };
    }

    // Extrair IDs dos merchants
    const merchantIds = isoMerchants.map(m => m.id);

    // Buscar lucro por customer IDs ou merchant IDs
    const profitResult = await db
      .select({
        totalLucro: sql<number>`COALESCE(SUM(
          ${payout.transactionMdrFee} + ${payout.transactionFee}
        ), 0)`
      })
      .from(payout)
      .where(
        or(
          inArray(payout.idCustomer, customerIds),
          inArray(payout.idMerchant, merchantIds)
        )
      );

    const totalLucro = Number(profitResult[0]?.totalLucro || 0);
    console.log(`[Dashboard] Total de lucro: ${totalLucro}`);

    return {
      totalLucro: totalLucro
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas de lucro:", error);
    console.error(error);
    return {
      totalLucro: 0
    };
  }
}

// Obter os 5 principais merchants dos ISOs do usuário
export async function getTopIsoMerchants(): Promise<MerchantData[]> {
  try {
    console.log("[Dashboard] Iniciando consulta getTopIsoMerchants");

    const { slugs } = await getUserAllowedCustomerSlugs();

    if (slugs.length === 0) {
      console.log("[Dashboard] Nenhum ISO permitido para o usuário");
      return [];
    }

    // Buscar todos os merchants dos ISOs permitidos
    const isoMerchants = await db
      .select({
        id: merchants.id,
        name: merchants.name,
        corporateName: merchants.corporateName,
        slug: merchants.slug
      })
      .from(merchants)
      .where(inArray(merchants.slugCustomer, slugs));

    console.log(`[Dashboard] Merchants dos ISOs: ${isoMerchants.length}`);

    if (isoMerchants.length === 0) {
      console.log(`[Dashboard] Nenhum merchant encontrado para os ISOs`);
      return [];
    }

    // Extrair IDs dos merchants para usar nas consultas
    const merchantIds = isoMerchants.map(m => m.id);
    const merchantSlugs = isoMerchants.map(m => m.slug).filter(Boolean) as string[];
    console.log(`[Dashboard] Total de merchants dos ISOs: ${merchantIds.length}`);

    // 1. Buscar dados de transações - usando SOMENTE slugMerchant (não slugCustomer)
    // para ter apenas merchants específicos com transações diretamente relacionadas
    const transactionsBySlug = await db
      .select({
        slugMerchant: transactions.slugMerchant,
        totalAmount: sql<number>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
        totalCount: count()
      })
      .from(transactions)
      .where(
        and(
          not(isNull(transactions.slugMerchant)), // Garantir que slugMerchant não seja nulo
          inArray(uuidToVarchar(transactions.slugMerchant), merchantSlugs) // Apenas merchants específicos
        )
      )
      .groupBy(transactions.slugMerchant)
      .having(sql`${count()} > 0`); // Apenas grupos com pelo menos 1 transação

    // 2. Buscar dados de payouts por merchants
    const payoutsByMerchant = await db
      .select({
        idMerchant: payout.idMerchant,
        totalLucro: sql<number>`COALESCE(SUM(${payout.transactionMdrFee} + ${payout.transactionFee}), 0)`,
        totalBruto: sql<number>`COALESCE(SUM(${payout.installmentAmount}), 0)`,
      })
      .from(payout)
      .where(
        and(
          inArray(payout.idMerchant, merchantIds),
          not(isNull(payout.idMerchant))
        )
      )
      .groupBy(payout.idMerchant);

    console.log(`[Dashboard] Encontrados ${payoutsByMerchant.length} merchants com dados de payout`);
    console.log(`[Dashboard] Encontrados ${transactionsBySlug.length} merchants com dados de transações`);

    // Construir mapa de merchant ID para slugs para facilitar associação
    const merchantIdToSlugMap = new Map();
    const merchantSlugToIdMap = new Map();
    const merchantIdToNameMap = new Map();

    isoMerchants.forEach(m => {
      merchantIdToSlugMap.set(Number(m.id), m.slug);
      merchantSlugToIdMap.set(m.slug, Number(m.id));
      merchantIdToNameMap.set(Number(m.id), m.name || m.corporateName || `Merchant ID ${m.id}`);
    });

    // Criar um mapa de valores por merchant combinando dados de diferentes fontes
    const merchantDataMap = new Map();

    // Conjunto de merchants com dados reais
    const merchantsWithDataIds = new Set();

    // Adicionar merchants com dados de transações
    transactionsBySlug.forEach(t => {
      const slugMerchant = t.slugMerchant?.toString();
      if (slugMerchant && merchantSlugToIdMap.has(slugMerchant)) {
        const merchantId = merchantSlugToIdMap.get(slugMerchant);
        const merchant = isoMerchants.find(m => Number(m.id) === merchantId);

        if (merchant && Number(t.totalAmount) > 0 && t.totalCount > 0) {
          merchantsWithDataIds.add(merchantId);

          merchantDataMap.set(merchantId, {
            id: merchantId,
            name: merchant.name || merchant.corporateName || `Merchant ID ${merchantId}`,
            bruto: Number(t.totalAmount || 0),
            lucro: 0,
            crescimento: 0
          });
        }
      }
    });

    // Adicionar dados de payouts
    payoutsByMerchant.forEach(p => {
      const merchantId = Number(p.idMerchant);
      const merchant = isoMerchants.find(m => Number(m.id) === merchantId);

      if (merchant && Number(p.totalBruto) > 0) {
        merchantsWithDataIds.add(merchantId);

        if (merchantDataMap.has(merchantId)) {
          // Merchant já existe no mapa (de transações)
          const merchantData = merchantDataMap.get(merchantId);
          // Usar o maior valor entre transações e payouts para o bruto
          merchantData.bruto = Math.max(merchantData.bruto, Number(p.totalBruto || 0));
          merchantData.lucro += Number(p.totalLucro || 0);
          merchantDataMap.set(merchantId, merchantData);
        } else {
          // Merchant só tem dados de payout
          merchantDataMap.set(merchantId, {
            id: merchantId,
            name: merchant.name || merchant.corporateName || `Merchant ID ${merchantId}`,
            bruto: Number(p.totalBruto || 0),
            lucro: Number(p.totalLucro || 0),
            crescimento: 0
          });
        }
      }
    });

    // Converter o mapa para array e filtrar apenas merchants com dados reais significativos
    const merchantsWithData = Array.from(merchantDataMap.values())
      .filter(m => m.bruto > 10); // Filtrar apenas merchants com pelo menos R$10 de bruto

    console.log(`[Dashboard] Dados reais obtidos para ${merchantsWithData.length} merchants`);

    // Buscar módulos para cada merchant
    const merchantsWithModules = await Promise.all(
      merchantsWithData.map(async (merchant) => {
        const moduleSlugs = await getMerchantModuleBadges(merchant.id);
        return {
          ...merchant,
          moduleSlugs: moduleSlugs || [],
        };
      })
    );

    // Ordenar por bruto e pegar os 5 principais
    merchantsWithModules.sort((a, b) => b.bruto - a.bruto);
    const topMerchants = merchantsWithModules.slice(0, 5);

    console.log(`[Dashboard] Retornando ${topMerchants.length} merchants com dados reais para o dashboard`);
    topMerchants.forEach(m => {
      console.log(`[Dashboard] ${m.name}: Bruto=${m.bruto}, Lucro=${m.lucro}, Crescimento=${m.crescimento}%`);
    });

    return topMerchants;
  } catch (error) {
    console.error("Erro ao buscar os principais merchants do ISO:", error);
    console.error(error);
    return [];
  }
}

// Função interna para atualizar o cache
async function updateDashboardCache() {
  try {
    console.log("[Dashboard] Atualizando cache do dashboard...");
    const cacheKey = await getUserCacheKey();

    // Executar todas as consultas em paralelo para melhor performance
    const [merchantsStats, transactionsStats, profitStats, topMerchants] = await Promise.all([
      getMerchantsStats(),
      getTransactionsStats(),
      getProfit(),
      getTopIsoMerchants()
    ]);

    const dashboardData: DashboardData = {
      totalEstabelecimentos: merchantsStats?.totalEstabelecimentos || 0,
      totalTransacoes: transactionsStats?.totalTransacoes || 0,
      totalBruto: transactionsStats?.totalBruto || 0,
      totalLucro: profitStats?.totalLucro || 0,
      topMerchants: topMerchants,
      lastUpdate: new Date()
    };

    dashboardCacheByUser.set(cacheKey, dashboardData);
    lastCacheUpdateByUser.set(cacheKey, new Date());

    console.log(`[Dashboard] Cache atualizado para usuário ${cacheKey} em:`, new Date());

    return dashboardData;
  } catch (error) {
    console.error("Erro ao atualizar cache do dashboard:", error);
    return null;
  }
}

// Força a atualização do cache e revalidação do dashboard
export async function refreshDashboard() {
  try {
    await updateDashboardCache();
    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true, message: "Dashboard atualizado com sucesso" };
  } catch (error) {
    console.error("Erro ao atualizar dashboard:", error);
    return { success: false, message: "Erro ao atualizar dashboard" };
  }
}

// Obter todas as estatísticas necessárias para o dashboard em uma única função
export async function getDashboardData() {
  try {
    console.log("[Dashboard] Iniciando getDashboardData para o usuário");

    const cacheKey = await getUserCacheKey();
    const now = new Date();
    const cachedData = dashboardCacheByUser.get(cacheKey);
    const lastUpdate = lastCacheUpdateByUser.get(cacheKey);

    // Verificar se temos cache válido para este usuário
    if (
      cachedData &&
      lastUpdate &&
      (now.getTime() - lastUpdate.getTime() < CACHE_TTL_MS)
    ) {
      console.log(`[Dashboard] Retornando dados do cache para ${cacheKey} (última atualização:`, lastUpdate, ")");
      return cachedData;
    }

    // Se não temos cache ou está expirado, atualizar
    return await updateDashboardCache() || {
      totalEstabelecimentos: 0,
      totalTransacoes: 0,
      totalBruto: 0,
      totalLucro: 0,
      topMerchants: [],
      lastUpdate: new Date()
    };
  } catch (error) {
    console.error("[Dashboard] Erro ao obter dados do dashboard:", error);
    console.error(error);

    // Tentar retornar cache existente mesmo expirado
    const cacheKey = await getUserCacheKey();
    const cachedData = dashboardCacheByUser.get(cacheKey);

    if (cachedData) {
      console.log("[Dashboard] Retornando cache expirado devido a erro");
      return cachedData;
    }

    // Último recurso - retornar dados vazios
    return {
      totalEstabelecimentos: 0,
      totalTransacoes: 0,
      totalBruto: 0,
      totalLucro: 0,
      topMerchants: [],
      lastUpdate: new Date()
    };
  }
}
