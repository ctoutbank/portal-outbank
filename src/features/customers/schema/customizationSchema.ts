import { z } from "zod";

export const CustomizationSchema = z.object({
  subdomain: z
    .string()
    .min(1, "Nome do subdomínio é obrigatório")
    .max(15, "Nome do subdomínio deve ter no máximo 15 caracteres")
    .regex(
      /^[a-zA-Z0-9À-ÿ\s]+$/,
      "Nome do subdomínio deve conter apenas letras, números e espaços"
    )
    .transform((val) => val.toLowerCase().trim()),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  // Cores de personalização do login
  loginButtonColor: z.string().optional(),
  loginButtonTextColor: z.string().optional(),
  loginTitleColor: z.string().optional(),
  loginTextColor: z.string().optional(),
  image: z.any().optional(),
  customerId: z.string().min(1, "ID do cliente é obrigatório"),
  id: z.number().optional(),
});

export type CustomizationSchemaType = z.infer<typeof CustomizationSchema>;
