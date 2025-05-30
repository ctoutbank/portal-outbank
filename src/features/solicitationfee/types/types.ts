export interface SolicitationBrandProductType {
  id: number;
  slug: string | null;
  productType: string;
  fee: string | null;
  feeAdmin: string | null;
  feeDock: string | null;
  transactionFeeStart: string | null;
  transactionFeeEnd: string | null;
  pixMinimumCostFee: string | null;
  pixCeilingFee: string | null;
  transactionAnticipationMdr: string | null;
  noCardFee: string | null;
  noCardFeeAdmin: string | null;
  noCardFeeDock: string | null;
  noCardTransactionAnticipationMdr: string | null;
  dtinsert?: string | Date | null;
  dtupdate?: string | Date | null;
}

export interface SolicitationFeeBrand {
  id: number;
  slug: string | null;
  brand: string;
  solicitationFeeId: number;
  dtinsert?: string | Date | null;
  dtupdate?: string | Date | null;
  solicitationBrandProductTypes: SolicitationBrandProductType[];
}

export interface BaseSolicitationFee {
  id: number;
  slug: string | null;
  cnae: string | null;
  idCustomers: number;
  mcc: string | null;
  cnpjQuantity: number;
  monthlyPosFee: number;
  averageTicket: number;
  description: string | null;
  status: string;
  dtinsert?: string | Date | null;
  dtupdate?: string | Date | null;
  // PIX Online (nonCard)
  nonCardPixMdr: string | null;
  nonCardPixMdrAdmin: string | null;
  nonCardPixMdrDock: string | null;
  nonCardPixCeilingFee: string | null;
  nonCardPixCeilingFeeAdmin: string | null;
  nonCardPixCeilingFeeDock: string | null;
  nonCardPixMinimumCostFee: string | null;
  nonCardPixMinimumCostFeeAdmin: string | null;
  nonCardPixMinimumCostFeeDock: string | null;
  // PIX Pos (card)
  cardPixMdr: string | null;
  cardPixMdrAdmin: string | null;
  cardPixMdrDock: string | null;
  cardPixCeilingFee: string | null;
  cardPixCeilingFeeAdmin: string | null;
  cardPixCeilingFeeDock: string | null;
  cardPixMinimumCostFee: string | null;
  cardPixMinimumCostFeeAdmin: string | null;
  cardPixMinimumCostFeeDock: string | null;
  // Antecipação
  compulsoryAnticipationConfig: number;
  eventualAnticipationFee: string | null;
  eventualAnticipationFeeAdmin: string | null;
  eventualAnticipationFeeDock: string | null;
  nonCardEventualAnticipationFee: string | null;
  nonCardEventualAnticipationFeeAdmin: string | null;
  nonCardEventualAnticipationFeeDock: string | null;
}

// Interface para dados vindos do backend
export interface ApiSolicitationFee extends BaseSolicitationFee {
  cnaeInUse: string | null;
  solicitationFeeBrands: SolicitationFeeBrand[];
}

// Interface para o formulário
export interface FormSolicitationFee extends BaseSolicitationFee {
  cnaeInUse: boolean | undefined;
  solicitationFeeBrands: SolicitationFeeBrand[];
}

export interface TaxEditForm {
  solicitationFee: ApiSolicitationFee;
}

export interface TaXEditFormSchema {
  solicitationFee: FormSolicitationFee;
} 