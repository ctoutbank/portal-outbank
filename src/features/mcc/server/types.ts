export type NivelRisco = "baixo" | "medio" | "alto";
export type TipoLiquidacao = "D0" | "D1" | "D2" | "D14" | "D30" | "sob_analise";

export interface MccData {
  id: number;
  code: string;
  description: string;
  categoria: string;
  subcategoria: string | null;
  nivelRisco: NivelRisco;
  tipoLiquidacao: TipoLiquidacao;
  isActive: boolean;
  exigeAnaliseManual: boolean;
  observacoesRegulatorias: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type MccListResponse = {
  data: MccData[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const nivelRiscoLabels: Record<NivelRisco, string> = {
  baixo: "Baixo",
  medio: "Médio",
  alto: "Alto",
};

export const tipoLiquidacaoLabels: Record<TipoLiquidacao, string> = {
  D0: "D+0",
  D1: "D+1",
  D2: "D+2",
  D14: "D+14",
  D30: "D+30",
  sob_analise: "Sob Análise",
};

export const nivelRiscoColors: Record<NivelRisco, string> = {
  baixo: "bg-green-500/20 text-green-400 border-green-500/30",
  medio: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  alto: "bg-red-500/20 text-red-400 border-red-500/30",
};
