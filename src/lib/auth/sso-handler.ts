"use server";

import { db } from "@/lib/db";
import { customers, customerCustomization } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";
import {
  storeSSOToken,
  retrieveSSOToken,
  markTokenAsUsed,
} from "./sso-storage";
import { validateUserAccessToCustomer } from "./sso-validator";

// Função auxiliar para logging
function logSSO(level: "info" | "error" | "warn", message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[SSO ${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  if (data) {
    console.log(logMessage, JSON.stringify(data, null, 2));
  } else {
    console.log(logMessage);
  }
}

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
  logSSO("info", "Iniciando geração de token SSO", { userId, customerId });

  const userInfo = await getCurrentUserInfo();
  if (!userInfo) {
    logSSO("error", "Usuário não autenticado ao gerar token SSO");
    throw new Error("Usuário não autenticado");
  }

  logSSO("info", "Informações do usuário obtidas", {
    userId: userInfo.id,
    isSuperAdmin: userInfo.isSuperAdmin,
    isAdmin: userInfo.isAdmin,
    idCustomer: userInfo.idCustomer,
    allowedCustomers: userInfo.allowedCustomers,
  });

  // Verificar se o usuário tem acesso a este ISO usando validação unificada
  const hasAccess = await validateUserAccessToCustomer(userInfo.id, customerId);

  if (!hasAccess) {
    logSSO("warn", "Usuário não tem permissão para acessar este ISO via SSO", {
      userId: userInfo.id,
      customerId,
      allowedCustomers: userInfo.allowedCustomers,
      idCustomer: userInfo.idCustomer,
      isSuperAdmin: userInfo.isSuperAdmin,
    });
    throw new Error("Usuário não tem permissão para acessar este ISO via SSO");
  }

  // Gerar e armazenar token no banco de dados
  const token = await storeSSOToken(userId, customerId);

  logSSO("info", "Token SSO gerado e armazenado com sucesso", {
    token: token.substring(0, 8) + "...", // Log apenas prefixo por segurança
    userId,
    customerId,
  });

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
  logSSO("info", "Validando token SSO", { token: token.substring(0, 8) + "..." });

  // Recuperar token do banco de dados
  const tokenData = await retrieveSSOToken(token);

  if (!tokenData) {
    logSSO("warn", "Token SSO não encontrado ou inválido");
    return null;
  }

  logSSO("info", "Token encontrado no banco de dados", {
    userId: tokenData.userId,
    customerId: tokenData.customerId,
    expiresAt: new Date(tokenData.expiresAt).toISOString(),
    createdAt: new Date(tokenData.createdAt).toISOString(),
  });

  // Buscar slug do ISO
  try {
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
      logSSO("error", "Customer não encontrado para o token SSO", {
        customerId: tokenData.customerId,
      });
      // Marcar token como usado para evitar reutilização
      await markTokenAsUsed(token);
      return null;
    }

    logSSO("info", "Token SSO validado com sucesso", {
      userId: tokenData.userId,
      customerId: tokenData.customerId,
      customerSlug: customer[0].slug,
    });

    // Marcar token como usado (one-time use)
    await markTokenAsUsed(token);

    return {
      userId: tokenData.userId,
      customerId: tokenData.customerId,
      customerSlug: customer[0].slug || null,
    };
  } catch (error: any) {
    logSSO("error", "Erro ao buscar customer para token SSO", {
      error: error.message,
      customerId: tokenData.customerId,
    });
    // Marcar token como usado para evitar reutilização
    await markTokenAsUsed(token);
    return null;
  }
}


