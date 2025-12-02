import { z } from "zod";

export const merchantPixAccountSchema = z.object({
  id: z.number().optional(),
  slug: z.string().optional(),
  active: z.boolean().optional(),
  dtinsert: z.date().optional(),
  dtupdate: z.date().optional(),
  idRegistration: z.string().optional(),
  idAccount: z.string().optional(),
  bankNumber: z.string().min(1, "Número do banco é obrigatório"),
  bankBranchNumber: z.string().min(1, "Número da agência é obrigatório"),
  bankBranchDigit: z.string().optional(),
  bankAccountNumber: z.string().min(1, "Número da conta é obrigatório"),
  bankAccountDigit: z.string().min(1, "Dígito da conta é obrigatório"),
  bankAccountType: z.string().min(1, "Tipo de conta é obrigatório"),
  bankAccountStatus: z.string().optional(),
  onboardingPixStatus: z.string().optional(),
  message: z.string().optional(),
  bankName: z.string().optional(),
  idMerchant: z.number(),
  slugMerchant: z.string().optional(),
  useEstablishmentData: z.boolean().optional(),
  merchantcorporateName: z.string().optional(),
  merchantdocumentId: z.string().optional(),
  legalPerson: z.string().optional(),
});

export type MerchantPixAccountSchema = z.infer<typeof merchantPixAccountSchema>;




