"use server";

import { revalidatePath } from "next/cache";
import {
  insertAuthorizer,
  updateAuthorizer,
  deleteAuthorizer,
  deleteAllAuthorizersByMerchantId,
  getAuthorizersByMerchantId,
} from "../server/merchant-authorizer-crud";
import { authorizerSchema } from "../schema/authorizer-schema";
import { toast } from "sonner";

export async function insertAuthorizerFormAction(
  data: {
    type: string;
    conciliarTransacoes: string;
    merchantId?: string;
    tokenCnp?: string;
    terminalId?: string;
    idConta?: string;
    chavePix?: string;
    idMerchant: number;
  }
) {
  try {
    const validatedData = authorizerSchema.parse(data);

    const result = await insertAuthorizer(validatedData);

    if (result) {
      revalidatePath(`/merchants/${data.idMerchant}`);
      return { success: true, id: result };
    }

    return { success: false, error: "Erro ao inserir autorizador" };
  } catch (error: any) {
    console.error("Erro ao inserir autorizador:", error);
    return {
      success: false,
      error: error.message || "Erro ao inserir autorizador",
    };
  }
}

export async function updateAuthorizerFormAction(
  id: number,
  data: {
    type?: string;
    conciliarTransacoes?: string;
    merchantId?: string;
    tokenCnp?: string;
    terminalId?: string;
    idConta?: string;
    chavePix?: string;
  }
) {
  try {
    const result = await updateAuthorizer(id, data);

    if (result) {
      revalidatePath(`/merchants`);
      return { success: true };
    }

    return { success: false, error: "Erro ao atualizar autorizador" };
  } catch (error: any) {
    console.error("Erro ao atualizar autorizador:", error);
    return {
      success: false,
      error: error.message || "Erro ao atualizar autorizador",
    };
  }
}

export async function deleteAuthorizerFormAction(id: number) {
  try {
    const result = await deleteAuthorizer(id);

    if (result) {
      revalidatePath(`/merchants`);
      return { success: true };
    }

    return { success: false, error: "Erro ao deletar autorizador" };
  } catch (error: any) {
    console.error("Erro ao deletar autorizador:", error);
    return {
      success: false,
      error: error.message || "Erro ao deletar autorizador",
    };
  }
}

export async function getAuthorizersFormAction(idMerchant: number) {
  try {
    const authorizers = await getAuthorizersByMerchantId(idMerchant);
    return { success: true, authorizers };
  } catch (error: any) {
    console.error("Erro ao buscar autorizadores:", error);
    return {
      success: false,
      error: error.message || "Erro ao buscar autorizadores",
      authorizers: [],
    };
  }
}

export async function saveAuthorizersFormAction(
  idMerchant: number,
  authorizers: Array<{
    id?: number;
    type: string;
    conciliarTransacoes: string;
    merchantId?: string;
    tokenCnp?: string;
    terminalId?: string;
    idConta?: string;
    chavePix?: string;
  }>
) {
  try {
    // Primeiro, deletar todos os autorizadores existentes (soft delete)
    await deleteAllAuthorizersByMerchantId(idMerchant);

    // Inserir os novos autorizadores
    const results = await Promise.all(
      authorizers.map((auth) =>
        insertAuthorizerFormAction({
          ...auth,
          idMerchant,
        })
      )
    );

    const hasErrors = results.some((r) => !r.success);

    if (hasErrors) {
      return {
        success: false,
        error: "Alguns autorizadores não puderam ser salvos",
      };
    }

    revalidatePath(`/merchants/${idMerchant}`);
    return { success: true };
  } catch (error: any) {
    console.error("Erro ao salvar autorizadores:", error);
    return {
      success: false,
      error: error.message || "Erro ao salvar autorizadores",
    };
  }
}

