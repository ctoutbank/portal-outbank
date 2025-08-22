

export type MerchantPriceGroupResponse = {
  meta: {
    limit: number;
    offset: number;
    total_count: number;
  };
  objects: MerchantPriceGroup[];
};

export type MerchantPriceGroup = {
  slug: string;
  active: boolean;
  dtInsert: string;
  dtUpdate: string;
  brand: string;
  groupId: number;
  merchantPrice: {
    slug: string;
    // outros campos do merchantPrice que não precisamos
  };
  listMerchantTransactionPrice: TransactionPrice[];
};

export type TransactionPrice = {
  slug: string;
  active: boolean;
  dtInsert: string;
  dtUpdate: string;
  installmentTransactionFeeStart: number;
  installmentTransactionFeeEnd: number;
  cardTransactionFee: number;
  cardTransactionMdr: number;
  nonCardTransactionFee: number;
  nonCardTransactionMdr: number;
  productType: string;
};
