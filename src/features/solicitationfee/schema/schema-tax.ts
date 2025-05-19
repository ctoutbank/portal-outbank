import { z } from "zod";




export const TaxEditFormSchema = z.object({
    solicitationFee: z.object({
        id: z.number().optional(),
        slug: z.string().optional(),
        cnae: z.string().optional(),
        idCustomers: z.number().optional(),
        mcc: z.string().optional(),
        cnpjQuantity: z.number().optional(),
        monthlyPosFee: z.number().optional(),
        averageTicket: z.number().optional(),
        description: z.string().optional(),
        cnaeInUse: z.boolean().optional(),
        status: z.string().optional(),
        dtinsert: z.date().optional(),
        dtupdate: z.date().optional(),
        solicitationFeeBrands: z.array(z.object({
            id: z.number().optional(),
            slug: z.string().optional(),
            brand: z.string().optional(),
            solicitationFeeId: z.number().optional(),
            dtinsert: z.date().optional(),
            dtupdate: z.date().optional(),
            solicitationBrandProductTypes: z.array(z.object({
                id: z.number().optional(),
                slug: z.string().optional(),
                productType: z.string().optional(),
                fee: z.string().optional(),
                feeAdmin: z.string().optional(),
                feeDock: z.string().optional(),
                transactionFeeStart: z.string().optional(),
                transactionFeeEnd: z.string().optional(),
                pixMinimumCostFee: z.string().optional(),
                pixCeilingFee: z.string().optional(),
                transactionAnticipationMdr: z.string().optional(),
                dtinsert: z.date().optional(),
                dtupdate: z.date().optional(),
            })),
        })),
    }),
    
});

export type TaXEditFormSchema = z.infer<typeof TaxEditFormSchema>;




export type taxAdmin={
    status: string,
    
}