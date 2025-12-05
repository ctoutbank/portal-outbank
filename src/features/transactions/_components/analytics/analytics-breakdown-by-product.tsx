"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { DimensionData } from "../../serverActions/analytics";

interface AnalyticsBreakdownByProductProps {
  data: DimensionData[];
}

const COLORS = {
  CREDIT: "#3b82f6",
  DEBIT: "#10b981",
  PIX: "#f59e0b",
  DEFAULT: "#8b5cf6",
};

function getColor(productType: string): string {
  const upper = productType.toUpperCase();
  if (upper.includes("CREDIT") || upper.includes("CRÉDITO")) {
    return COLORS.CREDIT;
  }
  if (upper.includes("DEBIT") || upper.includes("DÉBITO")) {
    return COLORS.DEBIT;
  }
  if (upper.includes("PIX")) {
    return COLORS.PIX;
  }
  return COLORS.DEFAULT;
}

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

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-sm font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function AnalyticsBreakdownByProduct({
  data,
}: AnalyticsBreakdownByProductProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg">
        <p className="text-[#808080]">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Transações por Tipo de Produto
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="totalTransacoes"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.dimension)} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: "#808080" }}
            formatter={(value, entry: any) => {
              const item = data.find((d) => d.dimension === value);
              return `${value} (${item?.percentual.toFixed(1)}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}



