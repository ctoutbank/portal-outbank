/**
 * Funções utilitárias para mascarar dados sensíveis conforme LGPD/GDPR
 * Campos que podem ser mascarados: CPF, CNPJ, Email, Telefone
 * Campos que NUNCA são mascarados: Nome fantasia, Razão social, Cidade, Estado
 */

/**
 * Mascara CPF no formato: XXX.XXX.XXX-XX
 */
export function maskCPF(cpf: string | null | undefined): string {
  if (!cpf) return "--";
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return `***.***.***-**`;
}

/**
 * Mascara CNPJ no formato: XX.XXX.XXX/XXXX-XX
 */
export function maskCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return "--";
  const clean = cnpj.replace(/\D/g, "");
  if (clean.length !== 14) return cnpj;
  return `**.***.***/****-**`;
}

/**
 * Mascara email mantendo primeira e última letra de cada parte
 * Exemplo: usuario@email.com -> u*****o@e***l.com
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "--";
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  
  const [local, domain] = parts;
  const maskedLocal = local.length > 2
    ? `${local[0]}${"*".repeat(Math.max(1, local.length - 2))}${local[local.length - 1]}`
    : "**";
  
  const domainParts = domain.split(".");
  if (domainParts.length < 2) return `${maskedLocal}@${domain}`;
  
  const domainName = domainParts[0];
  const extension = domainParts.slice(1).join(".");
  
  const maskedDomain = domainName.length > 2
    ? `${domainName[0]}${"*".repeat(Math.max(1, domainName.length - 2))}${domainName[domainName.length - 1]}`
    : "**";
  
  return `${maskedLocal}@${maskedDomain}.${extension}`;
}

/**
 * Mascara telefone no formato: (**) ****-**** ou (**) *****-****
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "--";
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 10) return `(**) ****-****`;
  if (clean.length === 11) return `(**) *****-****`;
  return phone;
}

