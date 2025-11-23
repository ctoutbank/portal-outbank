"use server";

import { db } from "@/lib/db";
import { ssoTokens } from "@/lib/db";
import { eq, and, lt } from "drizzle-orm";
import { nanoid } from "nanoid";

// Função auxiliar para logging
function logStorage(level: "info" | "error" | "warn", message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[SSO Storage ${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  if (data) {
    console.log(logMessage, JSON.stringify(data, null, 2));
  } else {
    console.log(logMessage);
  }
}

export interface SSOTokenData {
  userId: number;
  customerId: number;
  expiresAt: number;
  createdAt: number;
}

/**
 * Gera um token SSO e armazena no banco de dados
 * @param userId - ID do usuário
 * @param customerId - ID do ISO (customer)
 * @returns Token SSO válido por 5 minutos
 */
export async function storeSSOToken(
  userId: number,
  customerId: number
): Promise<string> {
  logStorage("info", "Armazenando token SSO no banco", { userId, customerId });

  // Gerar token único
  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
  const createdAt = new Date();

  try {
    await db.insert(ssoTokens).values({
      token,
      userId,
      customerId,
      expiresAt: expiresAt.toISOString(),
      createdAt: createdAt.toISOString(),
      used: false,
    });

    logStorage("info", "Token SSO armazenado com sucesso", {
      token: token.substring(0, 8) + "...",
      userId,
      customerId,
      expiresAt: expiresAt.toISOString(),
    });

    // Limpar tokens expirados em background (não bloquear)
    cleanupExpiredTokens().catch((error) => {
      logStorage("error", "Erro ao limpar tokens expirados", { error: error.message });
    });

    return token;
  } catch (error: any) {
    logStorage("error", "Erro ao armazenar token SSO", {
      error: error.message,
      userId,
      customerId,
    });
    throw new Error("Erro ao armazenar token SSO");
  }
}

/**
 * Valida e recupera um token SSO do banco de dados
 * @param token - Token SSO a validar
 * @returns Dados do token ou null se inválido/expirado
 */
export async function retrieveSSOToken(token: string): Promise<SSOTokenData | null> {
  logStorage("info", "Recuperando token SSO do banco", {
    token: token.substring(0, 8) + "...",
  });

  try {
    const result = await db
      .select({
        id: ssoTokens.id,
        token: ssoTokens.token,
        userId: ssoTokens.userId,
        customerId: ssoTokens.customerId,
        expiresAt: ssoTokens.expiresAt,
        createdAt: ssoTokens.createdAt,
        used: ssoTokens.used,
      })
      .from(ssoTokens)
      .where(and(eq(ssoTokens.token, token), eq(ssoTokens.used, false)))
      .limit(1);

    if (!result || result.length === 0) {
      logStorage("warn", "Token SSO não encontrado ou já usado");
      return null;
    }

    const tokenData = result[0];

    // Verificar se o token expirou
    const expiresAt = new Date(tokenData.expiresAt).getTime();
    const now = Date.now();

    if (expiresAt < now) {
      logStorage("warn", "Token SSO expirado", {
        expiresAt: new Date(expiresAt).toISOString(),
        now: new Date(now).toISOString(),
      });
      // Marcar como usado para limpeza posterior
      await markTokenAsUsed(token);
      return null;
    }

    logStorage("info", "Token SSO recuperado com sucesso", {
      userId: tokenData.userId,
      customerId: tokenData.customerId,
      expiresAt: new Date(expiresAt).toISOString(),
    });

    return {
      userId: tokenData.userId,
      customerId: tokenData.customerId,
      expiresAt,
      createdAt: new Date(tokenData.createdAt).getTime(),
    };
  } catch (error: any) {
    logStorage("error", "Erro ao recuperar token SSO", {
      error: error.message,
      token: token.substring(0, 8) + "...",
    });
    return null;
  }
}

/**
 * Marca um token como usado (one-time use)
 * @param token - Token SSO a marcar como usado
 */
export async function markTokenAsUsed(token: string): Promise<void> {
  try {
    await db
      .update(ssoTokens)
      .set({ used: true })
      .where(eq(ssoTokens.token, token));

    logStorage("info", "Token SSO marcado como usado", {
      token: token.substring(0, 8) + "...",
    });
  } catch (error: any) {
    logStorage("error", "Erro ao marcar token como usado", {
      error: error.message,
      token: token.substring(0, 8) + "...",
    });
  }
}

/**
 * Remove tokens expirados do banco de dados
 * @returns Número de tokens removidos
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const now = new Date().toISOString();
    
    const result = await db
      .delete(ssoTokens)
      .where(lt(ssoTokens.expiresAt, now));

    // Também remover tokens marcados como usados há mais de 1 hora
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await db
      .delete(ssoTokens)
      .where(and(eq(ssoTokens.used, true), lt(ssoTokens.createdAt, oneHourAgo)));

    logStorage("info", "Limpeza de tokens expirados concluída");
    return 0; // Drizzle não retorna número de linhas afetadas diretamente
  } catch (error: any) {
    logStorage("error", "Erro ao limpar tokens expirados", {
      error: error.message,
    });
    return 0;
  }
}

