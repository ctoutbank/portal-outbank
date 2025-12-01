"use server";

import { getUserMerchantsAccess } from "@/features/users/server/users";
import { getDateUTC } from "@/lib/datetime-utils";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  like,
  lte,
  sql,
} from "drizzle-orm";
import {
  merchants,
  terminals,
  transactions,
} from "../../../../drizzle/schema";
import { db } from "@/lib/db";

export type Transaction = typeof transactions.$inferSelect;
export type TransactionsListRecord = {
  slug: string;
  dtInsert: string | null;
  nsu: string | null;
  id: string;
  merchantName: string | null;
  merchantCNPJ: string | null;
  terminalType: string | null;
  terminalLogicalNumber: string | null;
  method: string | null;
  salesChannel: string | null;
  productType: string | null;
  brand: string | null;
  transactionStatus: string | null;
  amount: number | null;
  feeAdmin: number | null;
  transactionMdr: number | null;
  lucro: number | null;
  repasse: number | null;
};
export type TransactionsList = {
  transactions: TransactionsListRecord[];
  totalCount: number;
};

export type MerchantTotal = {
  total: number;
};

export async function getTransactions(
  page: number = 1,
  pageSize: number = 10,
  status?: string,
  merchant?: string,
  dateFrom?: string,
  dateTo?: string,
  productType?: string,
  brand?: string,
  nsu?: string,
  method?: string,
  salesChannel?: string,
  terminal?: string,
  valueMin?: string,
  valueMax?: string,
  sorting?: {
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }
): Promise<TransactionsList> {
  const userAccess = await getUserMerchantsAccess();

  if (!userAccess.fullAccess && userAccess.idMerchants.length === 0) {
    return {
      transactions: [],
      totalCount: 0,
    };
  }

  // 1. Build conditions array
  const conditions = await buildConditions({
    status,
    merchant,
    dateFrom,
    dateTo,
    productType,
    brand,
    nsu,
    method,
    salesChannel,
    terminal,
    valueMin,
    valueMax,
    userMerchants: userAccess.idMerchants,
    customerId: userAccess.idCustomer,
  });

  if (conditions === null) {
    return { transactions: [], totalCount: 0 };
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  // 2. Use Promise.all para executar consultas em paralelo quando possível
  const [transactionList, totalCount] = await Promise.all([
    getTransactionData(whereClause, page, pageSize, sorting),
    page !== -1 ? getTotalCount(whereClause) : Promise.resolve(0),
  ]);

  // 3. Process results
  const result = processTransactionResults(transactionList);

  return {
    transactions: result,
    totalCount: page !== -1 ? totalCount : result.length,
  };
}

// Helper function to build conditions
async function buildConditions(params: {
  status?: string;
  merchant?: string;
  dateFrom?: string;
  dateTo?: string;
  productType?: string;
  brand?: string;
  nsu?: string;
  method?: string;
  salesChannel?: string;
  terminal?: string;
  valueMin?: string;
  valueMax?: string;
  userMerchants?: number[];
  customerId?: number | null;
}): Promise<any[] | null> {
  const conditions = [];

  // Status filter - optimized to avoid unnecessary split
  if (params.status) {
    if (params.status.includes(",")) {
      const statusValues = params.status.split(",").map((s) => s.trim());
      conditions.push(inArray(transactions.transactionStatus, statusValues));
    } else {
      conditions.push(eq(transactions.transactionStatus, params.status));
    }
  }

  // Merchant filter
  if (params.merchant) {
    conditions.push(ilike(transactions.merchantName, `%${params.merchant}%`));
  }

  // Date filters - cache UTC dates
  if (params.dateFrom) {
    const dateFromUTC = getDateUTC(params.dateFrom, "America/Sao_Paulo");
    if (dateFromUTC) conditions.push(gte(transactions.dtInsert, dateFromUTC));
  }

  if (params.dateTo) {
    const dateToUTC = getDateUTC(params.dateTo, "America/Sao_Paulo");
    if (dateToUTC) conditions.push(lte(transactions.dtInsert, dateToUTC));
  }

  // Product type filter
  if (params.productType) {
    if (params.productType.includes(",")) {
      const values = params.productType.split(",").map((v) => v.trim());
      conditions.push(inArray(transactions.productType, values));
    } else {
      conditions.push(eq(transactions.productType, params.productType));
    }
  }

  // Brand filter
  if (params.brand) {
    if (params.brand.includes(",")) {
      const values = params.brand.split(",").map((v) => v.trim());
      conditions.push(inArray(transactions.brand, values));
    } else {
      conditions.push(eq(transactions.brand, params.brand));
    }
  }

  // NSU filter
  if (params.nsu) {
    conditions.push(eq(transactions.muid, params.nsu));
  }

  // Method filter
  if (params.method) {
    if (params.method.includes(",")) {
      const values = params.method.split(",").map((v) => v.trim());
      conditions.push(inArray(transactions.methodType, values));
    } else {
      conditions.push(eq(transactions.methodType, params.method));
    }
  }

  // Sales channel filter
  if (params.salesChannel) {
    if (params.salesChannel.includes(",")) {
      const values = params.salesChannel.split(",").map((v) => v.trim());
      conditions.push(inArray(transactions.salesChannel, values));
    } else {
      conditions.push(eq(transactions.salesChannel, params.salesChannel));
    }
  }

  // Terminal filter
  if (params.terminal) {
    conditions.push(like(terminals.logicalNumber, `%${params.terminal}%`));
  }

  // Value filters
  if (params.valueMin) {
    conditions.push(gte(transactions.totalAmount, params.valueMin));
  }

  if (params.valueMax) {
    conditions.push(lte(transactions.totalAmount, params.valueMax));
  }

  // User access filters
  if (params.userMerchants && params.userMerchants.length > 0) {
    conditions.push(inArray(merchants.id, params.userMerchants));
  }

  if (params.customerId) {
    conditions.push(eq(merchants.idCustomer, params.customerId));
  }

  return conditions;
}

async function getTransactionData(
  whereClause: any,
  page: number,
  pageSize: number,
  sorting?: {
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }
) {
  try {
    const sortFieldMap: Record<string, any> = {
      dtInsert: transactions.dtInsert,
      nsu: transactions.muid,
      merchantName: merchants.name,
      merchantCNPJ: merchants.idDocument,
      terminalType: terminals.type,
      terminalLogicalNumber: terminals.logicalNumber,
      method: transactions.methodType,
      salesChannel: transactions.salesChannel,
      productType: transactions.productType,
      brand: transactions.brand,
      transactionStatus: transactions.transactionStatus,
      amount: transactions.totalAmount,
    };

    const sortBy = sorting?.sortBy || "dtInsert";
    const sortOrder = sorting?.sortOrder || "desc";
    const sortField = sortFieldMap[sortBy] || transactions.dtInsert;
    const orderByClause =
      sortOrder === "asc" ? asc(sortField) : desc(sortField);

    // Consulta simplificada para evitar problemas de sintaxe
    const baseQuery = db
      .select({
        slug: transactions.slug,
        dateInsert: transactions.dtInsert,
        nsu: transactions.muid,
        merchantName: merchants.name,
        merchantCNPJ: merchants.idDocument,
        terminalType: terminals.type,
        terminalLogicalNumber: terminals.logicalNumber,
        method: transactions.methodType,
        salesChannel: transactions.salesChannel,
        productType: transactions.productType,
        brand: transactions.brand,
        transactionStatus: transactions.transactionStatus,
        amount: transactions.totalAmount,
        feeAdmin: sql<number>`0`, // Valor padrão por enquanto
        transactionMdr: sql<number>`0`, // Valor padrão por enquanto
      })
      .from(transactions)
      .innerJoin(merchants, eq(transactions.slugMerchant, merchants.slug))
      .leftJoin(terminals, eq(transactions.slugTerminal, terminals.slug))
      .where(whereClause)
      .orderBy(orderByClause);

    const result =
      page === -1
        ? await baseQuery
        : await baseQuery.limit(pageSize).offset((page - 1) * pageSize);

    return result;
  } catch (error) {
    console.error("Erro em getTransactionData:", error);
    throw error;
  }
}

// Função separada para contar total
async function getTotalCount(whereClause: any): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(transactions)
      .innerJoin(merchants, eq(transactions.slugMerchant, merchants.slug))
      .where(whereClause);

    return result[0].count;
  } catch (error) {
    console.error("Erro em getTotalCount:", error);
    throw error;
  }
}

