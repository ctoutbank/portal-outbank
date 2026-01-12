"use server";

import { getUserMerchantsAccess } from "@/features/users/server/users";
import { getDateUTC } from "@/lib/datetime-utils";
import {
  and,
  count,
  eq,
  gte,
  inArray,
  lte,
  sql,
} from "drizzle-orm";
import {
  merchants,
  transactions,
  customers,
} from "../../../../drizzle/schema";
import { db } from "@/lib/db";
import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";
import { isSuperAdmin } from "@/lib/permissions/check-permissions";
import { DateTime } from "luxon";

// Types
export type AnalyticsKPIs = {
  totalTransacoes: number;
  totalValor: number;
  valorMedio: number;
  taxaAprovacao: number;
  taxaNegacao: number;
  periodoAnterior?: {
    totalTransacoes: number;
    totalValor: number;
    valorMedio: number;
    taxaAprovacao: number;
    taxaNegacao: number;
  };
};

export type TimeSeriesDataPoint = {
  period: string;
  totalTransacoes: number;
  totalValor: number;
  valorMedio: number;
};

export type DimensionData = {
  dimension: string;
  totalTransacoes: number;
  totalValor: number;
  percentual: number;
};

export type CustomerComparison = {
  customerId: number;
  customerName: string | null;
  totalTransacoes: number;
  totalValor: number;
  valorMedio: number;
  taxaAprovacao: number;
};

export type MerchantTop = {
  merchantName: string | null;
  totalTransacoes: number;
  totalValor: number;
};

// Helper function to build base conditions
async function buildBaseConditions(
  dateFrom?: string,
  dateTo?: string,
  customerIds?: number[]
): Promise<any[] | null> {
  try {
    const userAccess = await getUserMerchantsAccess();

    if (!userAccess.fullAccess && userAccess.idMerchants.length === 0) {
      return null;
    }

    const conditions = [];

    // Date filters
    if (dateFrom) {
      try {
        const dateFromUTC = getDateUTC(dateFrom, "America/Sao_Paulo");
        if (dateFromUTC) conditions.push(gte(transactions.dtInsert, dateFromUTC));
      } catch (error) {
        console.error("Erro ao converter dateFrom:", error);
      }
    }

    if (dateTo) {
      try {
        const dateToUTC = getDateUTC(dateTo, "America/Sao_Paulo");
        if (dateToUTC) conditions.push(lte(transactions.dtInsert, dateToUTC));
      } catch (error) {
        console.error("Erro ao converter dateTo:", error);
      }
    }

    // Customer filter
    if (customerIds && customerIds.length > 0) {
      try {
        const customerSlugs = await db
          .select({ slug: customers.slug })
          .from(customers)
          .where(inArray(customers.id, customerIds));
        
        if (customerSlugs.length > 0) {
          const slugs = customerSlugs.map((c) => c.slug).filter((slug): slug is string => slug !== null);
          if (slugs.length > 0) {
            conditions.push(inArray(transactions.slugCustomer, slugs));
          }
        }
      } catch (error) {
        console.error("Erro ao buscar customer slugs:", error);
      }
    } else if (!userAccess.fullAccess && userAccess.idCustomer) {
      // Se não tem fullAccess, filtrar pelo customer do usuário
      try {
        const customer = await db
          .select({ slug: customers.slug })
          .from(customers)
          .where(eq(customers.id, userAccess.idCustomer))
          .limit(1);
        
        if (customer.length > 0 && customer[0].slug) {
          conditions.push(eq(transactions.slugCustomer, customer[0].slug));
        }
      } catch (error) {
        console.error("Erro ao buscar customer do usuário:", error);
      }
    }

    // User access filters
    if (!userAccess.fullAccess && userAccess.idMerchants.length > 0) {
      conditions.push(inArray(merchants.id, userAccess.idMerchants));
    }

    // Join with merchants for access control
    return conditions;
  } catch (error) {
    console.error("Erro em buildBaseConditions:", error);
    return null;
  }
}

