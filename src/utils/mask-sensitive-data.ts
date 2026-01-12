/**
 * Utility functions for masking sensitive data
 * Used for Executivo/Core profiles that should not see full customer data by default
 */

export function maskCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return '****';
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length < 14) return '****';
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.***/****.${clean.slice(12, 14)}`;
}

export function maskCPF(cpf: string | null | undefined): string {
  if (!cpf) return '****';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length < 11) return '****';
  return `${clean.slice(0, 3)}.***.***.${clean.slice(9, 11)}`;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '****';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 10) return '****';
  const ddd = clean.slice(0, 2);
  const lastDigits = clean.slice(-4);
  return `(${ddd}) ****-${lastDigits}`;
}

export function maskAddress(address: string | null | undefined): string {
  if (!address) return '****';
  return '****';
}

export function maskEstablishment(name: string | null | undefined): string {
  if (!name) return '****';
  if (name.length <= 4) return '****';
  return `${name.slice(0, 2)}${'*'.repeat(Math.min(name.length - 4, 8))}${name.slice(-2)}`;
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return '****';
  const [local, domain] = email.split('@');
  if (!domain) return '****';
  const maskedLocal = local.length > 2 
    ? `${local.slice(0, 2)}${'*'.repeat(Math.min(local.length - 2, 6))}`
    : '**';
  return `${maskedLocal}@${domain}`;
}

export interface MaskOptions {
  cnpj?: boolean;
  cpf?: boolean;
  phone?: boolean;
  address?: boolean;
  establishment?: boolean;
  email?: boolean;
}

export interface SensitiveDataFields {
  cnpj?: string | null;
  cpf?: string | null;
  phone?: string | null;
  telefone?: string | null;
  address?: string | null;
  endereco?: string | null;
  establishmentName?: string | null;
  merchantName?: string | null;
  nome?: string | null;
  email?: string | null;
}

export function maskSensitiveData<T extends SensitiveDataFields>(
  data: T,
  shouldMask: boolean,
  options: MaskOptions = { cnpj: true, cpf: true, phone: true, address: true, establishment: true }
): T {
  if (!shouldMask) return data;
  
  const masked = { ...data };
  
  if (options.cnpj && 'cnpj' in masked) {
    masked.cnpj = maskCNPJ(masked.cnpj);
  }
  
  if (options.cpf && 'cpf' in masked) {
    masked.cpf = maskCPF(masked.cpf);
  }
  
  if (options.phone) {
    if ('phone' in masked) masked.phone = maskPhone(masked.phone);
    if ('telefone' in masked) masked.telefone = maskPhone(masked.telefone);
  }
  
  if (options.address) {
    if ('address' in masked) masked.address = maskAddress(masked.address);
    if ('endereco' in masked) masked.endereco = maskAddress(masked.endereco);
  }
  
  if (options.establishment) {
    if ('establishmentName' in masked) masked.establishmentName = maskEstablishment(masked.establishmentName);
    if ('merchantName' in masked) masked.merchantName = maskEstablishment(masked.merchantName);
    if ('nome' in masked) masked.nome = maskEstablishment(masked.nome);
  }

  if (options.email && 'email' in masked) {
    masked.email = maskEmail(masked.email);
  }
  
  return masked;
}

export function maskArrayData<T extends SensitiveDataFields>(
  dataArray: T[],
  shouldMask: boolean,
  options?: MaskOptions
): T[] {
  if (!shouldMask) return dataArray;
  return dataArray.map(item => maskSensitiveData(item, shouldMask, options));
}
