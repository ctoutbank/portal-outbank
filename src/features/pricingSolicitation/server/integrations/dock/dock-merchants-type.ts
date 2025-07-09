export type Address = {
  streetAddress: string;
  streetNumber: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
};

export type Contact = {
  name: string;
  documentId: string;
  email: string;
  areaCode: string;
  number: string;
  phoneType: string;
  address: Address;
  birthDate: string;
  mothersName: string;
  isPartnerContact: boolean;
  isPep: boolean;
};

export type Category = {
  slug: string;
  active: boolean;
  dtInsert: string;
  dtUpdate: string;
  name: string;
  mcc: string;
  cnae: string;
  anticipationRiskFactorCp: number;
  anticipationRiskFactorCnp: number;
  waitingPeriodCp: number;
  waitingPeriodCnp: number;
};

export type LegalNature = {
  slug: string;
  active: boolean;
  dtInsert: string;
  dtUpdate: string;
  name: string;
  code: string;
};

export type SaleAgent = {
  slug: string;
  active: boolean;
  dtInsert: string;
  dtUpdate: string;
  firstName: string;
  lastName: string;
  documentId: string;
  email: string;
  slugCustomer: string;
};

export type Configuration = {
  slug: string;
  active: boolean;
  dtInsert: string;
  dtUpdate: string;
  lockCpAnticipationOrder: boolean;
  lockCnpAnticipationOrder: boolean;
  url: string;
};

export type MerchantPixAccount = {
  slug: string;
  active: boolean;
  dtInsert: string;
  dtUpdate: string;
  idRegistration: string;
  idAccount: string;
  bankNumber: string;
  bankBranchNumber: string;
  bankBranchDigit: string;
  bankAccountNumber: string;
  bankAccountDigit: string;
  bankAccountType: string;
  bankAccountStatus: string;
  onboardingPixStatus: string;
  message: string;
  bankName: string;
};

export type Merchant = {
  slug: string;
  active: boolean;
  dtInsert: string;
  dtUpdate: string;
  merchantId: string;
  name: string;
  documentId: string;
  corporateName: string;
  email: string;
  areaCode: string;
  number: string;
  phoneType: string;
  language: string;
  timezone: string;
  contacts: Contact;
  address: Address;
  mainOffice?: Record<string, unknown>;
  slugCustomer: string;
  category: Category;
  legalNature: LegalNature;
  saleAgent: SaleAgent;
  riskAnalysisStatus: string;
  riskAnalysisStatusJustification: string;
  legalPerson: string;
  openingDate: string;
  inclusion: string;
  openingDays: string;
  openingHour: string;
  closingHour: string;
  municipalRegistration: string;
  stateSubcription: string;
  configuration: Configuration;
  hasTef: boolean;
  hasPix: boolean;
  hasTop: boolean;
  merchantPixAccount: MerchantPixAccount;
  establishmentFormat: string;
  revenue: string;
};
