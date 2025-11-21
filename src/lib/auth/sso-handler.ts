"use server";

import { db } from "@/lib/db";
import { customers, customerCustomization } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";
import { nanoid } from "nanoid";

// Armazenamento temporário de tokens SSO (em produção, usar Redis ou similar)
const ssoTokens = new Map<
  string,
  { userId: number; customerId: number; expiresAt: number }
>();

/**
 * Gera um token SSO temporário para acesso direto a um ISO
 * @param userId - ID do usuário
 * @param customerId - ID do ISO (customer)
 * @returns Token SSO válido por 5 minutos
 */
export async function generateSSOToken(
  userId: number,
  customerId: number
): Promise<string> {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo) {
    throw new Error("Usuário não autenticado");
  }

  // Verificar se o usuário tem acesso a este ISO
  const allowedCustomers = userInfo.allowedCustomers || [];
  if (
    !userInfo.isSuperAdmin &&
    !allowedCustomers.includes(customerId) &&
    userInfo.idCustomer !== customerId
  ) {
    throw new Error("Usuário não tem permissão para acessar este ISO via SSO");
  }

  // Gerar token único
  const token = nanoid(32);
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos

  // Armazenar token (em produção, usar Redis ou banco de dados)
  ssoTokens.set(token, {
    userId,
    customerId,
    expiresAt,
  });

  // Limpar tokens expirados (limpeza básica)
  for (const [key, value] of ssoTokens.entries()) {
    if (value.expiresAt < Date.now()) {
      ssoTokens.delete(key);
    }
  }

  return token;
}

/**
 * Valida um token SSO e retorna os dados do usuário e ISO
 * @param token - Token SSO a validar
 * @returns Dados do token ou null se inválido/expirado
 */
export async function validateSSOToken(token: string): Promise<{
  userId: number;
  customerId: number;
  customerSlug: string | null;
} | null> {
  const tokenData = ssoTokens.get(token);

  if (!tokenData) {
    return null;
  }

  // Verificar se o token expirou
  if (tokenData.expiresAt < Date.now()) {
    ssoTokens.delete(token);
    return null;
  }

  // Buscar slug do ISO
  const customer = await db
    .select({
      id: customers.id,
      slug: customerCustomization.slug,
    })
    .from(customers)
    .leftJoin(
      customerCustomization,
      eq(customers.id, customerCustomization.customerId)
    )
    .where(and(eq(customers.id, tokenData.customerId)))
    .limit(1);

  if (!customer || customer.length === 0) {
    return null;
  }

  // Remover token após uso (one-time use)
  ssoTokens.delete(token);

  return {
    userId: tokenData.userId,
    customerId: tokenData.customerId,
    customerSlug: customer[0].slug || null,
  };
}


