import {z} from "zod"

export const SchemaUser = z.object({
    firstName: z.string().min(1, "Nome é obrigatório"),
    lastName: z.string().min(1, "Sobrenome é obrigatório"),
    email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
    password: z.string()
        .min(6, "A senha deve ter pelo menos 6 caracteres")
        .or(z.literal('')) // Permite string vazia para casos de edição
        .optional(),
    idCustomer: z.number().nullable(),
    idProfile: z.number().nullable(),
    idAddress: z.number().nullable(),
    selectedMerchants: z.array(z.string()).optional(),
    active: z.boolean().default(true),
    idClerk: z.string().nullable(),
    slug: z.string().optional(),
    id: z.number().optional(),
    dtinsert: z.string().optional(),
    dtupdate: z.string().optional(),
})


export type UserSchema = z.infer<typeof SchemaUser>