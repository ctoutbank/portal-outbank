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
  notInArray,
  sql,
} from "drizzle-orm";
import {
  merchants,
  terminals,
  transactions,
  customers,
  categories,
  solicitationFee,
  solicitationFeeBrand,
  solicitationBrandProductType,
  payout,
} from "../../../../drizzle/schema";
import { db } from "@/lib/db";
import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";
import { isSuperAdmin } from "@/lib/permissions/check-permissions";

export type Transaction = typeof transactions.$inferSelect;
export type TransactionsListRecord = {
  slug: string;
  dtInsert: string | null;
  nsu: string | null;
  id: string;
  merchantName: string | null;
  merchantCNPJ: string | null;
  customerName: string | null;
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

export type GetTotalTransactionsResult = {
  count: number;
  sum: number;
  revenue: number;
};

export type GetTotalTransactionsByMonthResult = {
  dayOfMonth?: number;
  date?: string;
  count: number;
  bruto: number;
  lucro: number;
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
  customer?: string,
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
    customer,
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
  customer?: string;
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

  // Customer filter (busca por nome do ISO)
  if (params.customer) {
    conditions.push(ilike(transactions.customerName, `%${params.customer}%`));
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
      customerName: transactions.customerName,
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
        customerName: transactions.customerName,
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
      customerName: item.customerName ?? null,
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

export async function normalizeDateRange(
  start: string,
  end: string
): Promise<{ start: string; end: string }> {
  // Normaliza o início para 'YYYY-MM-DDT00:00:00'
  const startDate = start.split("T")[0] + "T00:00:00";

  // Extrai a data final e adiciona 1 dia
  const endDatePart = end.split("T")[0];
  const date = new Date(endDatePart + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + 1);
  const nextDay = date.toISOString().split("T")[0];

  // Final fica como 'YYYY-MM-DDT23:59:59'
  const endDate = `${nextDay}T23:59:59`;
  return { start: startDate, end: endDate };
}

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
  merchant?: string,
  customer?: string
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

    if (customer) {
      conditions.push(ilike(transactions.customerName, `%${customer}%`));
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

/**
 * Obtém lista de ISOs disponíveis para filtro
 * Super Admin vê todos os ISOs ativos
 * Outros usuários veem apenas os ISOs aos quais têm acesso
 */
export async function getAvailableCustomersForTransactions(): Promise<Array<{ id: number; name: string | null }>> {
  const userInfo = await getCurrentUserInfo();
  
  if (!userInfo) {
    return [];
  }

  const isSuper = await isSuperAdmin();

  // Super Admin vê todos os ISOs ativos
  if (isSuper) {
    const result = await db
      .select({
        id: customers.id,
        name: customers.name,
      })
      .from(customers)
      .where(eq(customers.isActive, true))
      .orderBy(asc(customers.name));

    return result;
  }

  // Outros usuários veem apenas ISOs permitidos
  if (userInfo.allowedCustomers && userInfo.allowedCustomers.length > 0) {
    const result = await db
      .select({
        id: customers.id,
        name: customers.name,
      })
      .from(customers)
      .where(
        and(
          inArray(customers.id, userInfo.allowedCustomers),
          eq(customers.isActive, true)
        )
      )
      .orderBy(asc(customers.name));

    return result;
  }

  return [];
}

export type TransactionDetail = {
  slug: string;
  dtInsert: string | null;
  dtUpdate: string | null;
  nsu: string | null;
  merchantName: string | null;
  merchantCNPJ: string | null;
  merchantCorporateName: string | null;
  terminalType: string | null;
  terminalLogicalNumber: string | null;
  method: string | null;
  salesChannel: string | null;
  productType: string | null;
  brand: string | null;
  transactionStatus: string | null;
  amount: number | null;
  currency: string | null;
  rrn: string | null;
  firstDigits: string | null;
  lastDigits: string | null;
  productOrIssuer: string | null;
  settlementManagementType: string | null;
  cancelling: boolean | null;
  splitType: string | null;
  customerName: string | null;
  authorizerMerchantId: string | null;
};

export async function getTransactionBySlug(slug: string): Promise<TransactionDetail | null> {
  try {
    const userAccess = await getUserMerchantsAccess();

    if (!userAccess.fullAccess && userAccess.idMerchants.length === 0) {
      return null;
    }

    const conditions = [];

    // Filtro de acesso do usuário
    if (!userAccess.fullAccess) {
      conditions.push(inArray(merchants.id, userAccess.idMerchants));
    }

    if (userAccess.idCustomer) {
      conditions.push(eq(merchants.idCustomer, userAccess.idCustomer));
    }

    conditions.push(eq(transactions.slug, slug));

    const whereClause = conditions.length ? and(...conditions) : undefined;

    const result = await db
      .select({
        slug: transactions.slug,
        dtInsert: transactions.dtInsert,
        dtUpdate: transactions.dtUpdate,
        nsu: transactions.muid,
        merchantName: merchants.name,
        merchantCNPJ: merchants.idDocument,
        merchantCorporateName: transactions.merchantCorporateName,
        terminalType: terminals.type,
        terminalLogicalNumber: terminals.logicalNumber,
        method: transactions.methodType,
        salesChannel: transactions.salesChannel,
        productType: transactions.productType,
        brand: transactions.brand,
        transactionStatus: transactions.transactionStatus,
        amount: transactions.totalAmount,
        currency: transactions.currency,
        rrn: transactions.rrn,
        firstDigits: transactions.firstDigits,
        lastDigits: transactions.lastdigits,
        productOrIssuer: transactions.productorissuer,
        settlementManagementType: transactions.settlementmanagementtype,
        cancelling: transactions.cancelling,
        splitType: transactions.splitType,
        customerName: transactions.customerName,
        authorizerMerchantId: transactions.authorizerMerchantId,
      })
      .from(transactions)
      .innerJoin(merchants, eq(transactions.slugMerchant, merchants.slug))
      .leftJoin(terminals, eq(transactions.slugTerminal, terminals.slug))
      .where(whereClause)
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const transaction = result[0];
    
    return {
      slug: transaction.slug,
      dtInsert: transaction.dtInsert,
      dtUpdate: transaction.dtUpdate,
      nsu: transaction.nsu,
      merchantName: transaction.merchantName,
      merchantCNPJ: transaction.merchantCNPJ,
      merchantCorporateName: transaction.merchantCorporateName,
      terminalType: transaction.terminalType,
      terminalLogicalNumber: transaction.terminalLogicalNumber,
      method: transaction.method,
      salesChannel: transaction.salesChannel,
      productType: transaction.productType,
      brand: transaction.brand,
      transactionStatus: transaction.transactionStatus,
      amount: transaction.amount ? Number(transaction.amount) : null,
      currency: transaction.currency,
      rrn: transaction.rrn,
      firstDigits: transaction.firstDigits,
      lastDigits: transaction.lastDigits,
      productOrIssuer: transaction.productOrIssuer,
      settlementManagementType: transaction.settlementManagementType,
      cancelling: transaction.cancelling,
      splitType: transaction.splitType,
      customerName: transaction.customerName,
      authorizerMerchantId: transaction.authorizerMerchantId,
    };
  } catch (error) {
    console.error("Erro em getTransactionBySlug:", error);
    return null;
  }
}

/**
 * Get Total Transactions with revenue calculation
 */
export async function getTotalTransactions(
  dateFrom: string,
  dateTo: string
): Promise<GetTotalTransactionsResult[]> {
  const userAccess = await getUserMerchantsAccess();

  if (!userAccess.fullAccess && userAccess.idMerchants.length === 0) {
    return [];
  }

  try {
    const startTime = performance.now();
    const dateFromUTC = dateFrom
      ? getDateUTC(dateFrom, "America/Sao_Paulo")
      : null;
    const dateToUTC = dateTo ? getDateUTC(dateTo, "America/Sao_Paulo") : null;

    // Build merchant filter
    let merchantFilter = "";
    if (!userAccess.fullAccess) {
      merchantFilter = `AND m.id IN (${userAccess.idMerchants.join(",")})`;
    }

    let customerFilter = "";
    if (userAccess.idCustomer) {
      customerFilter = `AND m.id_customer = ${userAccess.idCustomer}`;
    }

    const result = await db.execute(sql`
      WITH filtered_transactions AS (
        SELECT t.*
        FROM transactions t
        INNER JOIN merchants m ON t.slug_merchant = m.slug
        WHERE
          t.transaction_status NOT IN ('CANCELED', 'DENIED', 'PROCESSING', 'PENDING')
          ${dateFromUTC ? sql`AND t.dt_insert >= ${dateFromUTC}` : sql``}
          ${dateToUTC ? sql`AND t.dt_insert <= ${dateToUTC}` : sql``}
          ${merchantFilter ? sql.raw(merchantFilter) : sql``}
          ${customerFilter ? sql.raw(customerFilter) : sql``}
      ),
      latest_payout AS (
        SELECT DISTINCT ON (p.payout_id)
          p.payout_id,
          p.transaction_mdr,
          p.installment_number
        FROM payout p
        ORDER BY p.payout_id, p.installment_number DESC
      ),
      merchant_info AS (
        SELECT
          ft.*,
          m.id_category,
          c.mcc,
          sf.id AS sf_id,
          sf.card_pix_mdr_admin,
          sf.non_card_pix_mdr_admin
        FROM filtered_transactions ft
        JOIN merchants m ON ft.slug_merchant = m.slug
        LEFT JOIN categories c ON m.id_category = c.id
        LEFT JOIN solicitation_fee sf
          ON c.mcc = sf.mcc
         AND sf.status = 'COMPLETED'
      ),
      joined_data AS (
        SELECT
          mi.*,
          lp.transaction_mdr,
          lp.installment_number,
          sfb.id AS sfb_id,
          sbpt.fee_admin,
          sbpt.no_card_fee_admin
        FROM merchant_info mi
        LEFT JOIN latest_payout lp
          ON lp.payout_id::uuid = mi.slug
        LEFT JOIN solicitation_fee_brand sfb
          ON sfb.solicitation_fee_id = mi.sf_id
         AND sfb.brand = mi.brand
        LEFT JOIN solicitation_brand_product_type sbpt
          ON sbpt.solicitation_fee_brand_id = sfb.id
         AND sbpt.product_type = SPLIT_PART(mi.product_type, '_', 1)
         AND COALESCE(lp.installment_number, 1) BETWEEN sbpt.transaction_fee_start AND sbpt.transaction_fee_end
      ),
      final_data AS (
        SELECT
          total_amount,
          method_type,
          product_type,
          COALESCE(transaction_mdr, 0) AS mdr,
          COALESCE(
            CASE
              WHEN product_type ILIKE 'PIX' AND method_type = 'CP'  THEN card_pix_mdr_admin
              WHEN product_type ILIKE 'PIX' AND method_type = 'CNP' THEN non_card_pix_mdr_admin
              WHEN method_type = 'CP'                               THEN fee_admin
              WHEN method_type = 'CNP'                              THEN no_card_fee_admin
              ELSE 0
            END
          , 0) AS admin_fee
        FROM joined_data
      )
      SELECT
        COUNT(*)                 AS count,
        SUM(total_amount)::TEXT  AS sum,
        SUM(
          CASE
            WHEN mdr = 0 THEN 0
            ELSE total_amount * ((mdr - admin_fee) / 100.0)
          END
        )::TEXT                  AS revenue
      FROM final_data;
    `);

    const endTime = performance.now();
    console.log(`getTotalTransactions executed in ${endTime - startTime} ms`);
    
    const rows = result.rows as Array<{
      count: number;
      sum: string;
      revenue: string;
    }>;

    return rows.map((row) => ({
      count: row.count || 0,
      sum: parseFloat(row.sum || "0"),
      revenue: parseFloat(row.revenue || "0"),
    }));
  } catch (error) {
    console.error("Erro em getTotalTransactions:", error);
    return [];
  }
}

/**
 * Get Total Transactions By Month/Day
 */
export async function getTotalTransactionsByMonth(
  dateFrom: string,
  dateTo: string,
  viewMode?: string
): Promise<GetTotalTransactionsByMonthResult[]> {
  const userAccess = await getUserMerchantsAccess();
  
  if (!userAccess.fullAccess && userAccess.idMerchants.length === 0) {
    return [];
  }

  try {
    const startTime = performance.now();
    const conditions: any[] = [];

    if (dateFrom) {
      const dateFromUTC = getDateUTC(dateFrom, "America/Sao_Paulo");
      if (dateFromUTC) conditions.push(gte(transactions.dtInsert, dateFromUTC));
    }
    
    if (dateTo) {
      const dateToUTC = getDateUTC(dateTo, "America/Sao_Paulo");
      if (dateToUTC) conditions.push(lte(transactions.dtInsert, dateToUTC));
    }

    conditions.push(
      notInArray(transactions.transactionStatus, [
        "CANCELED",
        "DENIED",
        "PROCESSING",
        "PENDING",
      ])
    );

    // Adicionar filtro de merchants se não tiver fullAccess
    if (!userAccess.fullAccess) {
      conditions.push(inArray(merchants.id, userAccess.idMerchants));
    }

    if (userAccess.idCustomer) {
      conditions.push(eq(merchants.idCustomer, userAccess.idCustomer));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const isMonthlyView = viewMode === "month";

    const dateExpression = isMonthlyView
      ? sql`EXTRACT(DAY FROM ${transactions.dtInsert} AT TIME ZONE 'utc' AT TIME ZONE 'America/Sao_Paulo')`
      : sql`DATE_TRUNC('month', ${transactions.dtInsert} AT TIME ZONE 'utc' AT TIME ZONE 'America/Sao_Paulo')`;

    const result = await db.execute(sql`
      SELECT
        ${dateExpression}                       AS date,
        SUM(transactions.total_amount)::TEXT    AS sum,
        COUNT(1)::INT                           AS count,
        SUM(
          CASE
            WHEN transactions.method_type = 'CP' THEN
              CASE
                WHEN COALESCE(payout.transaction_mdr, 0) = 0 THEN 0
                ELSE 
                CASE 
                  WHEN transactions.brand = 'PIX'
                  THEN (transactions.total_amount * 
                  (COALESCE(payout.transaction_mdr, 0)/100)) - COALESCE(solicitation_fee.card_pix_mdr_admin, 0)
                ELSE
                transactions.total_amount *
                  (COALESCE(payout.transaction_mdr, 0)/100 - COALESCE(solicitation_bp.fee_admin, 0)/100)
              END
            END
            WHEN transactions.method_type = 'CNP' THEN
              CASE
                WHEN COALESCE(payout.transaction_mdr, 0) = 0 THEN 0
                ELSE transactions.total_amount *
                  (
                    COALESCE(payout.transaction_mdr, 0)/100
                    - COALESCE(
                        CASE
                          WHEN transactions.brand = 'PIX'
                          THEN solicitation_fee.non_card_pix_mdr_admin
                          ELSE solicitation_bp.no_card_fee_admin
                        END
                      , 0)/100
                  )
              END
            ELSE 0
          END
        )::TEXT AS revenue
      FROM transactions
      INNER JOIN merchants
        ON transactions.slug_merchant = merchants.slug
      LEFT JOIN categories
        ON merchants.id_category = categories.id
      LEFT JOIN solicitation_fee
        ON categories.mcc = solicitation_fee.mcc
        AND solicitation_fee.status = 'COMPLETED'
      LEFT JOIN solicitation_fee_brand AS sfb
        ON sfb.solicitation_fee_id = solicitation_fee.id
        AND sfb.brand = transactions.brand
      LEFT JOIN payout
        ON payout.payout_id::uuid = transactions.slug
      LEFT JOIN solicitation_brand_product_type AS solicitation_bp
        ON solicitation_bp.solicitation_fee_brand_id = sfb.id
        AND solicitation_bp.product_type = SPLIT_PART(transactions.product_type, '_', 1)
        AND COALESCE(payout.installment_number, 1) BETWEEN solicitation_bp.transaction_fee_start
                                    AND solicitation_bp.transaction_fee_end
      ${whereClause ? sql`WHERE ${whereClause}` : sql``}
      GROUP BY ${dateExpression}
      ORDER BY ${dateExpression};
    `);

    const rows = result.rows as Array<{
      date: string | number | Date;
      sum: string;
      count: number;
      revenue: string;
    }>;

    const totals: GetTotalTransactionsByMonthResult[] = rows.map((item) => ({
      bruto: parseFloat(item.sum || "0"),
      count: item.count,
      lucro: parseFloat(item.revenue || "0"),
      date: isMonthlyView ? undefined : (item.date as string),
      dayOfMonth: isMonthlyView ? Number(item.date) : undefined,
    }));

    if (isMonthlyView) {
      const dateF = new Date(dateFrom);
      const lastDay = new Date(
        dateF.getFullYear(),
        dateF.getMonth() + 1,
        0
      ).getDate();
      const days = Array.from({ length: lastDay }, (_, i) => i + 1);
      return days.map(
        (day) =>
          totals.find((t) => t.dayOfMonth === day) || {
            bruto: 0,
            count: 0,
            lucro: 0,
            dayOfMonth: day,
          }
      );
    }

    const endTime = performance.now();
    console.log(
      `getTotalTransactionsByMonth executed in ${endTime - startTime} ms`
    );
    return totals;
  } catch (error) {
    console.error("Erro em getTotalTransactionsByMonth:", error);
    return [];
  }
}

/**
 * Get Total Merchants
 */
export async function getTotalMerchants(): Promise<MerchantTotal[]> {
  const userAccess = await getUserMerchantsAccess();
  const conditions = [];
  
  if (!userAccess.fullAccess && userAccess.idMerchants.length === 0) {
    return [{ total: 0 }];
  }
  
  if (!userAccess.fullAccess) {
    conditions.push(inArray(merchants.id, userAccess.idMerchants));
  }
  
  if (userAccess.idCustomer) {
    conditions.push(eq(merchants.idCustomer, userAccess.idCustomer));
  }
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const startTime = performance.now();

  try {
    const result = await db.execute(sql`
      SELECT 
        COUNT(1) AS total
      FROM merchants
      ${whereClause ? sql`WHERE ${whereClause}` : sql``}
    `);
    
    const endTime = performance.now();
    console.log(`getTotalMerchants executed in ${endTime - startTime} ms`);
    const data = result.rows as MerchantTotal[];
    return data;
  } catch (error) {
    console.error("Erro em getTotalMerchants:", error);
    return [{ total: 0 }];
  }
}

