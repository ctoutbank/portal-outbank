"use server"

import { insertSolicitationFee, updateSolicitationFee } from "../server/solicitationfee"

export async function saveOrUpdateFeeAction(data: any, id: number | null) {
    try {
        const payload = {
            ...data,
            id: id ?? undefined,
        };

        const savedId = id
            ? await updateSolicitationFee(payload)
            : await insertSolicitationFee(payload)

        return { success: true, id: savedId }
    } catch (e) {
        console.error("Erro ao salvar fee:", e)
        return { success: false }
    }
}