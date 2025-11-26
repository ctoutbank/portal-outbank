"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, TrendingUp, Sparkles } from "lucide-react";

interface ISOStatisticsCardsProps {
  totalActive: number;
  totalInactive: number;
  createdThisMonth: number;
  createdLastWeek: number;
}

export function ISOStatisticsCards({
  totalActive,
  totalInactive,
  createdThisMonth,
  createdLastWeek,
}: ISOStatisticsCardsProps) {
  const stats = [
    {
      label: "ISOs Ativos",
      value: totalActive,
      icon: CheckCircle,
      description: "Total de ISOs ativos",
    },
    {
      label: "Criados Este Mês",
      value: createdThisMonth,
      icon: TrendingUp,
      description: "ISOs criados neste mês",
    },
    {
      label: "Últimos 7 Dias",
      value: createdLastWeek,
      icon: Sparkles,
      description: "ISOs criados nos últimos 7 dias",
    },
    {
      label: "ISOs Inativos",
      value: totalInactive,
      icon: XCircle,
      description: "Total de ISOs inativos",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6 w-full max-w-full overflow-x-hidden">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">{stat.label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{stat.value}</div>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
