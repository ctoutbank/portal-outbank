import { z } from "zod";

export const SchemaCustomer = z.object({
  id: z.number().optional(),
  slug: z.string().optional(),
  name: z.string().min(1),
  customerId: z.string().optional(),
  settlementManagementType: z.string().optional(),
  idParent: z.number().optional(),
});

export type CustomerSchema = z.infer<typeof SchemaCustomer>;
