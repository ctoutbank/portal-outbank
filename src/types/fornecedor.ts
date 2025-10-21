export interface Fornecedor {
  id: string;
  nome: string;
  documento: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  createdAt: Date;
  updatedAt: Date;
  observacoes: string;
  contato_principal: string;
  ativo: boolean;
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
  observacoes?: string;
  contato_principal?: string;
  ativo?: boolean;
}

export interface FornecedorDocument {
  id: string;
  fornecedor_id: string;
  
  url: string;
  size: number;
  createdAt: Date;
}
