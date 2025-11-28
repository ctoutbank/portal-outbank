import { z } from "zod";

export const authorizerSchema = z.object({
  type: z.string().min(1, "Tipo do autorizador é obrigatório"),
  conciliarTransacoes: z.enum(["sim", "nao"], {
    required_error: "Conciliar transações é obrigatório",
  }),
  merchantId: z.string().optional(),
  tokenCnp: z.string().optional(),
  terminalId: z.string().optional(),
  idConta: z.string().optional(),
  chavePix: z.string().optional(),
  idMerchant: z.number().min(1, "ID do merchant é obrigatório"),
});

export type AuthorizerSchema = z.infer<typeof authorizerSchema>;