// Função para processar resultados
function processTransactionResults(transactionList: any[]) {
  const result = transactionList.map((item) => {
    // 6. Otimização de parseFloat - evitar conversão desnecessária
    const amount = item.amount ? Number(item.amount) : null;
    const feeAdmin = item.feeAdmin ? Number(item.feeAdmin) : null;
    const transactionMdr = item.transactionMdr
      ? Number(item.transactionMdr)
      : null;

    // 7. Cálculos otimizados
    let lucro = null;
    let repasse = null;

    if (transactionMdr !== null && feeAdmin !== null) {
      lucro = transactionMdr - feeAdmin;
      if (amount !== null) {
        repasse = lucro * amount;
      }
    }

    return {
      slug: item.slug,
      dtInsert: item.dateInsert ?? null,
      nsu: item.nsu ?? null,
      id: item.nsu ?? "",
      merchantName: item.merchantName ?? null,
      merchantCNPJ: item.merchantCNPJ ?? null,
      terminalType: item.terminalType ?? null,
      terminalLogicalNumber: item.terminalLogicalNumber ?? null,
      method: item.method ?? null,
      salesChannel: item.salesChannel ?? null,
      productType: item.productType ?? null,
      brand: item.brand ?? null,
      transactionStatus: item.transactionStatus ?? null,
      amount,
      feeAdmin,
      transactionMdr,
      lucro,
      repasse,
    };
  });

  return result;
}

