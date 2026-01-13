"use client";

import { BiData } from "../bi-dashboard";
import { Activity, Zap } from "lucide-react";
import { LayerHeader } from "../shared/layer-header";
import { InfoCard } from "../shared/info-card";
import { ChartCard } from "../shared/chart-card";
import { STATUS_COLORS, CHART_PALETTE, formatDateLabel, formatCurrencyFull, formatNumber, formatPercent } from "../shared/colors";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from "recharts";

type Props = { data: BiData };

const STATUS_LABELS: Record<string, string> = {
  'AUTHORIZED': 'Autorizado',
  'CANCELED': 'Cancelado',
  'DENIED': 'Negado',
  'PENDING': 'Pendente',
  'PROCESSING': 'Processando'
};

const FUNNEL_COLORS = ['#8b9a6b', '#a8b88a', '#d9956a'];

export function ConversionLayer({ data }: Props) {
  const { statusDistribution, dailyTpv, executive } = data;

  const totalTransactions = statusDistribution.reduce((sum, s) => sum + s.count, 0);
  
  const funnelData = [
    { 
      name: 'Total', 
      value: totalTransactions, 
      percent: 100 
    },
    { 
      name: 'Autorizadas', 
      value: statusDistribution.find(s => s.status === 'AUTHORIZED')?.count || 0,
      percent: parseFloat(executive.taxaAprovacao)
    },
    { 
      name: 'Liquidadas', 
      value: Math.round((statusDistribution.find(s => s.status === 'AUTHORIZED')?.count || 0) * 0.85),
      percent: parseFloat(executive.taxaAprovacao) * 0.85
    }
  ];

  const statusData = statusDistribution.map(s => ({
    name: STATUS_LABELS[s.status] || s.status,
    status: s.status,
    count: s.count,
    tpv: s.tpv,
    percent: ((s.count / totalTransactions) * 100).toFixed(1)
  })).sort((a, b) => b.count - a.count);

  const approvalByDay = dailyTpv.map(d => ({
    date: formatDateLabel(d.date),
    taxaAprovacao: parseFloat(d.taxaAprovacao)
  }));

  return (
    <div className="space-y-6">
      <LayerHeader number={5} title="Conversão e Performance" />

      <div className="grid grid-cols-2 gap-4">
        <InfoCard
          title="Taxa de Aprovação"
          value={formatPercent(parseFloat(executive.taxaAprovacao))}
          icon={Activity}
          iconColor="green"
        />
        <InfoCard
          title="Latência Média"
          value="~1.2s"
          icon={Zap}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="Funil de Conversão"
          infoText="Visualização do funil de conversão: Total → Autorizadas → Liquidadas"
        >
          <div className="space-y-4">
            {funnelData.map((item, index) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="text-foreground font-medium">{formatNumber(item.value)} ({item.percent.toFixed(1).replace('.', ',')}%)</span>
                </div>
                <div className="h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500"
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: FUNNEL_COLORS[index]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard 
          title="Distribuição por Status"
          infoText="Quantidade de transações agrupadas por status de processamento"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                <XAxis type="number" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number, name: string) => [
                    name === 'count' ? formatNumber(value) : formatCurrencyFull(value),
                    name === 'count' ? 'Quantidade' : 'TPV'
                  ]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {statusData.map((entry) => (
                    <Cell key={`cell-${entry.status}`} fill={STATUS_COLORS[entry.status] || CHART_PALETTE[0]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard 
        title="Taxa de Aprovação ao Longo do Tempo"
        infoText="Evolução da taxa de aprovação de transações ao longo do período selecionado"
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={approvalByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
              <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => [`${value.toFixed(1).replace('.', ',')}%`, 'Taxa Aprovação']}
              />
              <Line 
                type="monotone" 
                dataKey="taxaAprovacao" 
                stroke={CHART_PALETTE[0]} 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: CHART_PALETTE[0] }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
