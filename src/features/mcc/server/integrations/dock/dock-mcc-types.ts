/**
 * Tipos TypeScript para as respostas da API Dock - MCC Groups e MCC
 * 
 * NOTA: A estrutura exata da resposta HTTP precisa ser confirmada com a Dock.
 * Atualmente assume padrão objects + meta (comum na Dock), mas pode ser diferente.
 * Quando tivermos exemplo real de resposta, ajustar estes tipos.
 */

// Resposta da API Dock para mcc_group
// Estrutura assumida: { objects: [...], meta: {...} }
// Pode ser apenas array direto ou outro formato - a confirmar
export type DockMccGroupResponse = {
  objects?: DockMccGroup[];
  meta?: {
    total_count?: number;
    limit?: number;
    offset?: number;
  };
};

// Item individual de mcc_group da Dock
// Campos obrigatórios conforme documentação: id, description, availability_date, database_operation
export type DockMccGroup = {
  id: number; // Obrigatório, inteiro
  description: string; // Obrigatório
  availability_date: string; // Obrigatório, datetime
  database_operation: 'i' | 'u' | 'd'; // Obrigatório
  registration_date?: string; // Pode haver outros campos de controle
  [key: string]: any; // Permitir campos adicionais não documentados
};

// Resposta da API Dock para mcc
// Estrutura assumida: { objects: [...], meta: {...} }
// Pode ser apenas array direto ou outro formato - a confirmar
export type DockMccResponse = {
  objects?: DockMcc[];
  meta?: {
    total_count?: number;
    limit?: number;
    offset?: number;
  };
};

// Item individual de mcc da Dock
// Campos obrigatórios conforme documentação: code, description, availability_date, database_operation
// mcc_group_id pode ser nulo, mas geralmente tem valor
export type DockMcc = {
  code: number; // Obrigatório, inteiro (ISO 18245)
  description: string; // Obrigatório
  availability_date: string; // Obrigatório, datetime
  database_operation: 'i' | 'u' | 'd'; // Obrigatório
  mcc_group_id: number | null; // Pode ser nulo, relaciona com mcc_group.id
  registration_date?: string; // Pode haver outros campos de controle
  [key: string]: any; // Permitir campos adicionais não documentados
};

