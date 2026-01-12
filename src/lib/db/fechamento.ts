import { sql } from '@vercel/postgres';
import { getInheritedCommissions } from './inherited-commissions';
import { getMarginForTransaction, UserMarginType } from './margin-calculator';

// Normalizar margem: trocar vírgula por ponto para parseFloat correto
const normalizeMargin = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === '') return 0;
  const normalized = String(value).replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

// Cache de margens por ISO/modalidade/canal
interface MarginCacheKey {
  customerId: number;
  productType: string;
  channel: string;
}

async function getMarginWithCache(
  cache: Map<string, number>,
  customerId: number,
  productType: string,
  channel: string,
  marginType: UserMarginType
): Promise<number> {
  const cacheKey = `${customerId}-${productType.toLowerCase()}-${channel.toLowerCase()}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }
  
  const result = await getMarginForTransaction(
    { customerId, brand: '', productType, channel },
    marginType
  );
  
  cache.set(cacheKey, result.marginPercent);
  return result.marginPercent;
}

interface UserMarginInfo {
  type: 'portal' | 'iso';
  marginType?: UserMarginType;
}

async function getUserMarginInfo(userId: number): Promise<UserMarginInfo> {
  const { rows } = await sql.query(`
    SELECT u.user_type, u.id_customer, p.category_type, p.name as profile_name
    FROM users u
    LEFT JOIN profiles p ON u.id_profile = p.id
    WHERE u.id = $1
  `, [userId]);
  
  if (rows.length === 0) return { type: 'portal', marginType: 'OUTBANK' };
  
  const userType = rows[0].user_type;
  const categoryType = (rows[0].category_type || '').toUpperCase();
  const profileName = (rows[0].profile_name || '').toUpperCase();
  const idCustomer = rows[0].id_customer;
  
  if (userType === 'SUPER_ADMIN') {
    return { type: 'portal', marginType: 'OUTBANK' };
  }
  
  if (categoryType === 'ISO_ADMIN' || (idCustomer && !categoryType)) {
    return { type: 'iso' };
  }
  
  if (categoryType === 'CORE' || profileName.includes('CORE') || profileName.includes('COMERCIAL')) {
    return { type: 'portal', marginType: 'CORE' };
  }
  
  if (categoryType === 'EXECUTIVO' || userType === 'ISO_PORTAL_ADMIN' || profileName.includes('ADMIN')) {
    return { type: 'portal', marginType: 'EXECUTIVO' };
  }
  
  return { type: 'portal', marginType: 'OUTBANK' };
}

async function getIsoMarginForTransaction(
  cache: Map<string, number>,
  customerId: number,
  brand: string,
  productType: string
): Promise<number> {
  const normalizedBrand = (brand || 'default').toLowerCase().trim();
  const normalizedProduct = productType.toLowerCase().trim();
  const cacheKey = `iso-${customerId}-${normalizedBrand}-${normalizedProduct}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }
  
  const { rows } = await sql.query(`
    SELECT imm.margin_iso
    FROM iso_mdr_margins imm
    JOIN iso_mdr_links iml ON imm.iso_mdr_link_id = iml.id
    WHERE iml.customer_id = $1
      AND iml.status = 'validada'
      AND LOWER(imm.bandeira) = $2
      AND LOWER(imm.modalidade) = $3
    LIMIT 1
  `, [customerId, normalizedBrand, normalizedProduct]);
  
  const marginValue = rows[0] !== undefined && rows[0].margin_iso !== null 
    ? normalizeMargin(rows[0].margin_iso) 
    : 0;
  
  cache.set(cacheKey, marginValue);
  return marginValue;
}

// Normalizar nome do cliente: remover "(Outbank)" e similares
const normalizeCustomerName = (name: string | null | undefined): string => {
  if (!name) return 'N/A';
  // Remove "(Outbank)" e variações
  return name.replace(/\s*\(Outbank\)\s*/gi, '').trim() || name;
};

export interface FechamentoTransaction {
  id: string;
  transactionDate: Date;
  merchantName: string;
  merchantType: string;
  merchantDocument: string;
  customerName: string;
  customerId: number;
  amount: number;
  commissionPercent: number;
  profit: number;
  productType: string;
  brand: string;
  methodType: string;
  salesChannel: string;
  transactionStatus: string;
}

export interface FechamentoSummary {
  totalTransactions: number;
  totalVolume: number;
  totalProfit: number;
  commissions: Array<{
    customerId: number;
    customerName: string;
    commissionPercent: number;
    transactionCount: number;
    volume: number;
    profit: number;
  }>;
}

