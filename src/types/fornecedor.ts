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