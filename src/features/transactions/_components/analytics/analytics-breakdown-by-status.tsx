"use client";

import { DimensionData } from "../../serverActions/analytics";

interface AnalyticsBreakdownByStatusProps {
  data: DimensionData[];
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function getStatusColor(status: string): string {
  const upper = status.toUpperCase();
  if (upper.includes("AUTHORIZED") || upper.includes("APROVADA")) {
    return "#10b981";
  }
  if (upper.includes("DENIED") || upper.includes("NEGADA")) {
    return "#ef4444";
  }
  if (upper.includes("PENDING") || upper.includes("PENDENTE")) {
    return "#f59e0b";
  }
  return "#6b7280";
}

export function AnalyticsBreakdownByStatus({
  data,
}: AnalyticsBreakdownByStatusProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg">
        <p className="text-[#808080]">Nenhum dado disponível</p>
      </div>
    );
  }

  // Sort by percentual descending
  const sortedData = [...data].sort(
    (a, b) => b.percentual - a.percentual
  );

  const maxPercentual = Math.max(...sortedData.map((d) => d.percentual));

  return (
    <div className="w-full bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Transações por Status
      </h3>
      <div className="space-y-4">
        {sortedData.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white font-medium">{item.dimension}</span>
              <div className="flex items-center gap-4">
                <span className="text-[#808080]">
                  {formatNumber(item.totalTransacoes)} transações
                </span>
                <span className="text-white font-semibold">
                  {item.percentual.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="w-full bg-[#2a2a2a] rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(item.percentual / maxPercentual) * 100}%`,
                  backgroundColor: getStatusColor(item.dimension),
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


