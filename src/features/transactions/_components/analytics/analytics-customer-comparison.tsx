"use client";

import { CustomerComparison } from "../../serverActions/analytics";

interface AnalyticsCustomerComparisonProps {
  data: CustomerComparison[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function AnalyticsCustomerComparison({
  data,
}: AnalyticsCustomerComparisonProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
        <p className="text-[#808080]">Nenhum dado disponível para comparação</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Comparação entre ISOs
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="text-left py-3 px-4 text-sm font-semibold text-white">
                ISO
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-white">
                Transações
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-white">
                Valor Total
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-white">
                Valor Médio
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-white">
                Taxa de Aprovação
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={item.customerId || index}
                className="border-b border-[#2a2a2a] hover:bg-[#252525] transition-colors"
              >
                <td className="py-3 px-4 text-sm text-white">
                  {item.customerName || `ISO ${item.customerId}`}
                </td>
                <td className="py-3 px-4 text-sm text-right text-[#808080]">
                  {formatNumber(item.totalTransacoes)}
                </td>
                <td className="py-3 px-4 text-sm text-right text-white font-medium">
                  {formatCurrency(item.totalValor)}
                </td>
                <td className="py-3 px-4 text-sm text-right text-[#808080]">
                  {formatCurrency(item.valorMedio)}
                </td>
                <td className="py-3 px-4 text-sm text-right">
                  <span
                    className={`font-medium ${
                      item.taxaAprovacao >= 80
                        ? "text-green-500"
                        : item.taxaAprovacao >= 60
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`}
                  >
                    {formatPercent(item.taxaAprovacao)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

