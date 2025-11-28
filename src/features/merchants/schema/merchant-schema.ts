import { z } from "zod";

export const schemaMerchant = z.object({
  id: z.number().optional(),
  slug: z.string().max(50).optional(),
  active: z.boolean().optional(),
  dtinsert: z.date().optional(),
  dtupdate: z.date().optional(),
  idMerchant: z.string().max(20).optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  idDocument: z.string().min(1, "CNPJ é obrigatório"),
  corporateName: z.string().min(1, "Razão Social é obrigatória"),
  email: z.string().email("Email inválido"),
  areaCode: z.string().min(2, "DDD é obrigatório"),
  number: z.string().min(1, "Número é obrigatório"),
  phoneType: z.string().max(2).optional(),
  language: z.string().max(10).optional(),
  timezone: z.string().max(10).optional(),
  slugCustomer: z.string().max(50).optional(),
  riskAnalysisStatus: z.string().max(20).optional(),
  riskAnalysisStatusJustification: z.string().optional(),
  legalPerson: z.string().optional(),
  openingDate: z.date().optional(),
  inclusion: z.string().max(255).optional(),
  openingDays: z.string().optional(),
  openingHour: z.string().optional(),
  closingHour: z.string().optional(),
  municipalRegistration: z.string().optional(),
  stateSubcription: z.string().optional(),
  hasTef: z.boolean().optional(),
  hasPix: z.boolean().optional(),
  hasTop: z.boolean().optional(),
  establishmentFormat: z.string().optional(),
  revenue: z.number().optional(),
  idCategory: z.number().optional(),
  slugCategory: z.string().max(50).optional(),
  idLegalNature: z.number().optional(),
  slugLegalNature: z.string().max(50).optional(),
  idSalesAgent: z.number().optional(),
  slugSalesAgent: z.string().max(50).optional(),
  idConfiguration: z.number().optional(),
  slugConfiguration: z.string().max(50).optional(),
  idAddress: z.number().optional(),
  is_affiliate: z.boolean().optional().nullable(),
  cnae: z.string().max(20).optional().nullable(),
  mcc: z.string().optional(),
  state_registration: z.string().max(20).optional().nullable(),
  legal_nature: z.string().optional().nullable(),
  legal_form: z.string().optional().nullable(),
  id_address: z.number().optional().nullable(),
  id_category: z.number().optional().nullable(),
  id_legal_nature: z.number().optional().nullable(),
  id_sales_agent: z.number().optional().nullable(),
  id_configuration: z.number().optional().nullable(),
  zipCode_address: z.string().max(8).optional(),
  street_address: z.string().max(255).optional(),
  number_address: z.string().max(10).optional(),
  complement_address: z.string().max(255).optional(),
  neighborhood_address: z.string().max(255).optional(),
  city_address: z.string().max(255).optional(),
  state_address: z.string().max(2).optional(),
  country_address: z.string().max(2).optional(),
  idMerchantBankAccount: z.number().optional().nullable(),
  idCustomer: z.number().optional().nullable(),
});

export type MerchantSchema = z.infer<typeof schemaMerchant>;

export const schemaAddress = z.object({
  id: z.number().optional(),
  zipCode: z.string().max(8).min(1, "CEP é obrigatório"),
  street: z.string().max(255).min(1, "Rua é obrigatória"),
  number: z.string().max(10).min(1, "Número é obrigatório"),
  complement: z.string().max(255).optional(),
  neighborhood: z.string().max(255).min(1, "Bairro é obrigatório"),
  city: z.string().max(255).min(1, "Cidade é obrigatória"),
  state: z.string().max(2).min(1, "Estado é obrigatório"),
  country: z.string().min(1, "País é obrigatório"),
});

export type AddressSchema = z.infer<typeof schemaAddress>;

export const schemaMerchantCompany = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Nome é obrigatório").max(255),
  corporateName: z.string().min(1, "Nome Corporativo é obrigatório").max(255),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  idDocument: z.string().min(1, "CNPJ é obrigatório"),
  openingDate: z.date().optional(),
  openingDays: z.string().max(7).optional(),
  openingHour: z.string().max(5).optional(),
  closingHour: z.string().max(5).optional(),
  municipalRegistration: z
    .string()
    .max(20)
    .min(1, "Registro Municipal é obrigatório"),
  stateSubcription: z
    .string()
    .max(20)
    .min(1, "Inscrição Estadual é obrigatória"),
  revenue: z
    .number()
    .positive("A receita deve ser um número positivo")
    .optional(),
  establishmentFormat: z
    .string()
    .max(50)
    .min(1, "Formato de Estabelecimento é obrigatório"),
  legalPerson: z.string().max(50).min(1, "Pessoa Jurídica é obrigatória"),
  cnae: z.string().max(20).min(1, "CNAE é obrigatório"),
  mcc: z.string().max(20).min(1, "MCC é obrigatório"),
  number: z.string().max(10).min(1, "Número é obrigatório"),
  areaCode: z.string().max(5).min(1, "DDD é obrigatório"),
  idLegalNature: z.number().min(1, "Natureza Jurídica é obrigatória"),
  slugLegalNature: z.string().max(50).optional(),
  idMerchantBankAccount: z.number().optional().nullable(),
  idCustomer: z.number().optional().nullable(),
});

export type MerchantCompanySchema = z.infer<typeof schemaMerchantCompany>;

