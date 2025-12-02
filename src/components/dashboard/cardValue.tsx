import type React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CardValueProps {
  title: string;
  description: string;
  value: number;
  previousValue?: number;
  valueType?: "currency" | "number";
  percentage: string;
  icon?: React.ReactNode;
}

export default function CardValue({
  title,
  description,
  value,
  previousValue,
  valueType = "number",
  percentage,
  icon,
}: CardValueProps) {
  return (
    <Card className="bg-[#1f1f1f] border-[#2a2a2a]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon && <div className="text-[#808080]">{icon}</div>}
            <span className="text-xs font-medium text-[#808080]">{title}</span>
          </div>
          <span className="text-xs font-semibold text-white">
            {valueType === "currency"
              ? Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(value)
              : value.toLocaleString("pt-BR")}
          </span>
        </div>
        <Separator className="mb-3 bg-[#2a2a2a]" />
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger>
              <Badge
                variant="outline"
                className={`${
                  Number.parseFloat(percentage) > 0
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-500"
                    : "bg-red-500/20 border-red-500/50 text-red-500"
                } font-medium px-2 py-1 h-auto`}
              >
                {Number.parseFloat(percentage) > 0 ? (
                  <TrendingUp className="h-4 w-4 mr-2" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-2" />
                )}
                {percentage}%
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-white">
                Período anterior:{" "}
                {valueType === "currency"
                  ? Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(previousValue ?? 0)
                  : (previousValue ?? 0).toLocaleString("pt-BR")}
              </p>
            </TooltipContent>
          </Tooltip>
          {description && (
            <span className="text-xs text-[#808080]">{description}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

