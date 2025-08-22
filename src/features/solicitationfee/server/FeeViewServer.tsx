"use server"

import { insertSolicitationFee, updateSolicitationFee } from "../server/solicitationfee";

type FeeData = Record<string, unknown> & {
    id?: number;

}

export async function saveOrUpdateFeeAction(data: FeeData, id: number | null) {
    try {
        const payload = {
            ...data,
            id: id ?? undefined,
        };

       

        const savedId = id
            ? await updateSolicitationFee(payload as Parameters<typeof updateSolicitationFee>[0])
            : await insertSolicitationFee(payload as Parameters<typeof insertSolicitationFee>[0])

        return { success: true, id: savedId }
    } catch (e) {
        console.error("Erro ao salvar fee:", e)
        return { success: false }
    }
}