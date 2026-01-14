export const LAYER_COLORS = {
  1: '#4a5335',
  2: '#8b5a2b',
  3: '#6b5a35',
  4: '#3d4a2a',
  5: '#7a2a1a',
  6: '#5a3a25',
  7: '#6b5a35'
};

export const CHART_PALETTE = [
  '#8b9a6b',
  '#d9956a',
  '#e8d5a3',
  '#c45a3b',
  '#a8b88a',
  '#b8754a',
  '#c9b683',
  '#6b7a4b',
  '#d9785c',
  '#f5ecd0'
];

export const CHART_PALETTE_WARM = [
  '#d9956a',
  '#c45a3b',
  '#e8d5a3',
  '#b8754a',
  '#d9785c',
  '#c9b683'
];

export const CHART_PALETTE_COOL = [
  '#8b9a6b',
  '#a8b88a',
  '#6b7a4b',
  '#9ca3af',
  '#6b7280'
];

export const HEATMAP_GRADIENT = [
  '#2a3441',
  '#6b7a4b',
  '#8b9a6b',
  '#d9956a',
  '#c45a3b'
];

export const STATUS_COLORS: Record<string, string> = {
  'AUTHORIZED': '#8b9a6b',
  'CANCELED': '#d9956a',
  'DENIED': '#c45a3b',
  'PENDING': '#9ca3af',
  'PROCESSING': '#a8b88a'
};

export const SHIFT_COLORS: Record<string, string> = {
  'Madrugada': '#6b7a4b',
  'Manhã': '#e8d5a3',
  'Tarde': '#8b9a6b',
  'Noite': '#d9956a'
};

export const DAY_COLORS = [
  '#c45a3b',
  '#8b9a6b',
  '#a8b88a',
  '#d9956a',
  '#e8d5a3',
  '#b8754a',
  '#c9b683'
];

export const PRODUCT_LABELS: Record<string, string> = {
  'CREDIT': 'CRÉDITO',
  'DEBIT': 'DÉBITO',
  'PIX': 'PIX',
  'PREPAID_CREDIT': 'CRÉDITO PRÉ-PAGO',
  'PREPAID_DEBIT': 'DÉBITO PRÉ-PAGO',
  'VOUCHER': 'VOUCHER',
  'CREDIT_INSTALLMENT': 'CRÉDITO PARCELADO',
  'DEBIT_INSTALLMENT': 'DÉBITO PARCELADO',
  'BOLETO': 'BOLETO',
  'ANTECIPACAO': 'ANTECIPAÇÃO',
  'PRE': 'PRÉ-PAGO',
  'credit': 'CRÉDITO',
  'debit': 'DÉBITO',
  'pix': 'PIX',
  'voucher': 'VOUCHER',
  'boleto': 'BOLETO',
  'antecipacao': 'ANTECIPAÇÃO',
  'pre': 'PRÉ-PAGO'
};

export function getProductLabel(name: string): string {
  return PRODUCT_LABELS[name] || name.toUpperCase().replace(/_/g, ' ');
}

export function formatDateLabel(dateString: string): string {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}`;
}

// Formato completo brasileiro para valores monetários (abrevia valores muito grandes)
export function formatCurrencyFull(value: number): string {
  // Para valores muito grandes (>= 100 milhões), usa formato abreviado para não exceder 10 caracteres
  if (Math.abs(value) >= 100_000_000) {
    return formatCurrencyShort(value);
  }
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Formato abreviado para eixos de gráficos (mantém legibilidade)
export function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000_000) return `R$ ${(value / 1_000_000_000).toFixed(1).replace('.', ',')}B`;
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1).replace('.', ',')}K`;
  return formatCurrencyFull(value);
}

// Formatar número com separador de milhar brasileiro
export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}

// Formatar percentual com vírgula (padrão BR)
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals).replace('.', ',')}%`;
}
