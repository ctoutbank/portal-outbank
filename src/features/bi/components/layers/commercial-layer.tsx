"use client";

import { BiData } from "../bi-dashboard";
import { Store, Users, TrendingUp, Building2 } from "lucide-react";
import { LayerHeader } from "../shared/layer-header";
import { InfoCard } from "../shared/info-card";
import { ChartCard } from "../shared/chart-card";
import { CHART_PALETTE, formatCurrencyFull, formatCurrencyShort, formatNumber } from "../shared/colors";
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

export function CommercialLayer({ data }: Props) {
  const { topMerchants, customerBreakdown } = data;

  const merchantData = topMerchants.map((m, i) => ({
    name: m.name.length > 15 ? m.name.substring(0, 15) + '...' : m.name,
    fullName: m.name,
    tpv: m.tpv,
    count: m.count,
    rank: i + 1
  }));

  const totalMerchants = topMerchants.length;
  const totalTpv = topMerchants.reduce((sum, m) => sum + m.tpv, 0);
  const activeMerchants = topMerchants.filter(m => m.count > 0).length;

  return (
    <div className="space-y-6">
      <LayerHeader number={6} title="Comercial e ECs" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard
          title="Top Merchants"
          value={totalMerchants.toString()}
          icon={Store}
        />
        <InfoCard
          title="TPV Top 10"
          value={formatCurrencyFull(totalTpv)}
          icon={TrendingUp}
        />
        <InfoCard
          title="ECs Ativos"
          value={activeMerchants.toString()}
          icon={Users}
        />
        <InfoCard
          title="ISOs Ativos"
          value={customerBreakdown.length.toString()}
          icon={Building2}
        />
      </div>

      <ChartCard 
        title="Top 10 Merchants por TPV"
        infoText="Ranking dos 10 estabelecimentos com maior volume de transações"
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={merchantData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
              <XAxis type="number" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} tickFormatter={(v) => formatCurrencyShort(v)} />
              <YAxis type="category" dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} width={120} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number, name: string) => [
                  name === 'tpv' ? formatCurrencyFull(value) : formatNumber(value),
                  name === 'tpv' ? 'TPV' : 'Transações'
                ]}
                labelFormatter={(label) => merchantData.find(m => m.name === label)?.fullName || label}
              />
              <Bar dataKey="tpv" radius={[0, 4, 4, 0]}>
                {merchantData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="Ranking de Merchants"
          infoText="Lista dos 5 maiores estabelecimentos com detalhes de volume e transações"
        >
          <div className="space-y-3">
            {merchantData.slice(0, 5).map((merchant, index) => (
              <div key={merchant.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: CHART_PALETTE[index] }}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{merchant.fullName}</p>
                    <p className="text-xs text-muted-foreground">{formatNumber(merchant.count)} transações</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{formatCurrencyFull(merchant.tpv)}</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard 
          title="Distribuição por ISO"
          infoText="Participação de cada ISO no volume total de transações"
        >
          <div className="space-y-3">
            {customerBreakdown.slice(0, 5).map((customer, index) => {
              const totalCustomerTpv = customerBreakdown.reduce((sum, c) => sum + c.tpv, 0);
              const percent = (customer.tpv / totalCustomerTpv) * 100;
              
              return (
                <div key={customer.slug} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{customer.name}</span>
                    <span className="text-foreground font-medium">{formatCurrencyFull(customer.tpv)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: CHART_PALETTE[index % CHART_PALETTE.length]
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
