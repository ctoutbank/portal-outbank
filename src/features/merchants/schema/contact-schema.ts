import { z } from "zod";

export const schemaContact = z
  .object({
    id: z.number().optional(),
    name: z.string().min(1, "Nome é obrigatório"),
    idDocument: z.string().optional(),
    email: z.string().email("Email inválido"),
    areaCode: z.string().min(2, "DDD é obrigatório"),
    number: z.string().min(1, "Número é obrigatório"),
    phoneType: z.string().optional(),
    birthDate: z.string().optional(),
    mothersName: z.string().optional(),
    isPartnerContact: z.boolean().optional(),
    isPep: z.boolean().optional(),
    idMerchant: z.number().optional(),
    slugMerchant: z.string().max(50).optional(),
    idAddress: z.number().optional(),
    icNumber: z.string().optional(),
    icDateIssuance: z.date().optional(),
    icDispatcher: z.string().optional(),
    icFederativeUnit: z.string().optional(),
  })
  .refine(
    (data) => {
      // Se qualquer um dos campos de RG estiver preenchido, todos devem estar preenchidos
      const rgFieldsFilled = [
        !!data.icNumber,
        !!data.icDateIssuance,
        !!data.icDispatcher,
        !!data.icFederativeUnit,
      ];

      // Se nenhum campo estiver preenchido, está ok
      if (rgFieldsFilled.every((field) => !field)) {
        return true;
      }

      // Se algum campo estiver preenchido, todos devem estar preenchidos
      return rgFieldsFilled.every((field) => field);
    },
    {
      message:
        "Se um dos campos de RG for preenchido, todos os campos (Número do RG, Data de emissão, Órgão expedidor e UF) devem ser preenchidos",
      path: ["icNumber"],
    }
  );

export type ContactSchema = z.infer<typeof schemaContact>;


