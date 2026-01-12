"use client";

import { BiData } from "../bi-dashboard";
import { Percent, Calculator, TrendingUp } from "lucide-react";
import { LayerHeader } from "../shared/layer-header";
import { InfoCard } from "../shared/info-card";

type Props = { data: BiData };

function formatCurrency(value: number): string {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}K`;
  return `R$ ${value.toFixed(2)}`;
}

export function MdrMarginsLayer({ data }: Props) {
  const { settlement, mdrData } = data;

  const mdrEstimation = settlement.taxas;
  const avgMdr = settlement.bruto > 0 ? (settlement.taxas / settlement.bruto) * 100 : 0;
  
  const avgMarginPortal = mdrData?.avgMarginPortal || 0;

  return (
    <div className="space-y-6">
      <LayerHeader number={7} title="MDR e Margens" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <InfoCard
          title="MDR Médio"
          value={`${avgMdr.toFixed(2)}%`}
          icon={Percent}
        />
        <InfoCard
          title="Receita de Taxas"
          value={formatCurrency(mdrEstimation)}
          icon={Calculator}
        />
        <InfoCard
          title="Margem Portal Média"
          value={`${avgMarginPortal.toFixed(2)}%`}
          icon={TrendingUp}
        />
      </div>
    </div>
  );
}
