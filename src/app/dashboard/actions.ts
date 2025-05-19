"use server";

import { db } from "@/db/drizzle";
import { and, count, eq, gte, lt, sql, inArray, desc, or, isNotNull, not, isNull } from "drizzle-orm";
import { merchants, payout, transactions, customers } from "../../../drizzle/schema";
import { cache } from "react";
import { revalidatePath } from "next/cache";

// Interface para os dados do merchant
export interface MerchantData {
  id: number;
  name: string;
  bruto: number;
  lucro: number;
  crescimento: number; // Percentual de crescimento em relação ao período anterior
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

// O ID do customer ISO principal
const ISO_CUSTOMER_ID = 1;

// Cache de dados do dashboard
let dashboardCache: DashboardData | null = null;
let lastCacheUpdate: Date | null = null;
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutos

// Função utilitária para converter UUID para VARCHAR nas comparações
function uuidToVarchar(field: any) {
  return sql`${field}::varchar`;
}

// Obter o total e contagem de estabelecimentos do ISO
export async function getMerchantsStats() {
  try {
    // Primeiro, buscar o slug do customer com ID 1
    const customerInfo = await db
      .select({
        id: customers.id,
        slug: customers.slug
      })
      .from(customers)
      .where(eq(customers.id, ISO_CUSTOMER_ID))
      .limit(1);

    if (customerInfo.length === 0) {
      console.error(`Customer com ID ${ISO_CUSTOMER_ID} não encontrado`);
      return {
        totalEstabelecimentos: 0
      };
    }

    const customerSlug = customerInfo[0].slug;
    console.log(`Customer slug: ${customerSlug}`);

    // Usar o slugCustomer para consultar os merchants
    const merchantsCount = await db
      .select({ count: count() })
      .from(merchants)
      .where(eq(merchants.slugCustomer, customerSlug));

    console.log(`Contagem de merchants do ISO ${customerSlug}: ${merchantsCount[0]?.count || 0}`);

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

// Obter o total e contagem de transações do ISO
export async function getTransactionsStats() {
  try {
    // Buscar informações sobre o customer
    const customerInfo = await db
      .select({
        id: customers.id,
        slug: customers.slug
      })
      .from(customers)
      .where(eq(customers.id, ISO_CUSTOMER_ID))
      .limit(1);

    if (customerInfo.length === 0) {
      console.error(`Customer com ID ${ISO_CUSTOMER_ID} não encontrado`);
      return {
        totalTransacoes: 0,
        totalBruto: 0
      };
    }

    const customerSlug = customerInfo[0].slug;
    console.log(`Customer slug: ${customerSlug}`);
    
    // Buscar todos os merchants deste ISO usando slugCustomer
    const isoMerchants = await db
      .select({
        id: merchants.id,
        slug: merchants.slug
      })
      .from(merchants)
      .where(eq(merchants.slugCustomer, customerSlug));
    
    console.log(`Total de merchants deste ISO: ${isoMerchants.length}`);
    
    if (isoMerchants.length === 0) {
      return {
        totalTransacoes: 0,
        totalBruto: 0
      };
    }
    
    // Extrair slugs dos merchants
    const merchantSlugs = isoMerchants.map(m => m.slug).filter(Boolean) as string[];
    console.log(`Merchant slugs: ${merchantSlugs.join(', ')}`);
    
    // Buscar transações por merchants ou diretamente pelo customer slug
    const transactionsCount = await db
      .select({ count: count() })
      .from(transactions)
      .where(
        or(
          eq(transactions.slugCustomer, customerSlug),
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
          eq(transactions.slugCustomer, customerSlug),
          inArray(uuidToVarchar(transactions.slugMerchant), merchantSlugs)
        )
      );

    console.log(`Total de transações: ${transactionsCount[0]?.count || 0}`);
    console.log(`Total bruto: ${Number(transactionsTotal[0]?.total || 0)}`);

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

// Obter o total de lucro (baseado em payouts) do ISO
export async function getProfit() {
  try {
    // Primeiro, buscar o slug do customer
    const customerInfo = await db
      .select({
        id: customers.id,
        slug: customers.slug
      })
      .from(customers)
      .where(eq(customers.id, ISO_CUSTOMER_ID))
      .limit(1);

    if (customerInfo.length === 0) {
      console.error(`Customer com ID ${ISO_CUSTOMER_ID} não encontrado`);
      return {
        totalLucro: 0
      };
    }

    const customerSlug = customerInfo[0].slug;
    console.log(`Customer slug para cálculo de lucro: ${customerSlug}`);
    
    // Buscar todos os merchants deste ISO usando slugCustomer
    const isoMerchants = await db
      .select({
        id: merchants.id
      })
      .from(merchants)
      .where(eq(merchants.slugCustomer, customerSlug));
    
    console.log(`Total de merchants para lucro: ${isoMerchants.length}`);
    
    if (isoMerchants.length === 0) {
      return {
        totalLucro: 0
      };
    }
    
    // Extrair IDs dos merchants
    const merchantIds = isoMerchants.map(m => m.id);
    
    // Buscar lucro por merchants ou diretamente pelo customer ID
    const profitResult = await db
      .select({
        totalLucro: sql<number>`COALESCE(SUM(
          ${payout.transactionMdrFee} + ${payout.transactionFee}
        ), 0)`
      })
      .from(payout)
      .where(
        or(
          eq(payout.idCustomer, ISO_CUSTOMER_ID),
          inArray(payout.idMerchant, merchantIds)
        )
      );

    const totalLucro = Number(profitResult[0]?.totalLucro || 0);
    console.log(`Total de lucro: ${totalLucro}`);

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

// Obter os 5 principais merchants do ISO
export async function getTopIsoMerchants(): Promise<MerchantData[]> {
  try {
    console.log("Iniciando consulta getTopIsoMerchants");
    
    // Primeiro, buscar o slug do customer
    const customerInfo = await db
      .select({
        id: customers.id,
        slug: customers.slug
      })
      .from(customers)
      .where(eq(customers.id, ISO_CUSTOMER_ID))
      .limit(1);

    if (customerInfo.length === 0) {
      console.error(`Customer com ID ${ISO_CUSTOMER_ID} não encontrado`);
      return [];
    }

    const customerSlug = customerInfo[0].slug;
    console.log(`Customer slug para top merchants: ${customerSlug}`);
    
    // Buscar todos os merchants deste ISO usando slugCustomer
    const isoMerchants = await db
      .select({
        id: merchants.id,
        name: merchants.name,
        corporateName: merchants.corporateName,
        slug: merchants.slug
      })
      .from(merchants)
      .where(eq(merchants.slugCustomer, customerSlug));
    
    console.log(`Merchants do ISO: ${isoMerchants.length}`);
    
    if (isoMerchants.length === 0) {
      console.log(`Nenhum merchant encontrado para o ISO com slug ${customerSlug}`);
      return [];
    }

    // Extrair IDs dos merchants para usar nas consultas
    const merchantIds = isoMerchants.map(m => m.id);
    const merchantSlugs = isoMerchants.map(m => m.slug);
    console.log(`Total de merchants deste ISO: ${merchantIds.length}`);
    
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
    
    console.log(`Encontrados ${payoutsByMerchant.length} merchants com dados de payout`);
    console.log(`Encontrados ${transactionsBySlug.length} merchants com dados de transações`);
    
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
    
    // Inicializar apenas os merchants que efetivamente têm dados de transações ou payouts
    // Em vez de inicializar todos os merchants
    const transactionSlugs = transactionsBySlug.map(t => t.slugMerchant?.toString()).filter(Boolean);
    const payoutIds = payoutsByMerchant.map(p => Number(p.idMerchant));
    
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
    
    console.log(`Dados reais obtidos para ${merchantsWithData.length} merchants`);
    
    // Ordenar por bruto e pegar os 5 principais
    merchantsWithData.sort((a, b) => b.bruto - a.bruto);
    const topMerchants = merchantsWithData.slice(0, 5);
    
    console.log(`Retornando ${topMerchants.length} merchants com dados reais para o dashboard`);
    topMerchants.forEach(m => {
      console.log(`${m.name}: Bruto=${m.bruto}, Lucro=${m.lucro}, Crescimento=${m.crescimento}%`);
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
    console.log("Atualizando cache do dashboard...");
    
    // Executar todas as consultas em paralelo para melhor performance
    const [merchantsStats, transactionsStats, profitStats, topMerchants] = await Promise.all([
      getMerchantsStats(),
      getTransactionsStats(),
      getProfit(),
      getTopIsoMerchants()
    ]);
    
    dashboardCache = {
      totalEstabelecimentos: merchantsStats?.totalEstabelecimentos || 0,
      totalTransacoes: transactionsStats?.totalTransacoes || 0,
      totalBruto: transactionsStats?.totalBruto || 0,
      totalLucro: profitStats?.totalLucro || 0,
      topMerchants: topMerchants,
      lastUpdate: new Date()
    };
    
    lastCacheUpdate = new Date();
    console.log("Cache do dashboard atualizado em:", lastCacheUpdate);
    
    return dashboardCache;
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
    return { success: true, message: "Dashboard atualizado com sucesso" };
  } catch (error) {
    console.error("Erro ao atualizar dashboard:", error);
    return { success: false, message: "Erro ao atualizar dashboard" };
  }
}

// Obter todas as estatísticas necessárias para o dashboard em uma única função
export async function getDashboardData() {
  try {
    console.log("Iniciando getDashboardData para o ISO");
    
    // Verificar se temos cache válido
    const now = new Date();
    if (
      dashboardCache &&
      lastCacheUpdate && 
      (now.getTime() - lastCacheUpdate.getTime() < CACHE_TTL_MS)
    ) {
      console.log("Retornando dados do cache (última atualização:", lastCacheUpdate, ")");
      return dashboardCache;
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
    console.error("Erro ao obter dados do dashboard do ISO:", error);
    console.error(error);
    
    // Retornar dados do cache mesmo expirado em caso de erro
    if (dashboardCache) {
      console.log("Retornando cache expirado devido a erro");
      return dashboardCache;
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