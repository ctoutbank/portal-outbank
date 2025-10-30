
// Tipos auxiliares para a estrutura de taxas
export interface FeeProductType {
    // DB fields (used by the UI)
    id?: number;
    producttype?: string | null; // e.g. 'credit', 'debit'
    installmentTransactionFeeStart?: number | null;
    installmentTransactionFeeEnd?: number | null;
    cardTransactionFee?: number | null; // legacy name
    cardTransactionMdr?: number | null; // numeric mdr value
    nonCardTransactionFee?: number | null;
    nonCardTransactionMdr?: number | null;
    // fallback / other names used in some places
    name?: string | null;
    transactionAnticipationMdr?: number | null;
}

export interface FeeBrand {
    id: number;
    brand: string | null;
    // DB relation is called `feeBrandProductType` in returned payloads
    feeBrandProductType?: FeeProductType[];
    // keep old name for compatibility
    productTypes?: FeeProductType[];
}

export interface FeeDetail {
    id: number;
    name?: string | null;
    code?: string | null;
    cnpjQuantity?: number | null;
    monthlyPosFee?: string | number | null;
    averageTicket?: string | number | null;
    description?: string | null;
    cnaeInUse?: boolean | null;
    compulsoryAnticipationConfig?: number | null;
    eventualAnticipationFee?: string | number | null;
    nonCardCompulsoryAnticipationConfig?: number | null;
    nonCardEventualAnticipationFee?: string | number | null;
    cardPixMdr?: string | number | null;
    cardPixCeilingFee?: string | number | null;
    cardPixMinimumCostFee?: string | number | null;
    nonCardPixMdr?: string | number | null;
    nonCardPixCeilingFee?: string | number | null;
    nonCardPixMinimumCostFee?: string | number | null;
    anticipationType?: string | null;
    // relation name used in many payloads
    feeBrand?: FeeBrand[];
    // backward compatibility
    brands?: FeeBrand[];
}