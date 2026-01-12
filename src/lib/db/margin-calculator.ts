import { sql } from '@vercel/postgres';

export type UserMarginType = 'OUTBANK' | 'EXECUTIVO' | 'CORE';

export interface TransactionMarginParams {
  customerId: number;
  brand: string;
  productType: string;
  channel: string;
}

export interface MarginResult {
  marginPercent: number;
  marginType: UserMarginType;
  source: 'profile' | 'config' | 'default';
}

const normalizeMargin = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === '') return 0;
  const normalized = String(value).replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

const normalizeProductType = (productType: string): string => {
  const pt = productType.toLowerCase().trim();
  
  if (pt.includes('debito') || pt.includes('débito') || pt === 'debit') return 'debito';
  if (pt.includes('pix')) return 'pix';
  if (pt.includes('voucher')) return 'voucher';
  if (pt.includes('antecipacao') || pt.includes('antecipação')) return 'antecipacao';
  
  if (pt.includes('credito') || pt.includes('crédito') || pt === 'credit') {
    if (pt.includes('2x') || pt.includes('2_6') || pt.includes('parcelado')) return 'credito_2x';
    if (pt.includes('7x') || pt.includes('7_12') || pt.includes('parcelado_longo')) return 'credito_7x';
    return 'credito';
  }
  
  return 'credito';
};

const normalizeChannel = (channel: string): 'pos' | 'online' => {
  const ch = channel.toLowerCase().trim();
  if (ch.includes('online') || ch.includes('ecommerce') || ch.includes('e-commerce')) {
    return 'online';
  }
  return 'pos';
};


export async function getMarginForTransaction(
  params: TransactionMarginParams,
  marginType: UserMarginType
): Promise<MarginResult> {
  const { customerId } = params;
  
  const configField = marginType === 'OUTBANK' ? 'margin_outbank' 
    : marginType === 'EXECUTIVO' ? 'margin_executivo' 
    : 'margin_core';
  
  const { rows: configRows } = await sql.query(`
    SELECT ${configField} as margin_value
    FROM iso_margin_config
    WHERE customer_id = $1
  `, [customerId]);
  
  if (configRows[0] !== undefined && configRows[0].margin_value !== null) {
    return {
      marginPercent: normalizeMargin(configRows[0].margin_value),
      marginType,
      source: 'config'
    };
  }
  
  return {
    marginPercent: 0,
    marginType,
    source: 'default'
  };
}

export interface UserMarginsBreakdown {
  customerId: number;
  customerName: string;
  marginType: UserMarginType;
  margins: {
    modalidade: string;
    canal: string;
    marginPercent: number;
  }[];
  totalMarginSum: number;
}

export async function getUserMarginsBreakdown(
  userId: number
): Promise<UserMarginsBreakdown[]> {
  const { rows: userInfo } = await sql.query(`
    SELECT 
      u.user_type,
      uc.id_customer,
      uc.commission_type,
      c.name as customer_name
    FROM users u
    LEFT JOIN user_customers uc ON u.id = uc.id_user AND uc.active = true
    LEFT JOIN customers c ON uc.id_customer = c.id
    WHERE u.id = $1
  `, [userId]);
  
  if (userInfo.length === 0) {
    return [];
  }
  
  const isSuperAdmin = userInfo[0].user_type === 'SUPER_ADMIN';
  const results: UserMarginsBreakdown[] = [];
  
  for (const row of userInfo) {
    if (!row.id_customer) continue;
    
    let marginType: UserMarginType;
    if (isSuperAdmin) {
      marginType = 'OUTBANK';
    } else if (row.commission_type === 'EXECUTIVO' || row.commission_type === 'Executivo') {
      marginType = 'EXECUTIVO';
    } else if (row.commission_type === 'CORE' || row.commission_type === 'Core') {
      marginType = 'CORE';
    } else {
      continue;
    }
    
    const configField = marginType === 'OUTBANK' ? 'margin_outbank' 
      : marginType === 'EXECUTIVO' ? 'margin_executivo' 
      : 'margin_core';
    
    const { rows: configRows } = await sql.query(`
      SELECT ${configField} as margin_value
      FROM iso_margin_config
      WHERE customer_id = $1
    `, [row.id_customer]);
    
    const margins: { modalidade: string; canal: string; marginPercent: number }[] = [];
    
    if (configRows[0]?.margin_value) {
      const value = normalizeMargin(configRows[0].margin_value);
      margins.push({
        modalidade: 'Padrão',
        canal: 'TODOS',
        marginPercent: value
      });
    }
    
    const totalMarginSum = margins.reduce((sum, m) => sum + m.marginPercent, 0);
    
    results.push({
      customerId: row.id_customer,
      customerName: row.customer_name || 'N/A',
      marginType,
      margins,
      totalMarginSum
    });
  }
  
  return results;
}

function formatModalidade(modalidade: string): string {
  const map: Record<string, string> = {
    'debito': 'Débito',
    'credito': 'Crédito à Vista',
    'credito_2x': 'Crédito 2-6x',
    'credito_7x': 'Crédito 7-12x',
    'voucher': 'Voucher',
    'pix': 'PIX',
    'antecipacao': 'Antecipação'
  };
  return map[modalidade] || modalidade;
}

export async function calculateProfitWithSpecificMargin(
  transactions: Array<{
    customerId: number;
    amount: number;
    productType: string;
    channel: string;
    brand: string;
  }>,
  marginType: UserMarginType
): Promise<{ totalProfit: number; details: Array<{ transactionIndex: number; marginPercent: number; profit: number }> }> {
  const details: Array<{ transactionIndex: number; marginPercent: number; profit: number }> = [];
  let totalProfit = 0;
  
  const marginCache = new Map<string, number>();
  
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const normalizedBrand = (tx.brand || 'default').toLowerCase().trim();
    const cacheKey = `${tx.customerId}-${normalizedBrand}-${normalizeProductType(tx.productType)}-${normalizeChannel(tx.channel)}`;
    
    let marginPercent: number;
    if (marginCache.has(cacheKey)) {
      marginPercent = marginCache.get(cacheKey)!;
    } else {
      const result = await getMarginForTransaction({
        customerId: tx.customerId,
        brand: tx.brand,
        productType: tx.productType,
        channel: tx.channel
      }, marginType);
      marginPercent = result.marginPercent;
      marginCache.set(cacheKey, marginPercent);
    }
    
    const profit = tx.amount * (marginPercent / 100);
    details.push({ transactionIndex: i, marginPercent, profit });
    totalProfit += profit;
  }
  
  return { totalProfit, details };
}
