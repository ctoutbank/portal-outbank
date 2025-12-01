/**
 * Tipos de terminais disponíveis no sistema.
 *
 * P = POS (Point of Sale)
 * T = TEF (Transferência Eletrônica de Fundos)
 * S = SmartPos (Terminal inteligente com tela touchscreen)
 * V = Virtual (Terminal virtual para transações online)
 */
import { SelectItem } from "@/lib/lookuptables/lookuptables";

export const terminalTypeList: SelectItem[] = [
  { value: "P", label: "POS" },
  { value: "V", label: "Virtual" },
  { value: "S", label: "SmartPos" },
  { value: "T", label: "TEF" },
];

export type TerminalType = "P" | "V" | "S" | "T";

/**
 * Retorna o label correspondente ao value fornecido
 * @param value O valor para buscar o label correspondente
 * @returns O label correspondente ou undefined se não encontrado
 */
export function getTerminalTypeLabel(value: string): string | undefined {
  return terminalTypeList.find((item) => item.value === value)?.label;
}

export const terminalModels = [
  "S920203GWB-C",
  "L400;-C",
  "VIRTUAL",
  "INTEGRATION",
  "PAYLINK",
  "TapDevice",
  "GPOS760;1024MB-C",
  "FEPAS",
  "GPOS700X;1024MB-C",
];

