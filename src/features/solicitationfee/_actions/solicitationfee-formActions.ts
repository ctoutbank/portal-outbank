"use server";
import { db } from "@/db/drizzle";
import { SolicitationFeeSchema } from "../schema/schema";
import { SolicitationFeeInsert, insertSolicitationFee, updateSolicitationFee } from "../server/solicitationfee";
import { solicitationFee } from "../../../../drizzle/schema";

export async function insertSolicitationFeeFormAction(data: SolicitationFeeSchema) {
    try {
        const feeInsert: SolicitationFeeInsert = {
            slug: data.slug || "",
            cnae: data.cnae || null,
            idCustomers: data.idCustomers || null,
            mcc: data.mcc || null,
            cnpjQuantity: data.cnpjQuantity || null,
            monthlyPosFee: data.monthlyPosFee !== undefined ? String(data.monthlyPosFee) : null,
            averageTicket: data.averageTicket !== undefined ? String(data.averageTicket) : null,
            description: data.description || null,
            cnaeInUse: data.cnaeInUse || false,
            status: data.status || "Pendente"
        }

        const result = await insertSolicitationFee(feeInsert);
        
        return result;
    } catch (error) {
        console.error("Erro ao inserir solicitação de tarifa:", error);
        throw error;
    }
}

export async function updateSolicitationFeeFormAction(data: SolicitationFeeSchema) {
    if (!data.id) {
        throw new Error("Id is required");
    }

    try {
        const result = await updateSolicitationFee(data);
        return result;
    } catch (error) {
        console.error("Erro ao atualizar solicitação de tarifa:", error);
        throw error;
    }
} 