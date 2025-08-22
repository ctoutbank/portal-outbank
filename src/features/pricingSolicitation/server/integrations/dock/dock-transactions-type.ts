import { Metadata } from "next/types";

export type GetTransactionsResponse = {
  meta: Metadata;
  objects: Transaction[];
};

export type Authorizer = {
  id: string;
  name: string;
};

export type Terminal = {
  id: string;
  name: string;
};

export type Merchant = {
  id: string;
  name: string;
};

export type Customer = {
  id: string;
  name: string;
};

export type Transaction = {
  slug: string;
  active: boolean;
  dtInsert: Date;
  dtUpdate: Date;
  slugAuthorizer: string;
  authorizer: Authorizer;
  slugTerminal: string;
  terminal: Terminal;
  slugMerchant: string;
  merchant: Merchant;
  slugCustomer: string;
  customer: Customer;
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