// Helper to calculate period before
function getPreviousPeriod(dateFrom: string, dateTo: string): { from: string; to: string } {
  try {
    const from = DateTime.fromISO(dateFrom);
    const to = DateTime.fromISO(dateTo);
    
    if (!from.isValid || !to.isValid) {
      return { from: dateFrom, to: dateTo };
    }
    
    const diff = to.diff(from, "days").days;
    
    if (isNaN(diff) || diff < 0) {
      return { from: dateFrom, to: dateTo };
    }
    
    const prevTo = from.minus({ days: 1 });
    const prevFrom = prevTo.minus({ days: diff });
    
    return {
      from: prevFrom.isValid ? (prevFrom.toISO() || dateFrom) : dateFrom,
      to: prevTo.isValid ? (prevTo.toISO() || dateTo) : dateTo,
    };
  } catch (error) {
    console.error("Erro em getPreviousPeriod:", error);
    return { from: dateFrom, to: dateTo };
  }
}

/**
 * Get Analytics KPIs
 */
export async function getAnalyticsKPIs(
  dateFrom: string,
  dateTo: string,
  customerIds?: number[]
): Promise<AnalyticsKPIs> {
  try {
    const conditions = await buildBaseConditions(dateFrom, dateTo, customerIds);
    
    if (conditions === null) {
      return {
        totalTransacoes: 0,
        totalValor: 0,
        valorMedio: 0,
        taxaAprovacao: 0,
        taxaNegacao: 0,
      };
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Main query
  const result = await db
    .select({
      totalTransacoes: count(),
      totalValor: sql<number>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
      totalAprovadas: sql<number>`COUNT(CASE WHEN ${transactions.transactionStatus} = 'AUTHORIZED' THEN 1 END)`,
      totalNegadas: sql<number>`COUNT(CASE WHEN ${transactions.transactionStatus} = 'DENIED' THEN 1 END)`,
    })
    .from(transactions)
    .innerJoin(merchants, eq(transactions.slugMerchant, merchants.slug))
    .where(whereClause);

  const data = result[0];
  const totalTransacoes = data?.totalTransacoes || 0;
  const totalValor = Number(data?.totalValor || 0);
  const totalAprovadas = data?.totalAprovadas || 0;
  const totalNegadas = data?.totalNegadas || 0;
  
  const valorMedio = totalTransacoes > 0 ? totalValor / totalTransacoes : 0;
  const taxaAprovacao = totalTransacoes > 0 ? (totalAprovadas / totalTransacoes) * 100 : 0;
  const taxaNegacao = totalTransacoes > 0 ? (totalNegadas / totalTransacoes) * 100 : 0;

  // Get previous period data
  const prevPeriod = getPreviousPeriod(dateFrom, dateTo);
  const prevConditions = await buildBaseConditions(prevPeriod.from, prevPeriod.to, customerIds);
  const prevWhereClause = prevConditions && prevConditions.length ? and(...prevConditions) : undefined;

  let periodoAnterior;
  if (prevWhereClause) {
    const prevResult = await db
      .select({
        totalTransacoes: count(),
        totalValor: sql<number>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
        totalAprovadas: sql<number>`COUNT(CASE WHEN ${transactions.transactionStatus} = 'AUTHORIZED' THEN 1 END)`,
        totalNegadas: sql<number>`COUNT(CASE WHEN ${transactions.transactionStatus} = 'DENIED' THEN 1 END)`,
      })
      .from(transactions)
      .innerJoin(merchants, eq(transactions.slugMerchant, merchants.slug))
      .where(prevWhereClause);

    const prevData = prevResult[0];
    const prevTotalTransacoes = prevData?.totalTransacoes || 0;
    const prevTotalValor = Number(prevData?.totalValor || 0);
    const prevTotalAprovadas = prevData?.totalAprovadas || 0;
    const prevTotalNegadas = prevData?.totalNegadas || 0;
    
    const prevValorMedio = prevTotalTransacoes > 0 ? prevTotalValor / prevTotalTransacoes : 0;
    const prevTaxaAprovacao = prevTotalTransacoes > 0 ? (prevTotalAprovadas / prevTotalTransacoes) * 100 : 0;
    const prevTaxaNegacao = prevTotalTransacoes > 0 ? (prevTotalNegadas / prevTotalTransacoes) * 100 : 0;

    periodoAnterior = {
      totalTransacoes: prevTotalTransacoes,
      totalValor: prevTotalValor,
      valorMedio: prevValorMedio,
      taxaAprovacao: prevTaxaAprovacao,
      taxaNegacao: prevTaxaNegacao,
    };
  }

    return {
      totalTransacoes,
      totalValor,
      valorMedio,
      taxaAprovacao,
      taxaNegacao,
      periodoAnterior,
    };
  } catch (error) {
    console.error("Erro em getAnalyticsKPIs:", error);
    return {
      totalTransacoes: 0,
      totalValor: 0,
      valorMedio: 0,
      taxaAprovacao: 0,
      taxaNegacao: 0,
    };
  }
}

/**
 * Get Analytics Time Series
 */
export async function getAnalyticsTimeSeries(
  dateFrom: string,
  dateTo: string,
  groupBy: "day" | "week" | "month" = "day",
  customerIds?: number[]
): Promise<TimeSeriesDataPoint[]> {
  try {
    const conditions = await buildBaseConditions(dateFrom, dateTo, customerIds);
    
    if (conditions === null) {
      return [];
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Determine date format based on groupBy
  let periodSql: ReturnType<typeof sql>;
  switch (groupBy) {
    case "day":
      periodSql = sql<string>`TO_CHAR(${transactions.dtInsert}, 'YYYY-MM-DD')`;
      break;
    case "week":
      periodSql = sql<string>`TO_CHAR(${transactions.dtInsert}, 'IYYY-IW')`;
      break;
    case "month":
      periodSql = sql<string>`TO_CHAR(${transactions.dtInsert}, 'YYYY-MM')`;
      break;
    default:
      periodSql = sql<string>`TO_CHAR(${transactions.dtInsert}, 'YYYY-MM-DD')`;
  }

  const result = await db
    .select({
      period: periodSql,
      totalTransacoes: count(),
      totalValor: sql<number>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
    })
    .from(transactions)
    .innerJoin(merchants, eq(transactions.slugMerchant, merchants.slug))
    .where(whereClause)
    .groupBy(periodSql)
    .orderBy(periodSql);

    return result.map((item): TimeSeriesDataPoint => ({
      period: String(item.period || ""),
      totalTransacoes: item.totalTransacoes,
      totalValor: Number(item.totalValor || 0),
      valorMedio: item.totalTransacoes > 0 ? Number(item.totalValor || 0) / item.totalTransacoes : 0,
    }));
  } catch (error) {
    console.error("Erro em getAnalyticsTimeSeries:", error);
    return [];
  }
}

/**
 * Get Analytics by Dimension
 */
export async function getAnalyticsByDimension(
  dimension: "brand" | "productType" | "transactionStatus" | "salesChannel" | "methodType",
  dateFrom: string,
  dateTo: string,
  customerIds?: number[]
): Promise<DimensionData[]> {
  try {
    const conditions = await buildBaseConditions(dateFrom, dateTo, customerIds);
    
    if (conditions === null) {
      return [];
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Map dimension to column
  const dimensionMap: Record<string, any> = {
    brand: transactions.brand,
    productType: transactions.productType,
    transactionStatus: transactions.transactionStatus,
    salesChannel: transactions.salesChannel,
    methodType: transactions.methodType,
  };

  const dimensionColumn = dimensionMap[dimension];
  if (!dimensionColumn) {
    return [];
  }

  // Get total for percentage calculation
  const totalResult = await db
    .select({
      total: count(),
    })
    .from(transactions)
    .innerJoin(merchants, eq(transactions.slugMerchant, merchants.slug))
    .where(whereClause);

  const total = totalResult[0]?.total || 1; // Avoid division by zero

  // Get dimension breakdown
  const result = await db
    .select({
      dimension: dimensionColumn,
      totalTransacoes: count(),
      totalValor: sql<number>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
    })
    .from(transactions)
    .innerJoin(merchants, eq(transactions.slugMerchant, merchants.slug))
    .where(whereClause)
    .groupBy(dimensionColumn)
    .orderBy(sql`count(*) DESC`);

    return result.map((item) => ({
      dimension: item.dimension || "N/A",
      totalTransacoes: item.totalTransacoes,
      totalValor: Number(item.totalValor || 0),
      percentual: total > 0 ? (item.totalTransacoes / total) * 100 : 0,
    }));
  } catch (error) {
    console.error("Erro em getAnalyticsByDimension:", error);
    return [];
  }
}

/**
 * Get Analytics by Customer (ISO comparison)
 */
export async function getAnalyticsByCustomer(
  dateFrom: string,
  dateTo: string,
  customerIds?: number[]
): Promise<CustomerComparison[]> {
  try {
    const conditions = await buildBaseConditions(dateFrom, dateTo, customerIds);
    
    if (conditions === null) {
      return [];
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get customer breakdown
  const result = await db
    .select({
      customerId: customers.id,
      customerName: customers.name,
      totalTransacoes: count(),
      totalValor: sql<number>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
      totalAprovadas: sql<number>`COUNT(CASE WHEN ${transactions.transactionStatus} = 'AUTHORIZED' THEN 1 END)`,
    })
    .from(transactions)
    .innerJoin(merchants, eq(transactions.slugMerchant, merchants.slug))
    .leftJoin(customers, eq(transactions.slugCustomer, customers.slug))
    .where(whereClause)
    .groupBy(customers.id, customers.name)
    .orderBy(sql`count(*) DESC`);

    return result.map((item) => ({
      customerId: item.customerId || 0,
      customerName: item.customerName,
      totalTransacoes: item.totalTransacoes,
      totalValor: Number(item.totalValor || 0),
      valorMedio: item.totalTransacoes > 0 ? Number(item.totalValor || 0) / item.totalTransacoes : 0,
      taxaAprovacao: item.totalTransacoes > 0 ? (item.totalAprovadas / item.totalTransacoes) * 100 : 0,
    }));
  } catch (error) {
    console.error("Erro em getAnalyticsByCustomer:", error);
    return [];
  }
}

/**
 * Get Analytics by Merchant (Top merchants)
 */
export async function getAnalyticsByMerchant(
  dateFrom: string,
  dateTo: string,
  customerIds?: number[],
  limit: number = 10
): Promise<MerchantTop[]> {
  try {
    const conditions = await buildBaseConditions(dateFrom, dateTo, customerIds);
    
    if (conditions === null) {
      return [];
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({
      merchantName: transactions.merchantName,
      totalTransacoes: count(),
      totalValor: sql<number>`COALESCE(SUM(${transactions.totalAmount}), 0)`,
    })
    .from(transactions)
    .innerJoin(merchants, eq(transactions.slugMerchant, merchants.slug))
    .where(whereClause)
    .groupBy(transactions.merchantName)
    .orderBy(sql`totalValor DESC`)
    .limit(limit);

    return result.map((item) => ({
      merchantName: item.merchantName,
      totalTransacoes: item.totalTransacoes,
      totalValor: Number(item.totalValor || 0),
    }));
  } catch (error) {
    console.error("Erro em getAnalyticsByMerchant:", error);
    return [];
  }
}

