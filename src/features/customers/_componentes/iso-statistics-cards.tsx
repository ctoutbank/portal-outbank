"use client";

import { Card, CardContent } from "@/components/ui/card";
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
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      cardBg: "bg-slate-50/50 dark:bg-slate-900/50",
    },
    {
      label: "Criados Este Mês",
      value: createdThisMonth,
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      cardBg: "bg-slate-50/50 dark:bg-slate-900/50",
    },
    {
      label: "Últimos 7 Dias",
      value: createdLastWeek,
      icon: Sparkles,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      cardBg: "bg-slate-50/50 dark:bg-slate-900/50",
    },
    {
      label: "ISOs Inativos",
      value: totalInactive,
      icon: XCircle,
      color: "text-slate-600 dark:text-slate-400",
      bgColor: "bg-slate-50 dark:bg-slate-950/30",
      cardBg: "bg-slate-50/50 dark:bg-slate-900/50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full max-w-full overflow-x-hidden">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className={`border-0 shadow-sm ${stat.cardBg} transition-colors`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full flex-shrink-0 ml-2`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
