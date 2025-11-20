"use client";

import { maskCPF, maskCNPJ, maskEmail, maskPhone } from "@/lib/utils/data-masking";

interface SensitiveDataProps {
  value: string | null | undefined;
  type: "cpf" | "cnpj" | "email" | "phone";
  isRestricted: boolean;
  className?: string;
}

/**
 * Componente para exibir dados sensíveis com máscara condicional
 * Por padrão mostra tudo (isRestricted = false)
 * Se isRestricted = true, aplica máscara conforme o tipo
 */
export function SensitiveData({
  value,
  type,
  isRestricted,
  className = "",
}: SensitiveDataProps) {
  // Se não tem restrição, mostra completo (PADRÃO)
  if (!isRestricted) {
    return <span className={className}>{value || "--"}</span>;
  }

  // Se tem restrição, aplica máscara conforme o tipo
  let maskedValue: string;
  switch (type) {
    case "cpf":
      maskedValue = maskCPF(value);
      break;
    case "cnpj":
      maskedValue = maskCNPJ(value);
      break;
    case "email":
      maskedValue = maskEmail(value);
      break;
    case "phone":
      maskedValue = maskPhone(value);
      break;
    default:
      maskedValue = value || "--";
  }

  return <span className={className}>{maskedValue}</span>;
}

