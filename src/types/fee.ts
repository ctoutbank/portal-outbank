
// Tipos auxiliares para a estrutura de taxas
export interface FeeProductType {
    id: number;
    name: string | null;
    cardTransactionFee: number | null;
    nonCardTransactionFee: number | null;
    installmentTransactionFeeStart: number | null;
    installmentTransactionFeeEnd: number | null;
    transactionAnticipationMdr: number | null;
}

export interface FeeBrand {
    id: number;
    brand: string | null;
    productTypes: FeeProductType[];
}

export interface FeeDetail {
    id: number;
    cnpjQuantity: number | null;
    monthlyPosFee: string | number | null;
    averageTicket: string | number | null;
    description: string | null;
    cnaeInUse: boolean | null;
    compulsoryAnticipationConfig: number | null;
    eventualAnticipationFee: string | number | null;
    nonCardCompulsoryAnticipationConfig: number | null;
    nonCardEventualAnticipationFee: string | number | null;
    cardPixMdr: string | number | null;
    cardPixCeilingFee: string | number | null;
    cardPixMinimumCostFee: string | number | null;
    nonCardPixMdr: string | number | null;
    nonCardPixCeilingFee: string | number | null;
    nonCardPixMinimumCostFee: string | number | null;
    brands: FeeBrand[];
}