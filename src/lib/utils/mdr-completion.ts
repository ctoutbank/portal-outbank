export type MdrCompletionStatus = 'sem_taxas' | 'incompleta' | 'completa';

interface MdrData {
  debitopos?: string | null;
  creditopos?: string | null;
  credito2xpos?: string | null;
  credito7xpos?: string | null;
  voucherpos?: string | null;
  prepos?: string | null;
  mdrpos?: string | null;
  cminpos?: string | null;
  cmaxpos?: string | null;
  antecipacao?: string | null;
  custo_pix_pos?: string | null;
  debitoonline?: string | null;
  creditoonline?: string | null;
  credito2xonline?: string | null;
  credito7xonline?: string | null;
  voucheronline?: string | null;
  preonline?: string | null;
  mdronline?: string | null;
  cminonline?: string | null;
  cmaxonline?: string | null;
  antecipacaoonline?: string | null;
  custo_pix_online?: string | null;
}

const MULTI_VALUE_POS_FIELDS = [
  'debitopos',
  'creditopos', 
  'credito2xpos',
  'credito7xpos',
  'voucherpos',
  'prepos',
] as const;

const SINGLE_VALUE_POS_FIELDS = [
  'antecipacao',
  'custo_pix_pos',
] as const;

const MULTI_VALUE_ONLINE_FIELDS = [
  'debitoonline',
  'creditoonline',
  'credito2xonline',
  'credito7xonline',
  'voucheronline',
  'preonline',
] as const;

const SINGLE_VALUE_ONLINE_FIELDS = [
  'antecipacaoonline',
  'custo_pix_online',
] as const;

const POS_FIELDS = [...MULTI_VALUE_POS_FIELDS, ...SINGLE_VALUE_POS_FIELDS] as const;
const ONLINE_FIELDS = [...MULTI_VALUE_ONLINE_FIELDS, ...SINGLE_VALUE_ONLINE_FIELDS] as const;

const MULTI_VALUE_FIELDS = new Set([...MULTI_VALUE_POS_FIELDS, ...MULTI_VALUE_ONLINE_FIELDS]);

function isFieldFilled(value: string | null | undefined, fieldName?: string): boolean {
  if (value === null || value === undefined || value === '') return false;
  
  const trimmed = value.trim();
  if (trimmed === '') return false;
  
  const isMultiValueField = fieldName ? MULTI_VALUE_FIELDS.has(fieldName as typeof MULTI_VALUE_POS_FIELDS[number] | typeof MULTI_VALUE_ONLINE_FIELDS[number]) : false;
  
  if (isMultiValueField && trimmed.includes(',')) {
    const values = trimmed.split(',');
    return values.every(v => v.trim() !== '');
  }
  
  return true;
}

export function getMdrCompletionStatus(
  mdrData: MdrData | null | undefined,
  suportaPos: boolean = true,
  suportaOnline: boolean = true
): { status: MdrCompletionStatus; percentage: number; filled: number; total: number } {
  if (!mdrData) {
    return { status: 'sem_taxas', percentage: 0, filled: 0, total: 0 };
  }

  const fieldsToCheck: string[] = [];

  if (suportaPos) {
    fieldsToCheck.push(...POS_FIELDS);
  }

  if (suportaOnline) {
    fieldsToCheck.push(...ONLINE_FIELDS);
  }

  if (fieldsToCheck.length === 0) {
    return { status: 'completa', percentage: 100, filled: 0, total: 0 };
  }

  const filledFields: string[] = [];
  const emptyFields: string[] = [];
  
  fieldsToCheck.forEach(field => {
    const value = (mdrData as Record<string, string | null | undefined>)[field];
    if (isFieldFilled(value, field)) {
      filledFields.push(field);
    } else {
      emptyFields.push(`${field}="${value}"`);
    }
  });

  const filled = filledFields.length;
  const total = fieldsToCheck.length;
  const percentage = Math.round((filled / total) * 100);

  if (emptyFields.length > 0) {
    console.log(`[MDR Completion] Campos vazios (${emptyFields.length}/${total}):`, emptyFields.join(', '));
  }

  if (filled === total) {
    return { status: 'completa', percentage: 100, filled, total };
  }

  return { status: 'incompleta', percentage, filled, total };
}

export function getCompletionLabel(status: MdrCompletionStatus): string {
  switch (status) {
    case 'sem_taxas':
      return 'Sem taxas';
    case 'incompleta':
      return 'Incompleta';
    case 'completa':
      return 'Completa';
  }
}
