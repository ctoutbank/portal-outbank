export type Meta = {
  limit: number;
  offset: number;
  total_count: number;
};

export interface PaymentLinkResponse {
  meta: Meta;
  objects: PaymentLinkObject[];
}

export interface PaymentLinkObject {
  slug: string;
  active: boolean;
  dtInsert: string;
  dtUpdate: string;
  linkName: string;
  dtExpiration: string;
  totalAmount: number;
  slugMerchant: string;
  paymentLinkStatus: string;
  productType: string;
  installments: number;
  linkUrl: string;
  slugFinancialTransaction?: string;
  pixEnabled?: boolean;
}

export interface InsertPaymentLink {
  slug: string;
  active: boolean;
  dtinsert: string;
  dtupdate: string;
  linkName: string;
  dtExpiration: string;
  totalAmount: string;
  paymentLinkStatus: string;
  productType: string;
  installments: number;
  linkUrl: string;
  pixEnabled: boolean;
  idMerchant: number;
  transactionSlug: string;
  isFromServer: boolean;
}
