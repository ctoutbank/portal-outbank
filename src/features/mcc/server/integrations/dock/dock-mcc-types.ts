/**
 * Tipos TypeScript para as respostas da API Dock - MCC Groups e MCC
 */

// Resposta da API Dock para mcc_group
export type DockMccGroupResponse = {
  objects: DockMccGroup[];
  meta?: {
    total_count?: number;
    limit?: number;
    offset?: number;
  };
};

// Item individual de mcc_group da Dock
export type DockMccGroup = {
  id: number;
  description: string;
  availability_date?: string;
  database_operation?: 'i' | 'u' | 'd';
};

// Resposta da API Dock para mcc
export type DockMccResponse = {
  objects: DockMcc[];
  meta?: {
    total_count?: number;
    limit?: number;
    offset?: number;
  };
};

// Item individual de mcc da Dock
export type DockMcc = {
  code: number;
  description: string;
  mcc_group_id: number;
  availability_date?: string;
  database_operation?: 'i' | 'u' | 'd';
};

