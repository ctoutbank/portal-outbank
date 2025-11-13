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
  subdomain?: string;
}

export function StatusBadge({
  isActive,
  hasCustomization = false,
  hasUsers = 0,
  subdomain,
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

  if (hasCustomization && hasUsers > 0 && subdomain) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="gap-1 bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-3 w-3" />
              Ativo
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">ISO configurado e ativo</p>
            <p className="text-xs text-muted-foreground mt-1">
              ✓ Personalização configurada
            </p>
            <p className="text-xs text-muted-foreground">
              ✓ {hasUsers} usuário(s) cadastrado(s)
            </p>
            <p className="text-xs text-muted-foreground">
              ✓ Subdomínio configurado
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
          <Badge className="gap-1 bg-amber-500 hover:bg-amber-600">
            <AlertCircle className="h-3 w-3" />
            Incompleto
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">ISO ativo mas incompleto</p>
          {!hasCustomization && (
            <p className="text-xs text-muted-foreground mt-1">
              ⚠ Falta configurar personalização
            </p>
          )}
          {hasUsers === 0 && (
            <p className="text-xs text-muted-foreground">
              ⚠ Falta cadastrar usuários
            </p>
          )}
          {!subdomain && (
            <p className="text-xs text-muted-foreground">
              ⚠ Falta configurar subdomínio
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
