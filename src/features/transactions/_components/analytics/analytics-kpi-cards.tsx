"use client";

import { AnalyticsKPIs } from "../../serverActions/analytics";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsKPICardsProps {
  kpis: AnalyticsKPIs;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function calculateChange(current: number, previous?: number): {
  value: number;
  isPositive: boolean;
} {
  if (!previous || previous === 0) {
    return { value: 0, isPositive: true };
  }
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(change),
    isPositive: change >= 0,
  };
}

function ChangeIndicator({
  current,
  previous,
}: {
  current: number;
  previous?: number;
}) {
  const change = calculateChange(current, previous);

  if (change.value === 0 || !previous) {
    return (
      <div className="flex items-center gap-1 text-[#808080] text-sm">
        <Minus className="h-4 w-4" />
        <span>Sem comparação</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-sm",
        change.isPositive ? "text-green-500" : "text-red-500"
      )}
    >
      {change.isPositive ? (
        <TrendingUp className="h-4 w-4" />
      ) : (
        <TrendingDown className="h-4 w-4" />
      )}
      <span>{formatPercent(change.value)}</span>
      <span className="text-[#808080]">vs período anterior</span>
    </div>
  );
}

export function AnalyticsKPICards({ kpis }: AnalyticsKPICardsProps) {
  const cards = [
    {
      title: "Total de Transações",
      value: formatNumber(kpis.totalTransacoes),
      change: kpis.periodoAnterior?.totalTransacoes,
      icon: "📊",
      color: "bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Valor Total",
      value: formatCurrency(kpis.totalValor),
      change: kpis.periodoAnterior?.totalValor,
      icon: "💰",
      color: "bg-green-500/10 border-green-500/20",
    },
    {
      title: "Taxa de Aprovação",
      value: formatPercent(kpis.taxaAprovacao),
      change: kpis.periodoAnterior?.taxaAprovacao,
      icon: "✅",
      color: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Taxa de Negação",
      value: formatPercent(kpis.taxaNegacao),
      change: kpis.periodoAnterior?.taxaNegacao,
      icon: "❌",
      color: "bg-red-500/10 border-red-500/20",
      invertChange: true, // Para negação, aumento é ruim
    },
    {
      title: "Valor Médio",
      value: formatCurrency(kpis.valorMedio),
      change: kpis.periodoAnterior?.valorMedio,
      icon: "📈",
      color: "bg-purple-500/10 border-purple-500/20",
    },
    {
      title: "Taxa de Conversão",
      value: "N/A",
      change: undefined,
      icon: "🔄",
      color: "bg-yellow-500/10 border-yellow-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={cn(
            "p-6 rounded-lg border bg-[#1f1f1f]",
            card.color
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-[#808080] mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-white">{card.value}</p>
            </div>
            <span className="text-3xl">{card.icon}</span>
          </div>
          {card.change !== undefined && (
            <ChangeIndicator
              current={
                index === 0
                  ? kpis.totalTransacoes
                  : index === 1
                  ? kpis.totalValor
                  : index === 2
                  ? kpis.taxaAprovacao
                  : index === 3
                  ? kpis.taxaNegacao
                  : kpis.valorMedio
              }
              previous={card.change}
            />
          )}
        </div>
      ))}
    </div>
  );
}



