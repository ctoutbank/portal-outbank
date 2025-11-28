import { z } from "zod";

// Schema para MerchantTransactionPrice
export const merchantTransactionPriceSchema = z.object({
  id: z.number().optional(),
  slug: z.string().max(50).optional(),
  active: z.boolean().optional(),
  dtinsert: z.date().optional(),
  dtupdate: z.date().optional(),
  idMerchantPriceGroup: z.number().optional(),
  installmentTransactionFeeStart: z.number().optional(),
  installmentTransactionFeeEnd: z.number().optional(),
  cardTransactionFee: z.number().optional(),
  cardTransactionMdr: z.number().optional(),
  nonCardTransactionFee: z.number().optional(),
  nonCardTransactionMdr: z.number().optional(),
  producttype: z.string().max(20).optional(),
  cardCompulsoryAnticipationMdr: z.number().optional(),
  noCardCompulsoryAnticipationMdr: z.number().optional(),
});

// Schema para MerchantPriceGroup
export const merchantPriceGroupSchema = z.object({
  id: z.number().optional(),
  slug: z.string().max(50).optional(),
  active: z.boolean().optional(),
  dtinsert: z.date().optional(),
  dtupdate: z.date().optional(),
  brand: z.string().max(25).optional(),
  idGroup: z.number().optional(),
  idMerchantPrice: z.number().optional(),
  // Array de transaction prices
  listMerchantTransactionPrice: z
    .array(merchantTransactionPriceSchema)
    .optional(),
});

// Schema principal para MerchantPrice (inclui as outras tabelas)
export const merchantPriceSchema = z.object({
  id: z.number().optional(),
  slug: z.string().max(50).optional(),
  active: z.boolean().optional(),
  dtinsert: z.date().optional(),
  dtupdate: z.date().optional(),
  name: z.string().min(1, "Nome é obrigatório").max(255),
  tableType: z.string().max(20).optional(),
  slugMerchant: z.string().max(50).optional(),
  compulsoryAnticipationConfig: z.number().optional(),
  anticipationType: z.string().max(25).optional(),
  eventualAnticipationFee: z.number().optional(),
  cardPixMdr: z.number().optional(),
  cardPixCeilingFee: z.number().optional(),
  cardPixMinimumCostFee: z.number().optional(),
  nonCardPixMdr: z.number().optional(),
  nonCardPixCeilingFee: z.number().optional(),
  nonCardPixMinimumCostFee: z.number().optional(),
  // Array de price groups
  merchantpricegroup: z.array(merchantPriceGroupSchema).optional(),
});

// Tipos exportados
export type MerchantTransactionPriceSchema = z.infer<
  typeof merchantTransactionPriceSchema
>;
export type MerchantPriceGroupSchema = z.infer<typeof merchantPriceGroupSchema>;
export type MerchantPriceSchema = z.infer<typeof merchantPriceSchema>;

