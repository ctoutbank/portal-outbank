"use server";

import { db } from "@/db/drizzle";
import { and, count, eq, gte, lt, sql } from "drizzle-orm";
import { merchants, payout, transactions, customers } from "../../../drizzle/schema";

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

// Obter o total e contagem de estabelecimentos
export async function getMerchantsStats() {
  try {
    const merchantsCount = await db
      .select({ count: count() })
      .from(merchants);

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

// Obter o total e contagem de transações
export async function getTransactionsStats() {
  try {
    const transactionsCount = await db
      .select({ count: count() })
      .from(transactions);

    const transactionsTotal = await db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.totalAmount}), 0)`
      })
      .from(transactions);

    return {
      totalTransacoes: transactionsCount[0]?.count || 0,
      totalBruto: Number(transactionsTotal[0]?.total || 0)
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas de transações:", error);
    return {
      totalTransacoes: 0,
      totalBruto: 0
    };
  }
}

// Obter o total de lucro (baseado em payouts)
export async function getProfit() {
  try {
    const profitResult = await db
      .select({
        totalLucro: sql<number>`COALESCE(SUM(
          ${payout.transactionMdrFee} + ${payout.transactionFee}
        ), 0)`
      })
      .from(payout);

    return {
      totalLucro: Number(profitResult[0]?.totalLucro || 0)
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas de lucro:", error);
    return {
      totalLucro: 0
    };
  }
}

// Obter os 10 principais customers (ou todos, se houver menos de 10)
export async function getTopCustomers(): Promise<CustomerData[]> {
  try {
    console.log("Iniciando consulta getTopCustomers");
    
    // Data atual e datas para períodos de comparação
    const currentDate = new Date();
    
    // Período atual (últimos 30 dias)
    const currentPeriodStart = new Date(currentDate);
    currentPeriodStart.setDate(currentDate.getDate() - 30);
    
    // Período anterior (30 dias antes do período atual)
    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);
    
    // Primeiro, obter todos os customers, mesmo os sem transações
    const allCustomers = await db
      .select({
        id: customers.id,
        name: customers.name,
        customerId: customers.customerId
      })
      .from(customers)
      .limit(100); // Limitamos a 100 para evitar possíveis problemas de desempenho
    
    console.log(`Encontrados ${allCustomers.length} customers no total`);
    
    // Para cada customer, calcular o total de transações e lucro nos dois períodos
    const customersWithStats = await Promise.all(
      allCustomers.map(async (customer) => {
        try {
          // Buscar transações para este customer no período atual
          const currentPeriodStats = await db
            .select({
              totalAmount: sql<number>`COALESCE(SUM(${payout.installmentAmount}), 0)`,
              totalProfit: sql<number>`COALESCE(SUM(${payout.transactionMdrFee} + ${payout.transactionFee}), 0)`
            })
            .from(payout)
            .where(
              and(
                eq(payout.idCustomer, customer.id),
                gte(payout.transactionDate, currentPeriodStart.toISOString()),
                lt(payout.transactionDate, currentDate.toISOString())
              )
            );
          
          // Buscar transações para este customer no período anterior
          const previousPeriodStats = await db
            .select({
              totalAmount: sql<number>`COALESCE(SUM(${payout.installmentAmount}), 0)`,
              totalProfit: sql<number>`COALESCE(SUM(${payout.transactionMdrFee} + ${payout.transactionFee}), 0)`
            })
            .from(payout)
            .where(
              and(
                eq(payout.idCustomer, customer.id),
                gte(payout.transactionDate, previousPeriodStart.toISOString()),
                lt(payout.transactionDate, currentPeriodStart.toISOString())
              )
            );
            
          // Extrair os valores
          const currentAmount = Number(currentPeriodStats[0]?.totalAmount || 0);
          const previousAmount = Number(previousPeriodStats[0]?.totalAmount || 0);
          
          // Calcular o crescimento (evitar divisão por zero)
          let crescimento = 0;
          if (previousAmount > 0) {
            crescimento = ((currentAmount - previousAmount) / previousAmount) * 100;
          } else if (currentAmount > 0) {
            crescimento = 100; // Se não havia vendas antes, mas há agora, consideramos 100% de crescimento
          }
          
          // Formatar para sempre ter pelo menos 1 casa decimal
          crescimento = parseFloat(crescimento.toFixed(1));
          
          return {
            id: customer.id,
            name: customer.name || customer.customerId || `Customer ID ${customer.id}`,
            bruto: currentAmount,
            lucro: Number(currentPeriodStats[0]?.totalProfit || 0),
            crescimento: crescimento
          };
        } catch (error) {
          console.error(`Erro ao processar estatísticas para o customer ${customer.id}:`, error);
          return {
            id: customer.id,
            name: customer.name || customer.customerId || `Customer ID ${customer.id}`,
            bruto: 0,
            lucro: 0,
            crescimento: 0
          };
        }
      })
    );
    
    // Ordenar por bruto em ordem decrescente e pegar os 10 primeiros
    const topCustomers = customersWithStats
      .sort((a, b) => b.bruto - a.bruto)
      .slice(0, 10);
    
    console.log(`Retornando ${topCustomers.length} customers para o dashboard`);
    
    return topCustomers;
  } catch (error) {
    console.error("Erro ao buscar os principais customers:", error);
    return [];
  }
}

// Obter os 10 principais merchants (ou todos, se houver menos de 10)
export async function getTopMerchants(): Promise<MerchantData[]> {
  try {
    console.log("Iniciando consulta getTopMerchants");
    
    // Data atual e datas para períodos de comparação
    const currentDate = new Date();
    
    // Período atual (últimos 30 dias)
    const currentPeriodStart = new Date(currentDate);
    currentPeriodStart.setDate(currentDate.getDate() - 30);
    
    // Período anterior (30 dias antes do período atual)
    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);
    
    // Primeiro, obter todos os merchants, mesmo os sem transações
    const allMerchants = await db
      .select({
        id: merchants.id,
        name: merchants.name,
        corporateName: merchants.corporateName
      })
      .from(merchants)
      .limit(100); // Limitamos a 100 para evitar possíveis problemas de desempenho
    
    console.log(`Encontrados ${allMerchants.length} merchants no total`);
    
    // Para cada merchant, calcular o total de transações e lucro nos dois períodos
    const merchantsWithStats = await Promise.all(
      allMerchants.map(async (merchant) => {
        try {
          // Buscar transações para este merchant no período atual
          const currentPeriodStats = await db
            .select({
              totalAmount: sql<number>`COALESCE(SUM(${payout.installmentAmount}), 0)`,
              totalProfit: sql<number>`COALESCE(SUM(${payout.transactionMdrFee} + ${payout.transactionFee}), 0)`
            })
            .from(payout)
            .where(
              and(
                eq(payout.idMerchant, merchant.id),
                gte(payout.transactionDate, currentPeriodStart.toISOString()),
                lt(payout.transactionDate, currentDate.toISOString())
              )
            );
          
          // Buscar transações para este merchant no período anterior
          const previousPeriodStats = await db
            .select({
              totalAmount: sql<number>`COALESCE(SUM(${payout.installmentAmount}), 0)`,
              totalProfit: sql<number>`COALESCE(SUM(${payout.transactionMdrFee} + ${payout.transactionFee}), 0)`
            })
            .from(payout)
            .where(
              and(
                eq(payout.idMerchant, merchant.id),
                gte(payout.transactionDate, previousPeriodStart.toISOString()),
                lt(payout.transactionDate, currentPeriodStart.toISOString())
              )
            );
            
          // Extrair os valores
          const currentAmount = Number(currentPeriodStats[0]?.totalAmount || 0);
          const previousAmount = Number(previousPeriodStats[0]?.totalAmount || 0);
          
          // Calcular o crescimento (evitar divisão por zero)
          let crescimento = 0;
          if (previousAmount > 0) {
            crescimento = ((currentAmount - previousAmount) / previousAmount) * 100;
          } else if (currentAmount > 0) {
            crescimento = 100; // Se não havia vendas antes, mas há agora, consideramos 100% de crescimento
          }
          
          // Formatar para sempre ter pelo menos 1 casa decimal
          crescimento = parseFloat(crescimento.toFixed(1));
          
          return {
            id: merchant.id,
            name: merchant.name || merchant.corporateName || `Merchant ID ${merchant.id}`,
            bruto: currentAmount,
            lucro: Number(currentPeriodStats[0]?.totalProfit || 0),
            crescimento: crescimento
          };
        } catch (error) {
          console.error(`Erro ao processar estatísticas para o merchant ${merchant.id}:`, error);
          return {
            id: merchant.id,
            name: merchant.name || merchant.corporateName || `Merchant ID ${merchant.id}`,
            bruto: 0,
            lucro: 0,
            crescimento: 0
          };
        }
      })
    );
    
    // Filtrar merchants sem transações, se necessário (opcional)
    // const merchantsWithTransactions = merchantsWithStats.filter(m => m.bruto > 0);
    
    // Ordenar por bruto em ordem decrescente e pegar os 10 primeiros
    const topMerchants = merchantsWithStats
      .sort((a, b) => b.bruto - a.bruto)
      .slice(0, 10);
    
    console.log(`Retornando ${topMerchants.length} merchants para o dashboard`);
    
    return topMerchants;
  } catch (error) {
    console.error("Erro ao buscar os principais merchants:", error);
    return [];
  }
}

// Obter todas as estatísticas necessárias para o dashboard em uma única função
export async function getDashboardData() {
  try {
    console.log("Iniciando getDashboardData");
    
    // Executar todas as consultas em paralelo para melhor performance
    const [merchantsStats, transactionsStats, profitStats, topCustomers] = await Promise.all([
      getMerchantsStats(),
      getTransactionsStats(),
      getProfit(),
      getTopCustomers() // Agora usando a função getTopCustomers em vez de getTopMerchants
    ]);
    
    console.log("Dados do dashboard carregados com sucesso");

    return {
      totalEstabelecimentos: merchantsStats?.totalEstabelecimentos || 0,
      totalTransacoes: transactionsStats?.totalTransacoes || 0,
      totalBruto: transactionsStats?.totalBruto || 0,
      totalLucro: profitStats?.totalLucro || 0,
      topCustomers: topCustomers // Agora usando dados de clientes (customers) em vez de estabelecimentos (merchants)
    };
  } catch (error) {
    console.error("Erro ao obter dados do dashboard:", error);
    // Retornar dados padrão em caso de falha
    return {
      totalEstabelecimentos: 0,
      totalTransacoes: 0,
      totalBruto: 0,
      totalLucro: 0,
      topCustomers: []
    };
  }
} 