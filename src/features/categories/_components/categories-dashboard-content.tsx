"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tags } from "lucide-react";

type CategoriesDashboardContentProps = {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
  avgWaitingPeriodCp: number;
  avgWaitingPeriodCnp: number;
  avgAnticipationRiskFactorCp: number;
  avgAnticipationRiskFactorCnp: number;
};

export function CategoriesDashboardContent({
  totalCategories,
  activeCategories,
  inactiveCategories,
}: CategoriesDashboardContentProps) {
  return (
    <div className="w-full max-w-full">
      <div className="w-full mt-2 mb-2">
        <Card className="w-full border-l-8 border-black bg-transparent p-6 flex justify-center items-center">
          <div className="flex items-center justify-between">
            {/* Card Único de Categorias */}
            <div className="w-[500px]">
              <Card className="bg-transparent border">
                <CardContent className="p-4">
                  {/* Total de Categorias */}
                  <div className="text-center mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Tags className="h-4 w-4 text-muted-foreground" />
                      <span className="text-base font-medium">
                        Total de Categorias
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-zinc-900">
                      {totalCategories}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Total de Categorias
                    </div>
                  </div>

                  {/* Status das Categorias */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium text-zinc-600">
                          Ativas
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-zinc-900">
                        {activeCategories}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-xs font-medium text-zinc-600">
                          Inativas
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-zinc-900">
                        {inactiveCategories}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
