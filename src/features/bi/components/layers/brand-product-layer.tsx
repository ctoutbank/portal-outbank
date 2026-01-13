"use client";

import { BiData } from "../bi-dashboard";
import { LayerHeader } from "../shared/layer-header";
import { ChartCard } from "../shared/chart-card";
import { CHART_PALETTE, getProductLabel, formatCurrencyFull, formatCurrencyShort } from "../shared/colors";
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

export function BrandProductLayer({ data }: Props) {
  const { brandAnalysis, productMix } = data;

  const brandData = brandAnalysis.map(b => ({
    name: b.name,
    tpv: b.tpv,
    taxaAprovacao: parseFloat(b.taxaAprovacao)
  }));

  const productData = productMix.map(p => ({
    name: getProductLabel(p.name),
    value: p.value
  }));

  return (
    <div className="space-y-6">
      <LayerHeader number={3} title="Análise por Bandeira e Produto" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="TPV por Bandeira"
          infoText="Volume total de pagamentos distribuído por bandeira (Visa, Master, Elo, etc.)"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 10 }} tickFormatter={(v) => formatCurrencyShort(v)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [formatCurrencyFull(value), 'TPV']}
                />
                <Bar dataKey="tpv" radius={[4, 4, 0, 0]}>
                  {brandData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard 
          title="TPV por Tipo de Produto"
          infoText="Volume distribuído por modalidade (crédito, débito, PIX, voucher)"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 10 }} tickFormatter={(v) => formatCurrencyShort(v)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [formatCurrencyFull(value), 'TPV']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {productData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_PALETTE[(index + 3) % CHART_PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard 
        title="Taxa de Aprovação por Bandeira"
        infoText="Percentual de aprovação de transações por bandeira. Verde: >=90%, Amarelo: >=80%, Vermelho: <80%"
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={brandData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
              <XAxis type="number" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taxa Aprovação']}
              />
              <Bar dataKey="taxaAprovacao" radius={[0, 4, 4, 0]}>
                {brandData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.taxaAprovacao >= 90 ? '#8b9a6b' : entry.taxaAprovacao >= 80 ? '#d9956a' : '#c45a3b'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
