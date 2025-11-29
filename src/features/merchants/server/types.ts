import { type FeeData } from "./fee-actions";
import { FileItem } from "@/features/categories/server/upload";
import {
  addresses,
  configurations,
  contacts,
  merchantBankAccounts,
  merchantpixaccount,
} from "../../../../drizzle/schema";
import {
  CnaeMccDropdown,
  EstablishmentFormatDropdown,
  LegalNatureDropdown,
  SalesAgentDropdown,
} from "./merchant-helpers";
import {
  accountTypeDropdown,
  banckDropdown,
} from "./merchant-pix-account";

interface MerchantData {
  id: number;
  slug: string | null;
  active: boolean;
  dtinsert: string;
  dtupdate: string | null;
  idMerchant: string | null;
  name: string | null;
  idDocument: string | null;
  corporateName: string | null;
  email: string | null;
  areaCode: string | null;
  number: string | null;
  phoneType: string | null;
  language: string | null;
  timezone: string | null;
  slugCustomer: string | null;
  riskAnalysisStatus: string | null;
  riskAnalysisStatusJustification: string | null;
  legalPerson: string | null;
  openingDate: string | null;
  inclusion: string | null;
  openingDays: string | null;
  openingHour: string | null;
  closingHour: string | null;
  municipalRegistration: string | null;
  stateSubcription: string | null;
  hasTef: boolean;
  hasPix: boolean;
  hasTop: boolean;
  establishmentFormat: string | null;
  revenue: number | null;
  idCategory: number | null;
  slugCategory: string | null;
  idLegalNature: number | null;
  slugLegalNature: string | null;
  idSalesAgent: number | null;
  slugSalesAgent: string | null;
  idConfiguration: number | null;
  slugConfiguration: string | null;
  idAddress: number | null;
  idMerchantPrice: number | null;
  idCustomer: number | null;
  idMerchantBankAccount: number | null;
  cnae: string;
  mcc: string;
  customer: string | null;
  registration: string | null;
}

interface AddressData {
  id: number;
  streetAddress: string | null;
  streetNumber: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zipCode: string | null;
}

interface ContactData {
  contacts: typeof contacts.$inferSelect;
  addresses: typeof addresses.$inferSelect;
}

interface ConfigurationData {
  configurations: typeof configurations.$inferSelect;
}

interface MerchantBankAccountData {
  merchantBankAccount: typeof merchantBankAccounts.$inferSelect;
}

interface PixAccountData {
  pixaccounts: typeof merchantpixaccount.$inferSelect | null;
  merchantcorporateName: string;
  merchantdocumentId: string;
  legalPerson: string;
}

export interface TransactionPrice {
  id: number;
  slug: string;
  active: boolean;
  dtinsert: string;
  dtupdate: string;
  idMerchantPriceGroup: number;
  installmentTransactionFeeStart: number;
  installmentTransactionFeeEnd: number;
  cardTransactionMdr: number;
  cardTransactionFee: number;
  nonCardTransactionFee: number;
  nonCardTransactionMdr: number;
  producttype: string;
  cardCompulsoryAnticipationMdr?: number | null;
  noCardCompulsoryAnticipationMdr?: number | null;
}

export interface MerchantPriceGroup {
  id: number;
  name: string;
  active: boolean;
  dtinsert: string;
  dtupdate: string;
  idMerchantPrice: number;
  listMerchantTransactionPrice: TransactionPrice[];
}

export interface MerchantPrice {
  id: number;
  name: string;
  active: boolean;
  dtinsert: string;
  dtupdate: string;
  tableType: string;
  slugMerchant: string;
  compulsoryAnticipationConfig: number;
  anticipationType: string;
  eventualAnticipationFee: number;
  cardPixMdr: number;
  cardPixCeilingFee: number;
  cardPixMinimumCostFee: number;
  nonCardPixMdr: number;
  nonCardPixCeilingFee: number;
  nonCardPixMinimumCostFee: number;
  merchantpricegroup: MerchantPriceGroup[];
}

interface MerchantPriceGroupProps {
  merchantPrice: MerchantPrice;
  merchantpricegroup: MerchantPriceGroup[];
  availableFees?: FeeData[];
}

export interface MerchantTabsProps {
  merchant: MerchantData;
  address: AddressData;
  Contacts: ContactData;
  addresses: AddressData;
  merchantPixAccount: PixAccountData;
  configurations: ConfigurationData;
  cnaeMccList: CnaeMccDropdown[];
  legalNatures: LegalNatureDropdown[];
  establishmentFormatList: EstablishmentFormatDropdown[];
  DDAccountType: accountTypeDropdown[];
  DDBank: banckDropdown[];
  merchantBankAccount: MerchantBankAccountData;
  merchantPriceGroupProps: MerchantPriceGroupProps;
  permissions: string[];
  merchantFiles?: FileItem[];
  isCreating?: boolean;
  DDSalesAgent: SalesAgentDropdown[];
  isSuperAdmin?: boolean;
}

