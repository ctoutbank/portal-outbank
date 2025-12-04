"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreditCard, Building2, Wallet, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModuleSlug = "adq" | "bnk" | "c&c" | "fin" | string;

interface ModuleBadgeProps {
  moduleSlug: ModuleSlug;
  moduleName?: string;
  className?: string;
  showIcon?: boolean;
  variant?: "default" | "outline" | "secondary";
}

const moduleConfig: Record<string, {
  name: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = {
  adq: {
    name: "ADQ",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700",
    icon: CreditCard,
    description: "Adquirente - Processamento de pagamentos",
  },
  bnk: {
    name: "BNK",
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700",
    icon: Building2,
    description: "Banking - Contas digitais e serviços bancários",
  },
  "c&c": {
    name: "C&C",
    color: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700",
    icon: Wallet,
    description: "Cards & Credit - Cartões e crédito",
  },
  fin: {
    name: "FIN",
    color: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700",
    icon: TrendingUp,
    description: "Financeira - Serviços financeiros",
  },
};

export function ModuleBadge({
  moduleSlug,
  moduleName,
  className,
  showIcon = true,
  variant = "default",
}: ModuleBadgeProps) {
  const normalizedSlug = moduleSlug.toLowerCase().trim();
  const config = moduleConfig[normalizedSlug] || {
    name: moduleName || normalizedSlug.toUpperCase(),
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-900/30 border-gray-300 dark:border-gray-700",
    icon: Building2,
    description: `Módulo ${moduleName || normalizedSlug}`,
  };

  const Icon = config.icon;

  const badgeContent = (
    <Badge
      variant={variant === "outline" ? "outline" : "secondary"}
      className={cn(
        "gap-1.5 font-semibold",
        variant === "default" && config.bgColor,
        variant === "default" && config.color,
        variant === "outline" && "border-2",
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{config.name}</span>
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{config.name}</p>
          <p className="text-xs text-[#CCCCCC] mt-1">
            {config.description}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ModuleBadgesProps {
  moduleSlugs: string[];
  moduleNames?: Record<string, string>;
  className?: string;
  maxVisible?: number;
  showIcon?: boolean;
  variant?: "default" | "outline" | "secondary";
  badgeClassName?: string;
}

export function ModuleBadges({
  moduleSlugs,
  moduleNames,
  className,
  maxVisible = 4,
  showIcon = true,
  variant = "default",
  badgeClassName,
}: ModuleBadgesProps) {
  if (!moduleSlugs || moduleSlugs.length === 0) {
    return null;
  }

  const visibleSlugs = moduleSlugs.slice(0, maxVisible);
  const remainingCount = moduleSlugs.length - maxVisible;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {visibleSlugs.map((slug) => (
        <ModuleBadge
          key={slug}
          moduleSlug={slug}
          moduleName={moduleNames?.[slug]}
          showIcon={showIcon}
          variant={variant}
          className={badgeClassName}
        />
      ))}
      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="font-semibold"
              >
                +{remainingCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-medium">Módulos adicionais:</p>
                {moduleSlugs.slice(maxVisible).map((slug) => (
                  <p key={slug} className="text-xs text-[#CCCCCC]">
                    • {moduleNames?.[slug] || slug.toUpperCase()}
                  </p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}


