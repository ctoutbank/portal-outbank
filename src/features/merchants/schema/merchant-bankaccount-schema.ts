import { z } from "zod";

export const merchantBankAccountSchema = z.object({
  id: z.number().optional(),
  documentId: z
    .string()
    .min(11, "CPF/CNPJ deve ter entre 11 e 14 caracteres")
    .max(14, "CPF/CNPJ deve ter entre 11 e 14 caracteres"),
  corporateName: z
    .string()
    .min(1, "Razão Social é obrigatória")
    .max(200, "Razão Social deve ter no máximo 200 caracteres"),
  legalPerson: z.string().min(1, "Tipo de Pessoa é obrigatório"),
  bankBranchNumber: z
    .string()
    .min(1, "Agência é obrigatória")
    .max(4, "Agência deve ter no máximo 4 caracteres"),
  bankBranchCheckDigit: z
    .string()
    .max(2, "Dígito da agência deve ter no máximo 2 caracteres")
    .optional(),
  accountNumber: z
    .string()
    .min(1, "Conta é obrigatória")
    .max(15, "Conta deve ter no máximo 15 caracteres"),
  accountNumberCheckDigit: z
    .string()
    .max(2, "Dígito da conta deve ter no máximo 2 caracteres")
    .optional(),
  accountType: z.string().min(1, "Tipo de Conta é obrigatório"),
  compeCode: z
    .string()
    .min(1, "Código do Banco é obrigatório")
    .max(3, "Código do Banco deve ter no máximo 3 caracteres"),
  dtinsert: z.date().optional(),
  dtupdate: z.date().optional(),
  active: z.boolean().optional(),
  slug: z.string().optional(),
  idMerchant: z.number().optional(),
});

export type MerchantBankAccountSchema = z.infer<
  typeof merchantBankAccountSchema
>;


