"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { TimeSeriesDataPoint } from "../../serverActions/analytics";

interface AnalyticsTimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  groupBy?: "day" | "week" | "month";
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold mb-2">
          {payload[0].payload.period}
        </p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            className="text-sm"
            style={{ color: entry.color }}
          >
            {entry.name}:{" "}
            {entry.dataKey === "totalValor"
              ? formatCurrency(entry.value)
              : formatNumber(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function AnalyticsTimeSeriesChart({
  data,
  groupBy = "day",
}: AnalyticsTimeSeriesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg">
        <p className="text-[#808080]">Nenhum dado disponível</p>
      </div>
    );
  }

  // Format period labels based on groupBy
  const formattedData = data.map((item) => {
    let formattedPeriod = item.period;
    if (groupBy === "day") {
      // Format YYYY-MM-DD to DD/MM
      const [year, month, day] = item.period.split("-");
      formattedPeriod = `${day}/${month}`;
    } else if (groupBy === "week") {
      // Format IYYY-IW to Semana IW/YYYY
      const [year, week] = item.period.split("-");
      formattedPeriod = `Sem ${week}/${year}`;
    } else if (groupBy === "month") {
      // Format YYYY-MM to MM/YYYY
      const [year, month] = item.period.split("-");
      formattedPeriod = `${month}/${year}`;
    }
    return {
      ...item,
      period: formattedPeriod,
    };
  });

  return (
    <div className="w-full bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Evolução de Transações e Valores
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis
            dataKey="period"
            stroke="#808080"
            tick={{ fill: "#808080" }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            yAxisId="left"
            stroke="#808080"
            tick={{ fill: "#808080" }}
            label={{
              value: "Quantidade",
              angle: -90,
              position: "insideLeft",
              style: { fill: "#808080" },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#808080"
            tick={{ fill: "#808080" }}
            tickFormatter={(value) => {
              if (value >= 1000000) {
                return `R$ ${(value / 1000000).toFixed(1)}M`;
              }
              if (value >= 1000) {
                return `R$ ${(value / 1000).toFixed(1)}k`;
              }
              return `R$ ${value}`;
            }}
            label={{
              value: "Valor (R$)",
              angle: 90,
              position: "insideRight",
              style: { fill: "#808080" },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: "#808080" }}
            iconType="line"
          />
          <Bar
            yAxisId="left"
            dataKey="totalTransacoes"
            fill="#3b82f6"
            name="Transações"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="totalValor"
            stroke="#10b981"
            strokeWidth={2}
            name="Valor Total"
            dot={{ fill: "#10b981", r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}



