export interface Category {
  id: number;
  slug: string;
  name: string;
  mcc: string;
  cnae: string;
  active: boolean;
  dtinsert?: Date;
  dtupdate?: Date;
}

export interface Fornecedor {
  status: string;
  tabelasMDR: [];
  name: string;
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  
  // ✅ Categories (MCC/CNAE)
  categories?: Category[];     // Array de categories
  total_categories?: number;   // Contador
  mccs?: string[];            // Array de MCCs
  cnaes?: string[];           // Array de CNAEs
  
  // Documentos
  fornecedor_document?: FornecedorDocument[];
  documentos?: FornecedorDocument[];
  
  // Campos opcionais
  observacoes?: string;
  contato_principal?: string;
  ativo: boolean;
  
  // Timestamps
  created_at?: Date;
  updated_at?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FornecedorFormData {
  nome: string;
  cnpj: string;
  email: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  mcc?: string[];  // Array de IDs de categories
  observacoes?: string;
  contato_principal?: string;
  ativo?: boolean;
}

export interface FornecedorDocument {
  id: string;
  fornecedor_id: string;
  nome?: string;
  tipo?: string;
  url: string;
  size: number;
  uploaded_at?: Date;
  createdAt?: Date;
}


    

export interface FornecedorMDR{
  bandeiras: string,
  debitopos: string,
  creditopos: string,
  credito2xpos : string,
  credito7xpos : string,
  voucherpos : string,
  prepos : string,
  mdrpos : string,
  cminpos : string,
  cmaxpos : string,
  antecipacao : string,
  debitoonline: string,
  creditoonline: string,
  credito2xonline : string,
  credito7xonline : string,
  voucheronline : string,
  preonline : string,
  mdronline : string,
  cminonline : string,
  cmaxonline : string,
  antecipacaoonline : string,
  createdAt: Date,
  updatedAt: Date,
  createdBy: string;

  categories?: Category[];     // Array de categories
  total_categories?: number;   // Contador
  mccs?: string[];            // Array de MCCs
  cnaes?: string[];           // Array de CNAEs
  
}

export interface FornecedorMDRForm{
  bandeiras: string,
  debitopos: string,
  creditopos: string,
  credito2xpos : string,
  credito7xpos : string,
  voucherpos : string,
  prepos : string,
  mdrpos : string,
  cminpos : string,
  cmaxpos : string,
  antecipacao : string,
  debitoonline: string,
  creditoonline: string,
  credito2xonline : string,
  credito7xonline : string,
  voucheronline : string,
  preonline : string,
  mdronline : string,
  cminonline : string,
  cmaxonline : string,
  antecipacaoonline : string,
  mcc?: string[];
  
  // Novos campos: Custo Fornecedor e Margem Portal (POS)
  custoDebitoPos?: string,
  custoCreditoPos?: string,
  custoCredito2xPos?: string,
  custoCredito7xPos?: string,
  custoVoucherPos?: string,
  margemDebitoPos?: string,
  margemCreditoPos?: string,
  margemCredito2xPos?: string,
  margemCredito7xPos?: string,
  margemVoucherPos?: string,
  
  // Novos campos: Custo Fornecedor e Margem Portal (Online)
  custoDebitoOnline?: string,
  custoCreditoOnline?: string,
  custoCredito2xOnline?: string,
  custoCredito7xOnline?: string,
  custoVoucherOnline?: string,
  margemDebitoOnline?: string,
  margemCreditoOnline?: string,
  margemCredito2xOnline?: string,
  margemCredito7xOnline?: string,
  margemVoucherOnline?: string,
  
  // PIX: valores fixos em R$
  custoPixPos?: string,
  margemPixPos?: string,
  custoPixOnline?: string,
  margemPixOnline?: string,
  
  // PIX: campos snake_case do banco (PostgreSQL retorna assim)
  custo_pix_pos?: string,
  margem_pix_pos?: string,
  custo_pix_online?: string,
  margem_pix_online?: string,
}