export interface FechamentoFilters {
  dateFrom?: string;
  dateTo?: string;
  customerId?: number;
  mcc?: string;
  productType?: string;
  brand?: string;
  page?: number;
  pageSize?: number;
}

export interface FechamentoResult {
  summary: FechamentoSummary;
  transactions: FechamentoTransaction[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  chartData: Array<{
    date: string;
    dayOfMonth: number;
    bruto: number;
    lucro: number;
    count: number;
  }>;
}

async function isSuperAdmin(userId: number): Promise<boolean> {
  const { rows } = await sql.query(`
    SELECT user_type FROM users WHERE id = $1
  `, [userId]);
  return rows[0]?.user_type === 'SUPER_ADMIN';
}

export async function getUserFechamentoData(
  userId: number,
  filters: FechamentoFilters = {}
): Promise<FechamentoResult> {
  const { dateFrom, dateTo, customerId, mcc, productType, brand, page = 1, pageSize = 20 } = filters;
  
  const superAdmin = await isSuperAdmin(userId);
  const userMarginInfo = await getUserMarginInfo(userId);
  const marginCache = new Map<string, number>();
  
  let commissionsBySlug = new Map<string, { customerId: number; customerName: string; commissionPercent: number }>();
  
  if (superAdmin) {
    const { rows: allCustomers } = await sql.query(`
      SELECT c.id, c.slug, c.name, COALESCE(imc.margin_outbank, '0') as margin
      FROM customers c
      LEFT JOIN iso_margin_config imc ON c.id = imc.customer_id
    `);
    
    for (const row of allCustomers) {
      commissionsBySlug.set(row.slug, {
        customerId: Number(row.id),
        customerName: row.name || 'N/A',
        commissionPercent: normalizeMargin(row.margin)
      });
    }
  } else {
    const inheritedCommissions = await getInheritedCommissions(userId);
    
    if (inheritedCommissions.length === 0) {
      return {
        summary: { totalTransactions: 0, totalVolume: 0, totalProfit: 0, commissions: [] },
        transactions: [],
        pagination: { page: 1, pageSize, totalItems: 0, totalPages: 0 },
        chartData: []
      };
    }
    
    const customerIds = inheritedCommissions.map(c => c.customerId);
    const { rows: customerSlugs } = await sql.query(`
      SELECT id, slug, name FROM customers WHERE id = ANY($1::int[])
    `, [customerIds]);
    
    for (const row of customerSlugs) {
      const commission = inheritedCommissions.find(c => c.customerId === Number(row.id));
      if (commission) {
        commissionsBySlug.set(row.slug, {
          customerId: commission.customerId,
          customerName: row.name || commission.customerName,
          commissionPercent: commission.commissionPercent
        });
      }
    }
  }

  if (commissionsBySlug.size === 0) {
    return {
      summary: { totalTransactions: 0, totalVolume: 0, totalProfit: 0, commissions: [] },
      transactions: [],
      pagination: { page: 1, pageSize, totalItems: 0, totalPages: 0 },
      chartData: []
    };
  }

  const slugs = Array.from(commissionsBySlug.keys());
  const params: any[] = [];
  let paramIndex = 1;

  let slugFilter = '';
  if (!superAdmin) {
    const slugPlaceholders = slugs.map(() => `$${paramIndex++}`).join(',');
    params.push(...slugs);
    slugFilter = `t.slug_customer IN (${slugPlaceholders})`;
  }

  let whereClause = superAdmin ? 'WHERE 1=1' : `WHERE ${slugFilter}`;
  
  if (dateFrom) {
    whereClause += ` AND t.dt_insert >= $${paramIndex++}`;
    params.push(dateFrom);
  }
  if (dateTo) {
    whereClause += ` AND t.dt_insert <= $${paramIndex++}`;
    params.push(dateTo + ' 23:59:59');
  }
  if (customerId) {
    const { rows: custRows } = await sql.query(`SELECT slug FROM customers WHERE id = $1`, [customerId]);
    if (custRows[0]) {
      whereClause += ` AND t.slug_customer = $${paramIndex++}`;
      params.push(custRows[0].slug);
    }
  }
  if (productType) {
    whereClause += ` AND t.product_type = $${paramIndex++}`;
    params.push(productType);
  }
  if (brand) {
    whereClause += ` AND t.brand = $${paramIndex++}`;
    params.push(brand);
  }
  if (mcc) {
    whereClause += ` AND t.mcc = $${paramIndex++}`;
    params.push(mcc);
  }

  const countParams = [...params];
  const { rows: countRows } = await sql.query(`
    SELECT COUNT(*) as total
    FROM transactions t
    ${whereClause}
  `, countParams);
  const totalItems = parseInt(countRows[0]?.total || '0');
  const totalPages = Math.ceil(totalItems / pageSize);

  const offset = (page - 1) * pageSize;
  const paginatedParams = [...params, pageSize, offset];
  
  const { rows } = await sql.query(`
    SELECT 
      t.slug as id,
      t.dt_insert as transaction_date,
      t.merchant_name,
      t.merchant_type,
      t.slug_customer,
      t.customer_name,
      t.total_amount as amount,
      t.product_type,
      t.brand,
      t.method_type,
      t.sales_channel,
      t.transaction_status,
      m.id_document as merchant_document
    FROM transactions t
    LEFT JOIN merchants m ON t.slug_merchant = m.slug
    ${whereClause}
    ORDER BY t.dt_insert DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `, paginatedParams);

  const transactions: FechamentoTransaction[] = [];
  for (const row of rows) {
    const commission = commissionsBySlug.get(row.slug_customer);
    const amount = parseFloat(row.amount) || 0;
    const txCustomerId = commission?.customerId || 0;
    const txProductType = row.product_type || 'credito';
    const txChannel = row.sales_channel || 'pos';
    
    const fallbackCommission = commission?.commissionPercent || 0;
    let commissionPercent = fallbackCommission;
    const txBrand = row.brand || '';
    
    if (txCustomerId > 0) {
      if (userMarginInfo.type === 'portal' && userMarginInfo.marginType) {
        const granularMargin = await getMarginWithCache(
          marginCache,
          txCustomerId,
          txProductType,
          txChannel,
          userMarginInfo.marginType
        );
        commissionPercent = granularMargin > 0 ? granularMargin : fallbackCommission;
      } else if (userMarginInfo.type === 'iso') {
        const isoMargin = await getIsoMarginForTransaction(
          marginCache,
          txCustomerId,
          txBrand,
          txProductType
        );
        commissionPercent = isoMargin > 0 ? isoMargin : fallbackCommission;
      }
    }
    
    const profit = (amount * commissionPercent) / 100;

    transactions.push({
      id: row.id,
      transactionDate: row.transaction_date,
      merchantName: row.merchant_name || 'N/A',
      merchantType: row.merchant_type || '',
      merchantDocument: row.merchant_document || '',
      customerName: normalizeCustomerName(row.customer_name || commission?.customerName),
      customerId: txCustomerId,
      amount,
      commissionPercent,
      profit,
      productType: txProductType,
      brand: row.brand || '',
      methodType: row.method_type || '',
      salesChannel: txChannel,
      transactionStatus: row.transaction_status || ''
    });
  }

  const summaryParams = [...params];
  const { rows: summaryRows } = await sql.query(`
    SELECT 
      t.slug_customer,
      t.customer_name,
      t.product_type,
      t.sales_channel,
      t.brand,
      COUNT(*) as transaction_count,
      SUM(t.total_amount) as volume
    FROM transactions t
    ${whereClause}
    GROUP BY t.slug_customer, t.customer_name, t.product_type, t.sales_channel, t.brand
  `, summaryParams);

  const commissionsByCustomer = new Map<number, { 
    customerName: string; 
    transactionCount: number; 
    volume: number; 
    profit: number;
    avgCommission: number;
  }>();

  for (const row of summaryRows) {
    const commission = commissionsBySlug.get(row.slug_customer);
    const txCustomerId = commission?.customerId || 0;
    const txProductType = row.product_type || 'credito';
    const txChannel = row.sales_channel || 'pos';
    const txBrand = row.brand || '';
    const volume = parseFloat(row.volume) || 0;
    const count = parseInt(row.transaction_count) || 0;
    
    const fallbackCommission = commission?.commissionPercent || 0;
    let commissionPercent = fallbackCommission;
    
    if (txCustomerId > 0) {
      if (userMarginInfo.type === 'portal' && userMarginInfo.marginType) {
        const granularMargin = await getMarginWithCache(
          marginCache,
          txCustomerId,
          txProductType,
          txChannel,
          userMarginInfo.marginType
        );
        commissionPercent = granularMargin > 0 ? granularMargin : fallbackCommission;
      } else if (userMarginInfo.type === 'iso') {
        const isoMargin = await getIsoMarginForTransaction(
          marginCache,
          txCustomerId,
          txBrand,
          txProductType
        );
        commissionPercent = isoMargin > 0 ? isoMargin : fallbackCommission;
      }
    }
    
    const profit = (volume * commissionPercent) / 100;
    
    const existing = commissionsByCustomer.get(txCustomerId);
    if (existing) {
      existing.transactionCount += count;
      existing.volume += volume;
      existing.profit += profit;
    } else {
      commissionsByCustomer.set(txCustomerId, {
        customerName: normalizeCustomerName(row.customer_name || commission?.customerName),
        transactionCount: count,
        volume,
        profit,
        avgCommission: commissionPercent
      });
    }
  }

  const commissions = Array.from(commissionsByCustomer.entries()).map(([customerId, data]) => ({
    customerId,
    customerName: data.customerName,
    commissionPercent: data.volume > 0 ? (data.profit / data.volume) * 100 : 0,
    transactionCount: data.transactionCount,
    volume: data.volume,
    profit: data.profit
  }));

  const summary: FechamentoSummary = {
    totalTransactions: totalItems,
    totalVolume: commissions.reduce((sum, c) => sum + c.volume, 0),
    totalProfit: commissions.reduce((sum, c) => sum + c.profit, 0),
    commissions
  };

  const chartParams = [...params];
  const { rows: chartRows } = await sql.query(`
    SELECT 
      TO_CHAR(t.dt_insert, 'YYYY-MM-DD') as date,
      t.slug_customer,
      t.product_type,
      t.sales_channel,
      t.brand,
      SUM(t.total_amount) as volume,
      COUNT(*) as count
    FROM transactions t
    ${whereClause}
    GROUP BY TO_CHAR(t.dt_insert, 'YYYY-MM-DD'), t.slug_customer, t.product_type, t.sales_channel, t.brand
    ORDER BY TO_CHAR(t.dt_insert, 'YYYY-MM-DD') ASC
  `, chartParams);

  const chartByDate = new Map<string, { bruto: number; lucro: number; count: number }>();
  for (const row of chartRows) {
    const dateKey = row.date;
    const bruto = parseFloat(row.volume) || 0;
    const count = parseInt(row.count) || 0;
    const commission = commissionsBySlug.get(row.slug_customer);
    const txCustomerId = commission?.customerId || 0;
    const txProductType = row.product_type || 'credito';
    const txChannel = row.sales_channel || 'pos';
    const txBrand = row.brand || '';
    
    const fallbackCommission = commission?.commissionPercent || 0;
    let commissionPercent = fallbackCommission;
    
    if (txCustomerId > 0) {
      if (userMarginInfo.type === 'portal' && userMarginInfo.marginType) {
        const granularMargin = await getMarginWithCache(
          marginCache,
          txCustomerId,
          txProductType,
          txChannel,
          userMarginInfo.marginType
        );
        commissionPercent = granularMargin > 0 ? granularMargin : fallbackCommission;
      } else if (userMarginInfo.type === 'iso') {
        const isoMargin = await getIsoMarginForTransaction(
          marginCache,
          txCustomerId,
          txBrand,
          txProductType
        );
        commissionPercent = isoMargin > 0 ? isoMargin : fallbackCommission;
      }
    }
    
    const lucro = (bruto * commissionPercent) / 100;
    
    const existing = chartByDate.get(dateKey) || { bruto: 0, lucro: 0, count: 0 };
    chartByDate.set(dateKey, {
      bruto: existing.bruto + bruto,
      lucro: existing.lucro + lucro,
      count: existing.count + count
    });
  }

  const startDate = dateFrom ? new Date(dateFrom + 'T00:00:00Z') : new Date();
  const endDate = dateTo ? new Date(dateTo + 'T00:00:00Z') : new Date();
  
  startDate.setUTCHours(0, 0, 0, 0);
  endDate.setUTCHours(0, 0, 0, 0);
  
  if (!dateFrom) {
    startDate.setUTCDate(1);
  }
  if (!dateTo) {
    endDate.setUTCMonth(endDate.getUTCMonth() + 1);
    endDate.setUTCDate(0);
  }

  const chartData: Array<{ date: string; dayOfMonth: number; bruto: number; lucro: number; count: number }> = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const year = currentDate.getUTCFullYear();
    const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getUTCDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    const dayOfMonth = currentDate.getUTCDate();
    const existing = chartByDate.get(dateKey);
    
    chartData.push({
      date: dateKey,
      dayOfMonth,
      bruto: existing?.bruto || 0,
      lucro: existing?.lucro || 0,
      count: existing?.count || 0
    });
    
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return { 
    summary, 
    transactions,
    pagination: { page, pageSize, totalItems, totalPages },
    chartData
  };
}
