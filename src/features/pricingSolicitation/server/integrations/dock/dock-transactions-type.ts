import { Metadata } from "next/types";

export type GetTransactionsResponse = {
  meta: Metadata;
  objects: Transaction[];
};

export type Transaction = {
  slug: string;
  active: boolean;
  dtInsert: Date;
  dtUpdate: Date;
  slugAuthorizer: string;
  authorizer: any;
  slugTerminal: string;
  terminal: any;
  slugMerchant: string;
  merchant: any;
  slugCustomer: string;
  customer: any;
  salesChannel: string;
  authorizerMerchantId: string;
  authorizerTerminalId: string;
  muid: string;
  currency: string;
  totalAmount: number;
  transactionStatus: string;
  productType: string;
  rrn: string;
  firstDigits: string;
  lastDigits: string;
  productOrIssuer: string;
  settlementManagementType: string;
  method: string;
  brand: string;
  cancelling: boolean;
  splitType: string;
};
