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
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "ISOs Inativos",
      value: totalInactive,
      icon: XCircle,
      color: "text-gray-600",
      bgColor: "bg-gray-50 dark:bg-gray-950",
    },
    {
      label: "Criados Este Mês",
      value: createdThisMonth,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Últimos 7 Dias",
      value: createdLastWeek,
      icon: Sparkles,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
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
