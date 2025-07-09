import { type ClassValue, clsx } from "clsx"
import crypto from "crypto";
import { DateTime } from "luxon";
import { twMerge } from "tailwind-merge";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Period {
  viewMode: string;
  period: { from: string; to: string };
  previousPeriod: { from: string; to: string };
}

export function gateDateByViewMode(viewMode: string): Period {
  const now = DateTime.utc();

  // Helpers Luxon
  const startOfUTCDay = (dt: DateTime) => dt.startOf("day");
  const endOfUTCDay = (dt: DateTime) => dt.endOf("day");
  const shiftDays = (dt: DateTime, days: number) => dt.plus({ days });

  // Formatação sem segundos e milissegundos
  const fmt = (dt: DateTime) =>
      dt.toISO({ suppressSeconds: true, suppressMilliseconds: true });

  // Referências
  const todayStart = startOfUTCDay(now);
  const todayEnd = endOfUTCDay(now);

  const yesterdayStart = startOfUTCDay(shiftDays(now, -1));
  const yesterdayEnd = endOfUTCDay(shiftDays(now, -1));

  let periodFrom: DateTime;
  let periodTo: DateTime;
  let prevFrom: DateTime;
  let prevTo: DateTime;

  switch (viewMode) {
    case "today":
      periodFrom = todayStart;
      periodTo = todayEnd;
      prevFrom = yesterdayStart;
      prevTo = yesterdayEnd;
      break;

    case "yesterday":
      periodFrom = yesterdayStart;
      periodTo = yesterdayEnd;
      prevFrom = startOfUTCDay(shiftDays(now, -2));
      prevTo = endOfUTCDay(shiftDays(now, -2));
      break;

    case "week":
      periodFrom = startOfUTCDay(shiftDays(now, -5));
      console.log(periodFrom);
      periodTo = todayEnd;
      prevFrom = startOfUTCDay(shiftDays(now, -12));
      console.log(prevFrom);
      prevTo = endOfUTCDay(shiftDays(now, -6));
      console.log(prevTo);
      break;

    case "month":
      periodFrom = startOfUTCDay(now.set({ day: 1 }));
      periodTo = todayEnd;
      prevFrom = startOfUTCDay(now.minus({ months: 1 }).set({ day: 1 }));
      prevTo = endOfUTCDay(now.set({ day: 1 }).minus({ days: 1 }));
      break;

    case "year":
      periodFrom = startOfUTCDay(now.set({ month: 1, day: 1 }));
      periodTo = todayEnd;
      prevFrom = startOfUTCDay(
          now.minus({ years: 1 }).set({ month: 1, day: 1 })
      );
      prevTo = endOfUTCDay(now.set({ month: 1, day: 1 }).minus({ days: 1 }));
      break;

    default:
      periodFrom = todayStart;
      periodTo = todayEnd;
      prevFrom = yesterdayStart;
      prevTo = yesterdayEnd;
  }

  return {
    viewMode,
    period: { from: fmt(periodFrom)!, to: fmt(periodTo)! },
    previousPeriod: { from: fmt(prevFrom)!, to: fmt(prevTo)! },
  };
}

export function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString();

  return `${day}/${month}/${year}`;
}

export function formatDateToAPIFilter(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString();

  return `${year}-${month}-${day}`;
}

export function formatDateTime(date: Date, weekDay: boolean): string {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  if (weekDay) {
    return `${days[date.getDay()]} ${day}/${month}/${year} - ${hours
        .toString()
        .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
  } else {
    return `${day}/${month}/${year} - ${hours
        .toString()
        .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
  }
}

export function formatDateComplete(date: Date): string {
  const days = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ];
  const months = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];

  const dayOfWeek = days[date.getDay()];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  const daySuffix = day === 1 || day === 21 || day === 31 ? "º" : "";

  return `${dayOfWeek}, ${month} ${day}${daySuffix} ${year}`;
}
export function formatCNPJ(cnpj: string): string {
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(
      5,
      8
  )}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

