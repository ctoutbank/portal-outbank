"use client";

import { BiData } from "../bi-dashboard";
import { LayerHeader } from "../shared/layer-header";
import { ChartCard } from "../shared/chart-card";
import { HEATMAP_GRADIENT, SHIFT_COLORS, DAY_COLORS, CHART_PALETTE, formatCurrencyFull, formatCurrencyShort, formatNumber } from "../shared/colors";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell
} from "recharts";

type Props = { data: BiData };

export function TemporalLayer({ data }: Props) {
  const { hourlyHeatmap, weekdayVolume, shiftVolume } = data;

  const heatmapData: Record<number, Record<number, number>> = {};
  hourlyHeatmap.forEach(h => {
    if (!heatmapData[h.dayOfWeek]) heatmapData[h.dayOfWeek] = {};
    heatmapData[h.dayOfWeek][h.hour] = h.tpv;
  });

  const maxTpv = Math.max(...hourlyHeatmap.map(h => h.tpv), 1);
  
  const getHeatColor = (value: number) => {
    const intensity = value / maxTpv;
    if (intensity < 0.2) return HEATMAP_GRADIENT[0];
    if (intensity < 0.4) return HEATMAP_GRADIENT[1];
    if (intensity < 0.6) return HEATMAP_GRADIENT[2];
    if (intensity < 0.8) return HEATMAP_GRADIENT[3];
    return HEATMAP_GRADIENT[4];
  };

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const shiftData = shiftVolume.map(s => ({
    name: s.shift,
    tpv: s.tpv,
    count: s.count
  }));

  const weekdayData = weekdayVolume.sort((a, b) => {
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.indexOf(a.dayIndex) - order.indexOf(b.dayIndex);
  });

  const ticketByHour = Array.from({ length: 24 }, (_, hour) => {
    const hourData = hourlyHeatmap.filter(h => h.hour === hour);
    const totalTpv = hourData.reduce((sum, h) => sum + h.tpv, 0);
    const totalCount = hourData.reduce((sum, h) => sum + h.count, 0);
    return {
      hour: `${hour.toString().padStart(2, '0')}h`,
      ticketMedio: totalCount > 0 ? totalTpv / totalCount : 0
    };
  });

  return (
    <div className="space-y-6">
      <LayerHeader number={4} title="Análise Temporal" />

      <ChartCard 
        title="Heatmap 24h x Dia da Semana"
        infoText="Mapa de calor mostrando concentração de volume por hora do dia e dia da semana"
      >
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="flex">
              <div className="w-12" />
              {hours.map(h => (
                <div key={h} className="flex-1 text-center text-xs text-muted-foreground">
                  {h.toString().padStart(2, '0')}
                </div>
              ))}
            </div>
            {days.map((day, dayIndex) => (
              <div key={day} className="flex items-center mt-1">
                <div className="w-12 text-xs text-muted-foreground">{day}</div>
                {hours.map(hour => {
                  const value = heatmapData[dayIndex]?.[hour] || 0;
                  return (
                    <div
                      key={hour}
                      className="flex-1 h-6 mx-0.5 rounded-sm cursor-pointer transition-all hover:scale-110"
                      style={{ backgroundColor: getHeatColor(value) }}
                      title={`${day} ${hour}h: ${formatCurrencyFull(value)}`}
                    />
                  );
                })}
              </div>
            ))}
            <div className="flex items-center justify-end mt-4 gap-2">
              <span className="text-xs text-muted-foreground">Baixo</span>
              <div className="flex gap-1">
                {HEATMAP_GRADIENT.map((color, i) => (
                  <div key={i} className="w-6 h-3 rounded-sm" style={{ backgroundColor: color }} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">Alto</span>
            </div>
          </div>
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="Volume por Turno"
          infoText="Distribuição do volume por período do dia: Madrugada (00-06h), Manhã (06-12h), Tarde (12-18h), Noite (18-24h)"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shiftData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 10 }} tickFormatter={(v) => formatCurrencyShort(v)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number, name: string) => [
                    name === 'tpv' ? formatCurrencyFull(value) : formatNumber(value),
                    name === 'tpv' ? 'TPV' : 'Qtd'
                  ]}
                />
                <Bar dataKey="tpv" radius={[4, 4, 0, 0]}>
                  {shiftData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={SHIFT_COLORS[entry.name] || CHART_PALETTE[0]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard 
          title="Volume por Dia da Semana"
          infoText="Distribuição do volume total por dia da semana"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekdayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="day" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 10 }} tickFormatter={(v) => formatCurrencyShort(v)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [formatCurrencyFull(value), 'TPV']}
                />
                <Bar dataKey="tpv" radius={[4, 4, 0, 0]}>
                  {weekdayData.map((entry) => (
                    <Cell key={`cell-${entry.dayIndex}`} fill={DAY_COLORS[entry.dayIndex]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard 
        title="Ticket Médio por Hora do Dia"
        infoText="Valor médio das transações ao longo das 24 horas do dia"
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ticketByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="hour" stroke="#666" tick={{ fill: '#888', fontSize: 10 }} interval={1} />
              <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 10 }} tickFormatter={(v) => formatCurrencyShort(v)} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => [formatCurrencyFull(value), 'Ticket Médio']}
              />
              <Line 
                type="monotone" 
                dataKey="ticketMedio" 
                stroke={CHART_PALETTE[2]} 
                strokeWidth={2}
                dot={{ r: 3, fill: CHART_PALETTE[2] }}
                activeDot={{ r: 5, fill: CHART_PALETTE[2] }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
