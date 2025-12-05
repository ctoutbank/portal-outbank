"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DimensionData } from "../../serverActions/analytics";

interface AnalyticsBreakdownByBrandProps {
  data: DimensionData[];
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold mb-2">{data.dimension}</p>
        <p className="text-sm text-[#808080]">
          Transações: <span className="text-white">{formatNumber(data.totalTransacoes)}</span>
        </p>
        <p className="text-sm text-[#808080]">
          Percentual: <span className="text-white">{data.percentual.toFixed(2)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export function AnalyticsBreakdownByBrand({
  data,
}: AnalyticsBreakdownByBrandProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg">
        <p className="text-[#808080]">Nenhum dado disponível</p>
      </div>
    );
  }

  // Sort by totalTransacoes descending
  const sortedData = [...data].sort(
    (a, b) => b.totalTransacoes - a.totalTransacoes
  );

  return (
    <div className="w-full bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Transações por Bandeira
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sortedData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis type="number" stroke="#808080" tick={{ fill: "#808080" }} />
          <YAxis
            type="category"
            dataKey="dimension"
            stroke="#808080"
            tick={{ fill: "#808080" }}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="totalTransacoes" radius={[0, 4, 4, 0]}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}



