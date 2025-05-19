import { z } from "zod";

export const SchemaSolicitationFee = z.object({
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
});

export type SolicitationFeeSchema = z.infer<typeof SchemaSolicitationFee>; 