export type TransactionsGroupedReport = {
  product_type: string;
  brand: string;
  count: number;
  total_amount: number;
  transaction_status: string;
  date: string;
};

export async function getTransactionsGroupedReport(
  dateFrom: string,
  dateTo: string,
  status?: string,
  productType?: string,
  brand?: string,
  method?: string,
  salesChannel?: string,
  terminal?: string,
  valueMin?: string,
  valueMax?: string,
  merchant?: string
): Promise<TransactionsGroupedReport[]> {
  const userAccess = await getUserMerchantsAccess();

  if (!userAccess.fullAccess && userAccess.idMerchants.length === 0) {
    return [];
  }

  try {
    // Construir condições dinâmicas para a consulta SQL
    const conditions = [];

    // Adicionar condições de data (sempre presentes)
    if (dateFrom) {
      const dateFromUTC = getDateUTC(dateFrom, "America/Sao_Paulo");
      if (dateFromUTC) conditions.push(gte(transactions.dtInsert, dateFromUTC));
    }

    if (dateTo) {
      const dateToUTC = getDateUTC(dateTo, "America/Sao_Paulo");
      if (dateToUTC) conditions.push(lte(transactions.dtInsert, dateToUTC));
    }

    // Adicionar filtros condicionais opcionais
    if (status) {
      if (status.includes(",")) {
        const statusValues = status.split(",").map((s) => s.trim());
        conditions.push(inArray(transactions.transactionStatus, statusValues));
      } else {
        conditions.push(eq(transactions.transactionStatus, status));
      }
    }

    if (productType) {
      if (productType.includes(",")) {
        const productTypeValues = productType.split(",").map((p) => p.trim());
        conditions.push(inArray(transactions.productType, productTypeValues));
      } else {
        conditions.push(eq(transactions.productType, productType));
      }
    }

    if (brand) {
      if (brand.includes(",")) {
        const brandValues = brand.split(",").map((b) => b.trim());
        conditions.push(inArray(transactions.brand, brandValues));
      } else {
        conditions.push(eq(transactions.brand, brand));
      }
    }

    if (method) {
      if (method.includes(",")) {
        const methodValues = method.split(",").map((m) => m.trim());
        conditions.push(inArray(transactions.methodType, methodValues));
      } else {
        conditions.push(eq(transactions.methodType, method));
      }
    }

    if (salesChannel) {
      if (salesChannel.includes(",")) {
        const salesChannelValues = salesChannel.split(",").map((s) => s.trim());
        conditions.push(inArray(transactions.salesChannel, salesChannelValues));
      } else {
        conditions.push(eq(transactions.salesChannel, salesChannel));
      }
    }

    if (terminal) {
      conditions.push(like(terminals.logicalNumber, `%${terminal}%`));
    }

    // Adicionar filtros de valor
    if (valueMin) {
      conditions.push(gte(transactions.totalAmount, valueMin));
    }

    if (valueMax) {
      conditions.push(lte(transactions.totalAmount, valueMax));
    }

    if (merchant) {
      conditions.push(ilike(transactions.merchantName, `%${merchant}%`));
    }

    // Adicionar filtro de merchants se não tiver fullAccess
    if (!userAccess.fullAccess) {
      conditions.push(inArray(merchants.id, userAccess.idMerchants));
    }

    if (userAccess.idCustomer) {
      conditions.push(eq(merchants.idCustomer, userAccess.idCustomer));
    }

    // Construir a cláusula WHERE
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Consulta simplificada usando Drizzle ORM
    const result = await db
      .select({
        product_type: transactions.productType,
        brand: transactions.brand,
        count: count(),
        total_amount: sql<number>`SUM(${transactions.totalAmount})`,
        transaction_status: transactions.transactionStatus,
        date: sql<string>`DATE(${transactions.dtInsert} at time zone 'utc' at time zone 'America/Sao_Paulo')`,
      })
      .from(transactions)
      .leftJoin(terminals, eq(transactions.slugTerminal, terminals.slug))
      .innerJoin(merchants, eq(transactions.slugMerchant, merchants.slug))
      .where(whereClause)
      .groupBy(
        transactions.productType,
        transactions.brand,
        transactions.transactionStatus,
        sql`DATE(${transactions.dtInsert} at time zone 'utc' at time zone 'America/Sao_Paulo')`
      )
      .orderBy(
        sql`DATE(${transactions.dtInsert} at time zone 'utc' at time zone 'America/Sao_Paulo')`
      );

    return result as TransactionsGroupedReport[];
  } catch (error) {
    console.error("Erro em getTransactionsGroupedReport:", error);
    return [];
  }
}

