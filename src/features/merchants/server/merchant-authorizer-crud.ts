"use server";

import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { merchantAuthorizers } from "../../../../drizzle/schema";
import { generateSlug } from "@/lib/utils";

export interface AuthorizerData {
  id: number;
  type: string;
  conciliarTransacoes: string;
  merchantId?: string;
  tokenCnp?: string;
  terminalId?: string;
  idConta?: string;
  chavePix?: string;
  idMerchant: number;
}

// Buscar autorizadores por ID do merchant
export async function getAuthorizersByMerchantId(
  idMerchant: number
): Promise<AuthorizerData[]> {
  try {
    const result = await db
      .select()
      .from(merchantAuthorizers)
      .where(
        and(
          eq(merchantAuthorizers.idMerchant, idMerchant),
          eq(merchantAuthorizers.active, true)
        )
      );

    return result.map((auth) => ({
      id: auth.id,
      type: auth.type || "",
      conciliarTransacoes: auth.conciliarTransacoes || "nao",
      merchantId: auth.merchantId || undefined,
      tokenCnp: auth.tokenCnp || undefined,
      terminalId: auth.terminalId || undefined,
      idConta: auth.idConta || undefined,
      chavePix: auth.chavePix || undefined,
      idMerchant: auth.idMerchant ?? idMerchant,
    }));
  } catch (error) {
    console.error("Erro ao buscar autorizadores:", error);
    return [];
  }
}

// Inserir autorizador
export async function insertAuthorizer(
  data: Omit<AuthorizerData, "id">
): Promise<number | null> {
  try {
    const slug = generateSlug();
    const now = new Date().toISOString();

    const result = await db
      .insert(merchantAuthorizers)
      .values({
        slug,
        active: true,
        dtinsert: now,
        dtupdate: now,
        type: data.type,
        conciliarTransacoes: data.conciliarTransacoes,
        merchantId: data.merchantId || null,
        tokenCnp: data.tokenCnp || null,
        terminalId: data.terminalId || null,
        idConta: data.idConta || null,
        chavePix: data.chavePix || null,
        idMerchant: data.idMerchant,
      })
      .returning({ id: merchantAuthorizers.id });

    return result[0]?.id || null;
  } catch (error) {
    console.error("Erro ao inserir autorizador:", error);
    return null;
  }
}

// Atualizar autorizador
export async function updateAuthorizer(
  id: number,
  data: Partial<Omit<AuthorizerData, "id" | "idMerchant">>
): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    await db
      .update(merchantAuthorizers)
      .set({
        dtupdate: now,
        type: data.type,
        conciliarTransacoes: data.conciliarTransacoes,
        merchantId: data.merchantId || null,
        tokenCnp: data.tokenCnp || null,
        terminalId: data.terminalId || null,
        idConta: data.idConta || null,
        chavePix: data.chavePix || null,
      })
      .where(eq(merchantAuthorizers.id, id));

    return true;
  } catch (error) {
    console.error("Erro ao atualizar autorizador:", error);
    return false;
  }
}

// Deletar autorizador (soft delete)
export async function deleteAuthorizer(id: number): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    await db
      .update(merchantAuthorizers)
      .set({
        active: false,
        dtupdate: now,
      })
      .where(eq(merchantAuthorizers.id, id));

    return true;
  } catch (error) {
    console.error("Erro ao deletar autorizador:", error);
    return false;
  }
}

// Deletar todos os autorizadores de um merchant (soft delete)
export async function deleteAllAuthorizersByMerchantId(
  idMerchant: number
): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    await db
      .update(merchantAuthorizers)
      .set({
        active: false,
        dtupdate: now,
      })
      .where(eq(merchantAuthorizers.idMerchant, idMerchant));

    return true;
  } catch (error) {
    console.error("Erro ao deletar autorizadores:", error);
    return false;
  }
}

