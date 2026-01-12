"use client";

import { BiData } from "../bi-dashboard";
import { Wallet, Clock, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { LayerHeader } from "../shared/layer-header";
import { InfoCard } from "../shared/info-card";
import { ChartCard } from "../shared/chart-card";
import { CHART_PALETTE } from "../shared/colors";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

type Props = { data: BiData };

function formatCurrency(value: number): string {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
  return `R$ ${value.toFixed(2)}`;
}

export function FinancialLayer({ data }: Props) {
  const { settlement, customerBreakdown } = data;

  const chartData = customerBreakdown.slice(0, 8).map((c, index) => ({
    name: c.name.length > 12 ? c.name.substring(0, 12) + '...' : c.name,
    tpv: c.tpv,
    colorIndex: index
  }));

  return (
    <div className="space-y-6">
      <LayerHeader number={2} title="Financeiro e Liquidação" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard
          title="Valor Bruto"
          value={formatCurrency(settlement.bruto)}
          icon={Wallet}
        />
        <InfoCard
          title="Valor Líquido"
          value={formatCurrency(settlement.liquido)}
          icon={ArrowUpRight}
          iconColor="green"
        />
        <InfoCard
          title="Receita de Taxas"
          value={formatCurrency(settlement.taxas)}
          icon={ArrowDownRight}
        />
        <InfoCard
          title="Liquidações Pendentes"
          value={settlement.pendingCount.toString()}
          icon={Clock}
        />
      </div>

      <ChartCard 
        title="TPV por ISO"
        infoText="Distribuição do volume total de pagamentos por ISO/cliente"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
              <XAxis type="number" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} />
              <YAxis type="category" dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => [formatCurrency(value), 'TPV']}
              />
              <Bar dataKey="tpv" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
