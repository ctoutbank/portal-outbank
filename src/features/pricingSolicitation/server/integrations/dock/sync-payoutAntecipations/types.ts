export interface PaymentInstitution {
  slug: string;
  name: string;
  customerId: string;
  settlementManagementType: string;
}

export interface Customer {
  slug: string;
  name: string;
  customerId: string;
  settlementManagementType: string;
  paymentInstitution: PaymentInstitution;
}

export interface Merchant {
  slug: string;
  name: string;
  documentId: string;
}

export interface Antecipation {
  slug: string;
  payoutId: string;
  slugMerchant: string;
  merchant: Merchant;
  rrn: string;
  transactionDate: string;
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
  anticipatedAmount: number;
  anticipationSettlementAmount: number;
  status: string;
  anticipationDayNumber: number;
  anticipationFee: number;
  anticipationMonthFee: number;
  netAmount: number;
  anticipationCode: string;
  totalAnticipatedAmount: number;
  settlementDate: string;
  effectivePaymentDate: string | null;
  settlementUniqueNumber: string | null;
  slugCustomer: string;
  customer: Customer;
}

export interface AntecipationsResponse {
  meta: {
    limit: number;
    offset: number;
    total_count: number;
  };
  objects: Antecipation[];
}


export interface InsertAntecipation {
  slug: string;
  payoutId: string;
  slugMerchant: string;
  idMerchants: number | null;
  rrn: string;
  transactionDate: string;
  type: string;
  brand: string;
  installmentNumber: number;
  installments: number;
  installmentAmount: string;
  transactionMdr: string;
  transactionMdrFee: string;
  transactionFee: string;
  settlementAmount: string;
  expectedSettlementDate: string | null;
  anticipatedAmount: string;
  anticipationSettlementAmount: string;
  status: string;
  anticipationDayNumber: number;
  anticipationFee: string;
  anticipationMonthFee: string;
  netAmount: string;
  anticipationCode: string;
  totalAnticipatedAmount: string;
  settlementDate: string | null;
  effectivePaymentDate: string | null;
  settlementUniqueNumber: string;
  slugCustomer: string;
  idCustomer: number | null;
}
