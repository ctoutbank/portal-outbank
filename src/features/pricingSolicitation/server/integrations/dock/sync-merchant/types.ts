export type Merchant = {
  objects: never[];
  slug: string;
  active: boolean;
  dtInsert: Date;
  dtUpdate: Date;
  merchantId: string;
  name: string;
  documentId: string;
  corporateName?: string;
  email?: string;
  areaCode?: string;
  number?: string;
  phoneType?: "C" | "F"; // "C" para celular, "F" para fixo
  language?: string;
  timezone?: string;
  dtdelete?: Date;
  contacts?: contact[];
  address?: Address;

  slugCustomer?: string;
  category?: category;
  legalNature?: LegalNature;
  saleAgent?: saleAgent;

  riskAnalysisStatus?: string;
  riskAnalysisStatusJustification?: string;
  legalPerson?: string;
  openingDate?: Date;
  inclusion?: string;
  openingDays?: string;
  openingHour?: string;
  closingHour?: string;
  municipalRegistration?: string;
  stateSubcription?: string;
  configuration?: configuration;
  hasTef: boolean;
  hasPix: boolean;
  hasTop: boolean;
  establishmentFormat?: string;
  revenue?: number;
  merchantPixAccount?: merchantPixAccounts;
};

export type Address = {
  id: number;
  streetAddress?: string;
  streetNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
};

export type contact = {
  id: number;
  name?: string;
  documentId?: string;
  email?: string;
  areaCode?: string;
  number?: string;
  phoneType?: "C" | "F"; // Mobile or Fixed
  birthDate?: Date; // YYYY-MM-DD
  mothersName?: string;
  isPartnerContact: boolean;
  isPep: boolean;
  address?: Address;
  icNumber?: string;
  icDateIssuance?: Date;
  icDispatcher?: string;
  icFederativeUnit?: string;
};

export type category = {
  slug: string;
  active: boolean;
  dtInsert: Date;
  dtUpdate: Date;
  name?: string;
  mcc?: string;
  cnae?: string;
  anticipationRiskFactorCp?: number;
  anticipationRiskFactorCnp?: number;
  waitingPeriodCp?: number;
  waitingPeriodCnp?: number;
};

export type LegalNature = {
  slug: string;
  active: boolean;
  dtInsert: Date;
  dtUpdate: Date;
  name?: string;
  code?: string;
};

export type saleAgent = {
  slug: string;
  active: boolean;
  dtInsert: Date;
  dtUpdate: Date;
  firstName: string;
  lastName: string;
  documentId?: string;
  email?: string;
  slugCustomer?: string;
};

export type configuration = {
  slug: string;
  active: boolean;
  dtInsert: Date;
  dtUpdate: Date;
  lockCpAnticipationOrder: boolean;
  lockCnpAnticipationOrder: boolean;
  url?: string;
  anticipationRiskFactorCp?: number | null;
  anticipationRiskFactorCnp?: number | null;
  waitingPeriodCp?: number | null;
  waitingPeriodCnp?: number | null;
};

export type merchantPixAccounts = {
  slug: string;
  active: boolean;
  dtInsert: Date;
  dtUpdate: Date;
  idRegistration?: string;
  idAccount?: string;
  bankNumber?: string;
  bankBranchNumber?: string;
  bankBranchDigit?: string;
  bankAccountNumber?: string;
  bankAccountDigit?: string;
  bankAccountType?: string;
  bankAccountStatus?: string;
  onboardingPixStatus?: string;
  onboardingPixStatusMessage?: string;
  onboardingPixStatusDate?: string;
  message?: string;
  bankName?: string;
};
