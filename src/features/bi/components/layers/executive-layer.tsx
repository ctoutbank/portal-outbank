"use client";

import { BiData } from "../bi-dashboard";
import { DollarSign, CreditCard, Receipt, CheckCircle, XCircle } from "lucide-react";
import { LayerHeader } from "../shared/layer-header";
import { InfoCard } from "../shared/info-card";
import { ChartCard } from "../shared/chart-card";
import { CHART_PALETTE, getProductLabel, formatDateLabel } from "../shared/colors";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

type Props = { data: BiData };

function formatCurrency(value: number): string {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
  return `R$ ${value.toFixed(2)}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}

export function ExecutiveLayer({ data }: Props) {
  const { executive, dailyTpv, productMix } = data;

  const chartData = dailyTpv.map(d => ({
    date: formatDateLabel(d.date),
    tpv: d.tpv,
    count: d.count
  }));

  const pieData = productMix.map(p => ({
    name: getProductLabel(p.name),
    value: p.value
  }));

  return (
    <div className="space-y-6">
      <LayerHeader number={1} title="Visão Executiva" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <InfoCard
          title="TPV Total"
          value={formatCurrency(executive.tpv)}
          icon={DollarSign}
        />
        <InfoCard
          title="Transações"
          value={formatNumber(executive.totalTransactions)}
          icon={CreditCard}
        />
        <InfoCard
          title="Ticket Médio"
          value={formatCurrency(executive.ticketMedio)}
          icon={Receipt}
        />
        <InfoCard
          title="Taxa Aprovação"
          value={`${executive.taxaAprovacao}%`}
          icon={CheckCircle}
          iconColor="green"
        />
        <InfoCard
          title="Taxa Cancelamento"
          value={`${executive.taxaCancelamento}%`}
          icon={XCircle}
        />
        <InfoCard
          title="Taxa Recusa"
          value={`${executive.taxaRecusa}%`}
          icon={XCircle}
          iconColor="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard 
          title="TPV Diário" 
          className="lg:col-span-2"
          infoText="Evolução do volume total de pagamentos por dia no período selecionado"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [formatCurrency(value), 'TPV']}
                />
                <Line 
                  type="monotone" 
                  dataKey="tpv" 
                  stroke={CHART_PALETTE[0]} 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: CHART_PALETTE[0] }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard 
          title="Mix de Produtos"
          infoText="Distribuição do volume por tipo de produto (crédito, débito, PIX, etc.)"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                  labelLine={false}
                  style={{ fontSize: '11px' }}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '8px', color: '#888' }}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
