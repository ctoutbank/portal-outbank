"use server";

import {
  approvePricingSolicitation,
  completePricingSolicitation,
  getPricingSolicitationById,
  rejectPricingSolicitation,
  updatePricingSolicitation,
} from "../server/pricing-solicitation";

export async function approveAction(id: number) {
  try {
    const result = await approvePricingSolicitation(id);
    return { success: true, data: result };
  } catch (error) {
    console.error("Erro ao aprovar solicitação:", error);
    return { success: false, error: "Não foi possível aprovar a solicitação" };
  }
}

export async function completeAction(id: number) {
  try {
    const result = await completePricingSolicitation(id);
    return { success: true, data: result };
  } catch (error) {
    console.error("Erro ao completar solicitação:", error);
    return {
      success: false,
      error: "Não foi possível completar a solicitação",
    };
  }
}

export async function rejectAction(id: number, reason?: string) {
  try {
    const result = await rejectPricingSolicitation(id, reason);
    return { success: true, data: result };
  } catch (error) {
    console.error("Erro ao rejeitar solicitação:", error);
    return { success: false, error: "Não foi possível rejeitar a solicitação" };
  }
}

export async function updateToSendDocumentsAction(id: number) {
  try {
    // Buscar a solicitação atual
    const solicitation = await getPricingSolicitationById(id);

    if (!solicitation) {
      throw new Error("Solicitação não encontrada");
    }

    // Atualiza apenas o status para SEND_DOCUMENTS
    await updatePricingSolicitation({
      ...solicitation,
      status: "SEND_DOCUMENTS",
      dtupdate: new Date().toISOString(),
    });

    return {
      success: true,
      message: "Status atualizado para aguardando documentos",
    };
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return {
      success: false,
      error: "Não foi possível atualizar o status da solicitação",
    };
  }
}
