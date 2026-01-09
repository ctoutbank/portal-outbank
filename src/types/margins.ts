export interface CostTemplate {
  id: string;
  fornecedorId: string;
  mccId: number;
  fornecedorNome?: string;
  mccCode?: string;
  mccDescription?: string;
  
  custoDebitoPos?: string;
  custoCreditoPos?: string;
  custoCredito2xPos?: string;
  custoCredito7xPos?: string;
  custoVoucherPos?: string;
  custoPixPosPercent?: string;
  custoPixPosFixo?: string;
  custoAntecipacaoPos?: string;
  
  custoDebitoOnline?: string;
  custoCreditoOnline?: string;
  custoCredito2xOnline?: string;
  custoCredito7xOnline?: string;
  custoVoucherOnline?: string;
  custoPixOnlinePercent?: string;
  custoPixOnlineFixo?: string;
  custoAntecipacaoOnline?: string;
  
  bandeiras?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MarginConfig {
  marginOutbank: number;
  marginExecutivo: number;
  marginCore: number;
}

export type MarginUserRole = 'super_admin' | 'executivo' | 'core';