export function formatCurrency(
    number: number | string | undefined | null
): string {
  const parsed = Number(number);
  if (isNaN(parsed)) return "R$ 0,00";

  return `R$ ${parsed
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

export function formatPercentage(value: number): string {
  return `${value}%`;
}

export function formatPercentagea(value: number | null) {
  if (value === null) return null;
  return `${Math.abs(value).toFixed(2).replace(".", ",")}%`;
}

export function formatCurrencya(value: number | null) {
  if (value === null) return null;
  return `R$ ${Math.abs(value).toFixed(2).replace(".", ",")}`;
}

export function generateSlug(): string {
  return crypto.randomBytes(16).toString("hex").toUpperCase();
}

export function translateStatus(status: string): string {
  switch (status) {
    case "PENDING":
      return "Pendente";
    case "PROCESSING":
      return "Processando";
    case "REQUESTED":
      return "Pedido";
    case "FAILED":
      return "Erro";
    case "SETTLED":
      return "Liquidado";
    case "PAID":
      return "Pago";
    case "PRE_APPROVED":
      return "Pré Aprovado";
    case "APPROVED":
      return "Aprovado";
    default:
      return "";
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-500  hover:bg-yellow-600";
    case "PROCESSING":
      return "bg-yellow-500 hover:bg-yellow-400";
    case "REQUESTED":
      return "bg-yellow-300 hover:bg-yellow-400";
    case "FAILED":
      return "bg-[#C74545]  hover:bg-[#953434]";
    case "SETTLED":
      return "bg-[#00B28E]  hover:bg-[#006b55]";
    case "PAID":
      return "bg-[#00B28E]  hover:bg-[#006b55]";
    case "PRE_APPROVED":
      return "bg-blue-400  hover:bg-blue-500";
    case "APPROVED":
      return "bg-blue-700  hover:bg-blue-800";
    default:
      return "bg-gray-400 hover:bg-gray-500";
  }
}

export function formatCurrencyWithoutSymbol(number: number): string {
  return number.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
}

export function formatDateMonthPT(date: Date): string {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} de ${month} de ${year}`;
}

export function toUpperCaseFirst(text: string): string {
  return text
      .toLowerCase()
      .split(" ")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
}

export function translateCardType(cardType: string): string {
  console.log(cardType);
  switch (cardType.toUpperCase()) {
    case "CREDIT":
      return "Crédito";
    case "DEBIT":
      return "Débito";
    case "PREPAID - DEBIT":
      return "Débito - Pré-pago";
    case "PIX":
      return "Pix";
    case "ANTICIPATION":
      return "Antecipação";
    case "PREPAID_DEBIT":
      return "Débito - Pré-pago";
    case "PREPAID_CREDIT":
      return "Crédito - Pré-pago";
    default:
      return "";
  }
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getLocalTimezone(): string {
  if (typeof window === "undefined") {
    return "-0300"; // Timezone padrão para o servidor (Brasil)
  }

  try {
    const date = new Date();
    const offset = -date.getTimezoneOffset();
    const hours = Math.abs(Math.floor(offset / 60))
        .toString()
        .padStart(2, "0");
    const minutes = Math.abs(offset % 60)
        .toString()
        .padStart(2, "0");
    const sign = offset >= 0 ? "+" : "-";
    return `${sign}${hours}${minutes}`;
  } catch (error) {
    console.error("Erro ao obter timezone local:", error);
    return "-0300"; // Fallback para timezone do Brasil
  }
}

export function getPreviousPeriodFromRange(
    from: string,
    to: string
): {
  from: string;
  to: string;
} {
  const fromDate = DateTime.fromISO(from, { zone: "utc" }).startOf("day");
  const toDate = DateTime.fromISO(to, { zone: "utc" }).endOf("day");

  const duration = toDate.diff(fromDate, ["days"]).days + 1;

  const prevTo = fromDate.minus({ days: 1 }).endOf("day");
  const prevFrom = prevTo.minus({ days: duration - 1 }).startOf("day");

  const fmt = (dt: DateTime) =>
      dt.toISO({ suppressSeconds: true, suppressMilliseconds: true });

  return {
    from: fmt(prevFrom)!,
    to: fmt(prevTo)!,
  };
}

export function handleNumericInput(
    event: React.KeyboardEvent<HTMLInputElement>,
    maxLength: number
) {
  const allowedKeys = [
    "Backspace",
    "Delete",
    "Tab",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
  ];

  if (allowedKeys.includes(event.key)) {
    return;
  }

  const inputElement = event.target as HTMLInputElement;
  if (inputElement.value.length >= maxLength || !/[0-9]/.test(event.key)) {
    event.preventDefault();
  }
}

