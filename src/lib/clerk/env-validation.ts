/**
 * Validação de variáveis de ambiente do Clerk
 * Verifica se as variáveis obrigatórias estão configuradas
 */

/**
 * Valida as variáveis de ambiente do Clerk
 * @returns Objeto com status de validação e mensagens de erro
 */
export function validateClerkEnv(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Variáveis obrigatórias
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    errors.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY não está configurada");
  } else {
    // Verificar se é chave de desenvolvimento
    if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_test_")) {
      warnings.push(
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY parece ser uma chave de desenvolvimento (pk_test_). Use chaves de produção (pk_live_) em produção."
      );
    }
  }

  if (!process.env.CLERK_SECRET_KEY) {
    errors.push("CLERK_SECRET_KEY não está configurada");
  } else {
    // Verificar se é chave de desenvolvimento
    if (process.env.CLERK_SECRET_KEY.startsWith("sk_test_")) {
      warnings.push(
        "CLERK_SECRET_KEY parece ser uma chave de desenvolvimento (sk_test_). Use chaves de produção (sk_live_) em produção."
      );
    }
  }

  // Variáveis recomendadas para Satellite Domains
  const hasSubdomainSupport = process.env.CLERK_DOMAIN || process.env.CLERK_IS_SATELLITE;
  if (!hasSubdomainSupport) {
    warnings.push(
      "CLERK_DOMAIN e CLERK_IS_SATELLITE não estão configuradas. Se você estiver usando Satellite Domains (subdomínios), configure essas variáveis."
    );
  }

  // Verificar consistência das variáveis de Satellite Domains
  if (process.env.CLERK_IS_SATELLITE === "true" && !process.env.CLERK_DOMAIN) {
    warnings.push(
      "CLERK_IS_SATELLITE está definido como 'true', mas CLERK_DOMAIN não está configurada. Configure CLERK_DOMAIN para usar Satellite Domains."
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valida e loga as variáveis de ambiente do Clerk
 * Usado durante o desenvolvimento para alertar sobre problemas de configuração
 */
export function validateAndLogClerkEnv(): void {
  // Apenas validar em desenvolvimento ou se explicitamente solicitado
  if (process.env.NODE_ENV === "production" && !process.env.CLERK_VALIDATE_ENV) {
    return;
  }

  const validation = validateClerkEnv();

  if (validation.errors.length > 0) {
    console.error("❌ Erros de configuração do Clerk:");
    validation.errors.forEach((error) => {
      console.error(`   - ${error}`);
    });
  }

  if (validation.warnings.length > 0) {
    console.warn("⚠️  Avisos de configuração do Clerk:");
    validation.warnings.forEach((warning) => {
      console.warn(`   - ${warning}`);
    });
  }

  if (validation.isValid && validation.warnings.length === 0) {
    console.log("✅ Configuração do Clerk está correta");
  }
}

