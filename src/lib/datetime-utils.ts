import { DateTime } from "luxon";

export function getDateUTC(date: string, timeZone: string) {
  // Passo 1: Interpretar os valores como pertencentes ao fuso horário especificado
  const dateTimezone = DateTime.fromISO(date, { zone: timeZone });

  // Passo 2: Converter para UTC
  const dateUTC = dateTimezone.toUTC();

  // Passo 3: Retornar objeto com as datas em formato ISO 8601
  return dateUTC.toISO();
}

export function detectTimeZone(): string {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return userTimeZone;
}

export function convertUTCToSaoPaulo(
  utcDate: string,
  formatoBrasileiro: boolean = false
): string {
  if (!utcDate) {
    throw new Error("Data UTC não pode ser vazia");
  }

  // Normalizar o formato da data (substituir espaço por T e adicionar Z se necessário)
  const normalizedDate = utcDate
    .replace(" ", "T")
    .replace(/(\d{2}:\d{2}:\d{2})$/, "$1Z");

  // Passo 1: Criar objeto DateTime a partir da data UTC
  const dateUTC = DateTime.fromISO(normalizedDate, { zone: "utc" });

  // Verificar se a data é válida
  if (!dateUTC.isValid) {
    throw new Error(`Data UTC inválida: ${dateUTC.invalidReason} - ${dateUTC.invalidExplanation}
Formato esperado: YYYY-MM-DD HH:mm:ss ou YYYY-MM-DDTHH:mm:ssZ`);
  }

  // Passo 2: Converter para o fuso horário de São Paulo
  const dateSP = dateUTC.setZone("America/Sao_Paulo");

  // Verificar se a conversão foi bem sucedida
  if (!dateSP.isValid) {
    throw new Error(
      `Erro na conversão para fuso horário de São Paulo: ${dateSP.invalidReason}`
    );
  }

  // Passo 3: Retornar a data no formato solicitado
  if (formatoBrasileiro) {
    return dateSP.toFormat("dd/MM/yyyy HH:mm:ss");
  }

  const result = dateSP.toISO();
  if (!result) {
    throw new Error(`Erro ao formatar data: ${dateSP.toString()}`);
  }

  return result;
}

export function convertUTCToSaoPauloBR(utcDate: string): string {
  return convertUTCToSaoPaulo(utcDate, true);
}

/**
 * Retorna a string de data/hora para o início do dia atual (00:00:00)
 */
export function getStartOfDay(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(today.getDate()).padStart(2, "0")}T00:00:00`;
}

/**
 * Retorna a string de data/hora para o final do dia atual (23:59:59)
 */
export function getEndOfDay(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(today.getDate()).padStart(2, "0")}T23:59:59`;
}

// Valores padrão para uso em toda a aplicação
export const startOfDay = getStartOfDay();
export const endOfDay = getEndOfDay();

export function currentDateTimeSP() {
  return DateTime.now().toUTC().setZone("America/Sao_Paulo").toISO();
}

//UTC

/**
 * Converte uma string ISO (ou Date) para DateTime em UTC
 */
export function parseToUTC(date: string | Date): DateTime {
  return typeof date === "string"
    ? DateTime.fromISO(date, { zone: "utc" })
    : DateTime.fromJSDate(date, { zone: "utc" });
}

/**
 * Formata um DateTime (ou string ISO) para filtro YYYY-MM-DD em UTC
 */
export function toAPIFilterUTC(date: string | Date | DateTime): string {
  const dt = date instanceof DateTime ? date : parseToUTC(date as string);
  return dt.toUTC().toFormat("yyyy-MM-dd");
}

/**
 * Retorna o início do dia atual em UTC (00:00:00)
 */
export function startOfTodayUTC(): string {
  return DateTime.utc().startOf("day").toISO() || "";
}

/**
 * Retorna o final do dia atual em UTC (23:59:59)
 */
export function endOfTodayUTC(): string {
  return DateTime.utc().endOf("day").toISO() || "";
}

/**
 * Retorna a data/hora atual em UTC, no formato ISO 8601
 */
export function currentDateTimeUTC(): string {
  return DateTime.utc().toISO() || "";
}

