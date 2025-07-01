import { z } from "zod";

export const schemaCategories = z.object({
  id: z.number().optional(),
  slug: z.string().optional(),
  name: z.string().optional(),
  active: z.boolean().optional(),
  dtinsert: z.date().optional(),
  dtupdate: z.date().optional(),
  mcc: z.string().optional(),
  cnae: z.string().optional(),
  anticipation_risk_factor_cp: z.string().optional(),
  anticipation_risk_factor_cnp: z.string().optional(),
  waiting_period_cp: z.string().optional(),
  waiting_period_cnp: z.string().optional(),
  idSolicitationFee: z.string().optional(),
});

export type CategoriesSchema = z.infer<typeof schemaCategories>;
