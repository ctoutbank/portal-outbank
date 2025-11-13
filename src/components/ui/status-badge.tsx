"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatusBadgeProps {
  isActive: boolean;
  hasCustomization?: boolean;
  hasUsers?: number;
}

export function StatusBadge({
  isActive,
  hasCustomization = false,
  hasUsers = 0,
}: StatusBadgeProps) {
  if (!isActive) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1">
              <XCircle className="h-3 w-3" />
              Inativo
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Este ISO está desativado</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (hasCustomization && hasUsers > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="gap-1 bg-green-700 hover:bg-green-800">
              <CheckCircle className="h-3 w-3" />
              Ativo Completo
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>ISO ativo com configuração completa</p>
            <p className="text-xs text-muted-foreground">
              ✓ Personalização configurada
            </p>
            <p className="text-xs text-muted-foreground">
              ✓ {hasUsers} usuário(s) cadastrado(s)
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="gap-1 bg-yellow-600 hover:bg-yellow-700">
            <AlertCircle className="h-3 w-3" />
            Config. Incompleta
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>ISO ativo mas com configuração incompleta</p>
          {!hasCustomization && (
            <p className="text-xs text-muted-foreground">
              ⚠ Personalização não configurada
            </p>
          )}
          {hasUsers === 0 && (
            <p className="text-xs text-muted-foreground">
              ⚠ Nenhum usuário cadastrado
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
