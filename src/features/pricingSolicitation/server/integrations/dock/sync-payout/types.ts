export type Meta = {
  limit: number;
  offset: number;
  total_count: number;
};

export type PayoutResponse = {
  meta: Meta;
  objects: Array<Payout>;
};

export type Payout = {
  slug: string;
  payoutId: string;
  slugMerchant: string;
  merchant: Merchant;
  rrn: string;
  transactionDate: string;
  productType: string;
  type: string;
  brand: string;
  installmentNumber: number;
  installments: number;
  installmentAmount: number;
  transactionMdr: number;
  transactionMdrFee: number;
  transactionFee: number;
  settlementAmount: number;
  expectedSettlementDate: string;
  status: string;
  receivableAmount: number;
  settlementDate: string;
  slugCustomer: string;
  customer: Customer;
  effectivePaymentDate: string;
  settlementUniqueNumber: string;
  anticipationAmount: number | null;
  anticipationBlockStatus: string;
  slugMerchantSplit: string | null;
};

export type Merchant = {
  slug: string;
  name: string;
  documentId: string;
};

export type Customer = {
  slug: string;
  name: string;
  customerId: string;
  settlementManagementType: string;
  paymentInstitution: PaymentInstitution;
};

export type PaymentInstitution = {
  slug: string;
  name: string;
  customerId: string;
  settlementManagementType: string;
};

export type InsertPayout = {
  slug: string;
  payoutId: string;
  slugMerchant: string;
  idMerchant: number;
  rrn: string;
  transactionDate: string;
  productType: string;
  type: string;
  brand: string;
  installmentNumber: number;
  installments: number;
  installmentAmount: string;
  transactionMdr: string;
  transactionMdrFee: string;
  transactionFee: string;
  settlementAmount: string;
  expectedSettlementDate: string;
  status: string;
  receivableAmount: string;
  settlementDate: string;
  slugCustomer: string;
  idCustomer: number;
  effectivePaymentDate: string;
  settlementUniqueNumber: string;
  anticipationAmount: string;
  anticipationBlockStatus: string;
  slugMerchantSplit: string;
};
