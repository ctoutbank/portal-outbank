import { z } from "zod";

// Schema com validação mais flexível para aceitar diferentes formatos de dados
export const TaxEditFormSchema = z.object({
    solicitationFee: z.object({
        id: z.union([z.number(), z.string(), z.null(), z.undefined()]).transform(val => 
            val === null || val === undefined ? 0 : Number(val)
        ).optional(),
        slug: z.string().optional().nullable(),
        cnae: z.string().optional().nullable(),
        idCustomers: z.union([z.number(), z.string(), z.null(), z.undefined()]).transform(val => 
            val === null || val === undefined ? 0 : Number(val)
        ).optional(),
        mcc: z.string().optional().nullable(),
        cnpjQuantity: z.union([z.number(), z.string(), z.null(), z.undefined()]).transform(val => 
            val === null || val === undefined ? 0 : Number(val)
        ).optional(),
        monthlyPosFee: z.union([z.number(), z.string(), z.null(), z.undefined()]).transform(val => 
            val === null || val === undefined ? 0 : Number(val)
        ).optional(),
        averageTicket: z.union([z.number(), z.string(), z.null(), z.undefined()]).transform(val => 
            val === null || val === undefined ? 0 : Number(val)
        ).optional(),
        description: z.string().optional().nullable(),
        cnaeInUse: z.union([z.boolean(), z.string(), z.null(), z.undefined()]).transform(val => 
            val === "true" || val === true ? true : false
        ).optional(),
        status: z.string().optional().nullable(),
        dtinsert: z.union([z.date(), z.string(), z.null(), z.undefined()]).optional(),
        dtupdate: z.union([z.date(), z.string(), z.null(), z.undefined()]).optional(),
        // Adicionando os novos campos para PIX não cartão
        nonCardPixMdr: z.string().optional().nullable(),
        nonCardPixCeilingFee: z.string().optional().nullable(),
        nonCardPixMinimumCostFee: z.string().optional().nullable(),
        noCardTransactionAnticipationMdr: z.string().optional().nullable(),
        nonCardEventualAnticipationFee: z.string().optional().nullable(),
        cardPixMdrAdmin: z.string().optional().nullable(),
        cardPixCeilingFeeAdmin: z.string().optional().nullable(),
        cardPixMinimumCostFeeAdmin: z.string().optional().nullable(),
        nonCardPixMdrAdmin: z.string().optional().nullable(),
        nonCardPixCeilingFeeAdmin: z.string().optional().nullable(),
        nonCardPixMinimumCostFeeAdmin: z.string().optional().nullable(),
        compulsoryAnticipationConfigAdmin: z.string().optional().nullable(),
        eventualAnticipationFeeAdmin: z.string().optional().nullable(),
        nonCardEventualAnticipationFeeAdmin: z.string().optional().nullable(),
        cardPixMdrDock: z.string().optional().nullable(),
        cardPixCeilingFeeDock: z.string().optional().nullable(),
        cardPixMinimumCostFeeDock: z.string().optional().nullable(),
        nonCardPixMdrDock: z.string().optional().nullable(),
        nonCardPixCeilingFeeDock: z.string().optional().nullable(),
        nonCardPixMinimumCostFeeDock: z.string().optional().nullable(),
        compulsoryAnticipationConfigDock: z.string().optional().nullable(),
        eventualAnticipationFeeDock: z.string().optional().nullable(),
        nonCardEventualAnticipationFeeDock: z.string().optional().nullable(),
        // Campos existentes para PIX cartão
        cardPixMdr: z.string().optional().nullable(),
        cardPixCeilingFee: z.string().optional().nullable(),
        cardPixMinimumCostFee: z.string().optional().nullable(),
        // Campos para antecipação
        compulsoryAnticipationConfig: z.union([z.number(), z.string(), z.null(), z.undefined()]).transform(val => 
            val === null || val === undefined ? 0 : Number(val)
        ).optional(),
        eventualAnticipationFee: z.string().optional().nullable(),
        solicitationFeeBrands: z.array(z.object({
            id: z.union([z.number(), z.string(), z.null(), z.undefined()]).transform(val => 
                val === null || val === undefined ? 0 : Number(val)
            ).optional(),
            slug: z.string().optional().nullable(),
            brand: z.string().optional().nullable(),
            solicitationFeeId: z.union([z.number(), z.string(), z.null(), z.undefined()]).transform(val => 
                val === null || val === undefined ? 0 : Number(val)
            ).optional(),
            dtinsert: z.union([z.date(), z.string(), z.null(), z.undefined()]).optional(),
            dtupdate: z.union([z.date(), z.string(), z.null(), z.undefined()]).optional(),
            solicitationBrandProductTypes: z.array(z.object({
                id: z.union([z.number(), z.string(), z.null(), z.undefined()]).transform(val => 
                    val === null || val === undefined ? 0 : Number(val)
                ).optional(),
                slug: z.string().optional().nullable(),
                productType: z.string().optional().nullable(),
                fee: z.string().optional().nullable(),
                feeAdmin: z.string().optional().nullable(),
                feeDock: z.string().optional().nullable(),
                transactionFeeStart: z.string().optional().nullable(),
                transactionFeeEnd: z.string().optional().nullable(),
                pixMinimumCostFee: z.string().optional().nullable(),
                pixCeilingFee: z.string().optional().nullable(),
                transactionAnticipationMdr: z.string().optional().nullable(),
                // Adicionando campos para nonCard
                noCardFee: z.string().optional().nullable(),
                noCardFeeAdmin: z.string().optional().nullable(),
                noCardFeeDock: z.string().optional().nullable(),
                noCardTransactionAnticipationMdr: z.string().optional().nullable(),
                dtinsert: z.union([z.date(), z.string(), z.null(), z.undefined()]).optional(),
                dtupdate: z.union([z.date(), z.string(), z.null(), z.undefined()]).optional(),
            })).optional().default([]),
        })).optional().default([]),
    }),
});

export type TaXEditFormSchema = z.infer<typeof TaxEditFormSchema>;

export type taxAdmin = {
    status: string,
}