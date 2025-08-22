export type Meta = {
  limit: number;
  offset: number;
  total_count: number;
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

export type Settlement = {
  slug: string;
  active: boolean;
  dtInsert: string;
  dtUpdate: string;
  batchAmount: number;
  discountFeeAmount: number;
  netSettlementAmount: number;
  totalAnticipationAmount: number;
  totalRestitutionAmount: number;
  pixAmount: number;
  pixNetAmount: number;
  pixFeeAmount: number;
  pixCostAmount: number;
  pendingRestitutionAmount: number;
  totalCreditAdjustmentAmount: number;
  totalDebitAdjustmentAmount: number;
  totalSettlementAmount: number;
  restRoundingAmount: number;
  outstandingAmount: number;
  slugCustomer: string;
  customer: Customer;
  status: string;
  creditStatus: string;
  debitStatus: string;
  anticipationStatus: string;
  pixStatus: string;
  paymentDate: string;
  pendingFinancialAdjustmentAmount: number;
  creditFinancialAdjustmentAmount: number;
  debitFinancialAdjustmentAmount: number;
};

export type SettlementsResponse = {
  meta: Meta;
  objects: Array<Settlement>;
};

export type Merchant = {
  slug: string;
  name: string;
  documentId: string;
};

export type SettlementObject = {
  slug: string;
  active: boolean;
  dtInsert: string;
  dtUpdate: string;
  transactionCount: number;
  adjustmentCount: number;
  batchAmount: number;
  netSettlementAmount: number;
  pixAmount: number;
  pixNetAmount: number;
  pixFeeAmount: number;
  pixCostAmount: number;
  creditAdjustmentAmount: number;
  debitAdjustmentAmount: number;
  totalAnticipationAmount: number;
  totalRestitutionAmount: number;
  pendingRestitutionAmount: number;
  totalSettlementAmount: number;
  pendingFinancialAdjustmentAmount: number;
  creditFinancialAdjustmentAmount: number;
  debitFinancialAdjustmentAmount: number;
  status: string;
  slugMerchant: string;
  merchant: Merchant;
  slugCustomer: string;
  customer: Customer;
  outstandingAmount: number;
  restRoundingAmount: number;
  settlement: Settlement;
};

export type MerchantSettlementsResponse = {
  meta: Meta;
  objects: Array<SettlementObject>;
};

export type MerchantSettlementsOrdersResponse = {
  meta: Meta;
  objects: MerchantSettlementsOrders[];
};

export type MerchantSettlementsOrders = {
  slug: string;
  active: boolean;
  dtInsert: string;
  dtUpdate: string;
  compeCode: string;
  accountNumber: string;
  accountNumberCheckDigit: string;
  slugPaymentInstitution: string;
  paymentInstitution: PaymentInstitution | undefined;
  bankBranchNumber: string;
  accountType: string;
  integrationType: string;
  brand: string;
  productType: string;
  amount: number;
  anticipationAmount: number;
  merchantSettlement: SettlementObject;
  merchantSettlementOrderStatus: string;
  orderTransactionId: string;
  settlementUniqueNumber: string;
  protocolGuidId: string;
  legalPerson: string;
  documentId: string;
  corporateName: string;
  effectivePaymentDate: string;
  lock: boolean;
};

export type PixMerchantSettlementOrders = {
  slug: string;
  active: boolean;
  dtInsert: string;
  dtUpdate: string;
  slugCustomer: string;
  customer: Customer;
  slugMerchant: string;
  merchant: Merchant;
  paymentDate: string;
  authorizerMerchantId: string;
  expectedPaymentDate: string;
  transactionCount: number;
  totalAmount: number;
  totalRefundAmount: number;
  totalNetAmount: number;
  totalFeeAmount: number;
  totalCostAmount: number;
  totalSettlementAmount: number;
  status: string;
  compeCode: string;
  accountNumber: string;
  accountNumberCheckDigit: string;
  bankBranchNumber: string;
  accountType: string;
  legalPerson: string;
  documentId: string;
  corporateName: string;
  effectivePaymentDate: string;
  settlementUniqueNumber: string;
  protocolGuidId: string;
  feeSettlementUniqueNumber: string;
  feeEffectivePaymentDate: string;
  feeProtocolGuidId: string;
  merchantSettlement: SettlementObject;
};

export type PixMerchantSettlementOrdersResponse = {
  meta: Meta;
  objects: PixMerchantSettlementOrders[];
};

export type InsertMerchantSettlementsOrders = {
  slug: string;
  active: boolean;
  dtinsert: string;
  dtupdate: string;
  compeCode: string;
  accountNumber: string;
  accountNumberCheckDigit: string;
  slugPaymentInstitution: string | null;
  idPaymentInstitution: number | null;
  bankBranchNumber: string;
  accountType: string;
  integrationType: string;
  brand: string;
  productType: string;
  amount: string;
  anticipationAmount: string;
  idMerchantSettlements: number;
  merchantSettlementOrderStatus: string;
  orderTransactionId: string;
  settlementUniqueNumber: string;
  protocolGuidId: string;
  legalPerson: string;
  documentId: string;
  corporateName: string;
  effectivePaymentDate: string;
  lock: boolean;
};

export type InsertPixMerchantSettlementOrders = {
  slug: string;
  active: boolean;
  dtinsert: string;
  dtupdate: string;
  slugCustomer: string;
  idCustomer: number;
  slugMerchant: string;
  idMerchant: number;
  paymentDate: string | null;
  authorizerMerchantId: string;
  expectedPaymentDate: string | null;
  transactionCount: number;
  totalAmount: string;
  totalRefundAmount: string;
  totalNetAmount: string;
  totalFeeAmount: string;
  totalCostAmount: string;
  totalSettlementAmount: string;
  status: string;
  compeCode: string;
  accountNumber: string;
  accountNumberCheckDigit: string;
  bankBranchNumber: string;
  accountType: string;
  legalPerson: string;
  documentId: string;
  corporateName: string;
  effectivePaymentDate: string | null;
  settlementUniqueNumber: string;
  protocolGuidId: string;
  feeSettlementUniqueNumber: string;
  feeEffectivePaymentDate: string | null;
  feeProtocolGuidId: string;
  idMerchantSettlement: number;
};

export type InsertSettlementObject = {
  slug: string;
  active: boolean;
  dtinsert: string;
  dtupdate: string;
  transactionCount: number;
  adjustmentCount: number;
  batchAmount: string;
  netSettlementAmount: string;
  pixAmount: string;
  pixNetAmount: string;
  pixFeeAmount: string;
  pixCostAmount: string;
  creditAdjustmentAmount: string;
  debitAdjustmentAmount: string;
  totalAnticipationAmount: string;
  totalRestitutionAmount: string;
  pendingRestitutionAmount: string;
  totalSettlementAmount: string;
  pendingFinancialAdjustmentAmount: string;
  creditFinancialAdjustmentAmount: string;
  debitFinancialAdjustmentAmount: string;
  status: string;
  slugMerchant: string;
  idMerchant: number;
  slugCustomer: string;
  idCustomer: number;
  outstandingAmount: string;
  restRoundingAmount: string;
  idSettlement: number;
};

export type InsertSettlement = {
  slug: string;
  active: boolean;
  dtinsert: string;
  dtupdate: string;
  batchAmount: string;
  discountFeeAmount: string;
  netSettlementAmount: string;
  totalAnticipationAmount: string;
  totalRestitutionAmount: string;
  pixAmount: string;
  pixNetAmount: string;
  pixFeeAmount: string;
  pixCostAmount: string;
  pendingRestitutionAmount: string;
  totalCreditAdjustmentAmount: string;
  totalDebitAdjustmentAmount: string;
  totalSettlementAmount: string;
  restRoundingAmount: string;
  outstandingAmount: string;
  slugCustomer: string;
  idCustomer: number;
  status: string;
  creditStatus: string;
  debitStatus: string;
  anticipationStatus: string;
  pixStatus: string;
  paymentDate: string;
  pendingFinancialAdjustmentAmount: string;
  creditFinancialAdjustmentAmount: string;
  debitFinancialAdjustmentAmount: string;
};

export type InsertMerchant = {
  slug: string;
  name: string;
  idDocument: string;
};
