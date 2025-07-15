import { z } from "zod";

export const schemaCategories = z.object({
  id: z.number(),
  slug: z.string().nullable(),
  name: z.string().nullable(),
  active: z.boolean().nullable(),
  dtinsert: z.string().nullable(),
  dtupdate: z.string().nullable(),
  mcc: z.string().nullable(),
  cnae: z.string().nullable(),
  anticipation_risk_factor_cp: z.number().nullable(),
  anticipation_risk_factor_cnp:  z.number().nullable(),
  waiting_period_cp: z.number().nullable(),
  waiting_period_cnp: z.number().nullable(),
  idSolicitationFee: z.number().nullable(),
});

export type CategoriesSchema = z.infer<typeof schemaCategories>;

export const schemaPricingBrandProductTypeAdmin = z.object({
  name: z.string().optional(),
  feeAdmin: z.string().optional(),
  noCardFeeAdmin: z.string().optional(),
  transactionFeeStart: z.string().optional(),
  transactionFeeEnd: z.string().optional(),
  transactionAnticipationMdr: z.string().optional(),
});

export const schemaPricingSolicitationBrandAdmin = z.object({
  name: z.string().optional(),
  productTypes: z.array(schemaPricingBrandProductTypeAdmin),
});

export const schemaPricingSolicitationAdmin = z
  .object({
    cnae: z.string().min(1, "CNAE é obrigatório"),
    mcc: z.string().min(1, "MCC é obrigatório"),
    cnpjQuantity: z.string().min(1, "Quantidade de CNPJs é obrigatória"),
    averageTicket: z.string().min(1, "Ticket médio é obrigatório"),
    monthlyPosFee: z.string().min(1, "TPV mensal é obrigatório"),
    cnaeInUse: z.boolean().optional().nullable(),
    description: z.string().optional().nullable(),
    brands: z.array(schemaPricingSolicitationBrandAdmin).optional().nullable(),
    cardPixMdrAdmin: z.string().optional(),
    cardPixCeilingFeeAdmin: z.string().optional(),
    cardPixMinimumCostFeeAdmin: z.string().optional(),
    nonCardPixMdrAdmin: z.string().optional(),
    nonCardPixCeilingFeeAdmin: z.string().optional(),
    nonCardPixMinimumCostFeeAdmin: z.string().optional(),
    eventualAnticipationFeeAdmin: z.string().optional(),
    nonCardEventualAnticipationFeeAdmin: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.cnaeInUse === true) {
        return !!data.description;
      }
      return true;
    },
    {
      message: "Descrição é obrigatória",
      path: ["description"],
    }
  );

export type PricingSolicitationSchemaAdmin = z.infer<
  typeof schemaPricingSolicitationAdmin
>;
