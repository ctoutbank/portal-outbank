"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GetTotalTransactionsByMonthResult } from "@/features/transactions/serverActions/transaction";

export function BarChartCustom({
  chartData,
  viewMode,
}: {
  chartData?: GetTotalTransactionsByMonthResult[];
  viewMode?: string;
}) {
  const [activeChart, setActiveChart] = React.useState<"bruto" | "lucro">("bruto");

  const isMonthlyView = viewMode === "month";

  const normalizedData = React.useMemo(() => {
    return chartData || [];
  }, [chartData]);

  const total = React.useMemo(
    () => ({
      bruto: chartData?.reduce((acc, curr) => acc + curr.bruto, 0) || 0,
      lucro: chartData?.reduce((acc, curr) => acc + curr.lucro, 0) || 0,
    }),
    [chartData]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">
            {isMonthlyView ? `Dia ${data.dayOfMonth}` : data.date}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-[#1f1f1f] border-[#2a2a2a]">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b border-[#2a2a2a] p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle className="text-white">Gráfico de Barras</CardTitle>
          <CardDescription className="text-[#808080]">
            {isMonthlyView
              ? "Mostrando o total de transações por dia do mês"
              : "Mostrando o total de transações por mês"}
          </CardDescription>
        </div>
        <div className="flex">
          {(["bruto", "lucro"] as const).map((key) => {
            return (
              <button
                key={key}
                data-active={activeChart === key}
                className={`relative z-30 flex flex-1 flex-col justify-center gap-1 border-t border-[#2a2a2a] px-6 py-4 text-left even:border-l even:border-[#2a2a2a] sm:border-l sm:border-t-0 sm:px-8 sm:py-6 ${
                  activeChart === key
                    ? "bg-[#252525]"
                    : "bg-[#1f1f1f] hover:bg-[#252525]"
                }`}
                onClick={() => setActiveChart(key)}
              >
                <span className="text-xs text-[#808080]">
                  {key === "bruto" ? "Bruto" : "Lucro"} (R$)
                </span>
                <span className="text-lg font-bold leading-none text-white sm:text-3xl">
                  {formatCurrency(total[key])}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={normalizedData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis
              dataKey={isMonthlyView ? "dayOfMonth" : "date"}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              stroke="#808080"
              tick={{ fill: "#808080" }}
              tickFormatter={(value) => {
                if (isMonthlyView) {
                  return value.toString();
                }
                const date = new Date(value);
                return date.toLocaleDateString("pt-BR", {
                  month: "short",
                  year: "numeric",
                });
              }}
            />
            <YAxis
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
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ color: "#808080" }}
              iconType="line"
            />
            <Bar
              dataKey={activeChart}
              fill={activeChart === "bruto" ? "#3b82f6" : "#10b981"}
              name={activeChart === "bruto" ? "Bruto" : "Lucro"}
              radius={[4, 4, 0, 0]}
            />
            {activeChart === "lucro" ? (
              <Bar
                dataKey="count"
                fill="#8b5cf6"
                name="Transações"
                radius={[4, 4, 0, 0]}
              />
            ) : (
              <Bar
                dataKey="lucro"
                fill="#10b981"
                name="Lucro"
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

