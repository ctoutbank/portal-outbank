import { SelectItem } from "@/lib/lookuptables/lookuptables";

export const transactionStatusList: SelectItem[] = [
    { value: "CANCELED", label: "Cancelada" },
    { value: "EXPIRED", label: "Expirada" },
    { value: "PENDING", label: "Pendente" },
    { value: "DENIED", label: "Negada" },
    { value: "PRE_AUTHORIZED", label: "Pré-autorizada" },
    { value: "AUTHORIZED", label: "Autorizada" },
    { value: "APPROVED", label: "Aprovada" },
    { value: "REJECTED", label: "Rejeitada" },
    { value: "FAILED", label: "Falhou" },
];

export const transactionProductTypeList: SelectItem[] = [
    { value: "DEBIT", label: "Débito" },
    { value: "CREDIT", label: "Crédito" },
    { value: "VOUCHER", label: "Voucher" },
    { value: "PIX", label: "PIX" },
    { value: "PREPAID_CREDIT", label: "Crédito Pré-pago" },
    { value: "PREPAID_DEBIT", label: "Débito Pré-pago" },
];

export const cardPaymentMethod: SelectItem[] = [
    { value: "CP", label: "Presencial" },
    { value: "CNP", label: "Online" },
];

export const processingTypeList: SelectItem[] = [
    { value: "MANUAL_KEY_ENTRY", label: "Digitada" },
    { value: "MAGNETIC_STRIPE", label: "Tarja" },
    { value: "CHIP_EMV", label: "Chip" },
    { value: "CONTACTLESS", label: "Sem contato" },
    { value: "CARD_TOKEN", label: "Token" },
    { value: "PAYLINK", label: "Link de pagamento" },
    { value: "INTEGRATION", label: "Integração" },
    { value: "POS", label: "Ponto de venda" },
    { value: "TAP_ON_PHONE", label: "Tap on Phone" },
    { value: "VIRTUAL_TERMINAL", label: "Terminal virtual" },
    { value: "PDV", label: "PDV" },
];

export const brandList: SelectItem[] = [
    { value: "MASTERCARD", label: "Master" },
    { value: "VISA", label: "Visa" },
    { value: "ELO", label: "Elo" },
    { value: "AMEX", label: "Amex" },
    { value: "HIPERCARD", label: "Hipercard" },
    { value: "CABAL", label: "Cabal" },
];

export const cycleTypeList: SelectItem[] = [
    { value: "VOID", label: "Cancelamento" },
    { value: "REFUND", label: "Reembolso" },
    { value: "PRE_AUTHORIZATION", label: "Pré Autorização" },
];

export const splitTypeList: SelectItem[] = [
    { value: "WITH_SPLIT", label: "Com Split" },
    { value: "WITHOUT_SPLIT", label: "Sem Split" },
];

/**
 * Função auxiliar genérica para obter um label a partir de um value
 * @param list Lista de itens SelectItem para buscar
 * @param value Valor a ser buscado
 * @returns O label correspondente ou undefined se não encontrado
 */
function getLabelByValue(
    list: SelectItem[],
    value: string
): string | undefined {
    return list.find((item) => item.value === value)?.label;
}

/**
 * Retorna o label de status de transação a partir do value
 * @param value O valor para buscar o label correspondente
 * @returns O label correspondente ou undefined se não encontrado
 */
export function getTransactionStatusLabel(value: string): string | undefined {
    return getLabelByValue(transactionStatusList, value);
}

/**
 * Retorna o label de tipo de produto de transação a partir do value
 * @param value O valor para buscar o label correspondente
 * @returns O label correspondente ou undefined se não encontrado
 */
export function getTransactionProductTypeLabel(
    value: string
): string | undefined {
    return getLabelByValue(transactionProductTypeList, value);
}

/**
 * Retorna o label de método de pagamento com cartão a partir do value
 * @param value O valor para buscar o label correspondente
 * @returns O label correspondente ou undefined se não encontrado
 */
export function getCardPaymentMethodLabel(value: string): string | undefined {
    return getLabelByValue(cardPaymentMethod, value);
}

/**
 * Retorna o label de tipo de processamento a partir do value
 * @param value O valor para buscar o label correspondente
 * @returns O label correspondente ou undefined se não encontrado
 */
export function getProcessingTypeLabel(value: string): string | undefined {
    return getLabelByValue(processingTypeList, value);
}

/**
 * Retorna o label de bandeira do cartão a partir do value
 * @param value O valor para buscar o label correspondente
 * @returns O label correspondente ou undefined se não encontrado
 */
export function getBrandLabel(value: string): string | undefined {
    return getLabelByValue(brandList, value);
}

/**
 * Retorna o label de tipo de ciclo a partir do value
 * @param value O valor para buscar o label correspondente
 * @returns O label correspondente ou undefined se não encontrado
 */
export function getCycleTypeLabel(value: string): string | undefined {
    return getLabelByValue(cycleTypeList, value);
}
