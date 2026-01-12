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
  isoStatus?: string;
}

export function StatusBadge({
  isActive,
  hasCustomization = false,
  hasUsers = 0,
  subdomain,
  isoStatus,
}: StatusBadgeProps) {
  if (isoStatus) {
    if (isoStatus === "Inativo") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="inactive" className="gap-1">
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

    if (isoStatus === "Completo") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="success" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Completo
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">ISO completo e ativo</p>
              <p className="text-xs text-[#CCCCCC] mt-1">
                ✓ Nome configurado
              </p>
              <p className="text-xs text-[#CCCCCC]">
                ✓ Subdomínio configurado
              </p>
              <p className="text-xs text-[#CCCCCC]">
                ✓ Personalização configurada
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
            <Badge variant="warning" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Incompleto
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">ISO ativo mas incompleto</p>
            {!hasCustomization && (
              <p className="text-xs text-[#CCCCCC] mt-1">
                ⚠ Falta configurar personalização
              </p>
            )}
            {!subdomain && (
              <p className="text-xs text-[#CCCCCC]">
                ⚠ Falta configurar subdomínio
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!isActive) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="inactive" className="gap-1">
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
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Ativo
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">ISO configurado e ativo</p>
            <p className="text-xs text-[#CCCCCC] mt-1">
              ✓ Personalização configurada
            </p>
            <p className="text-xs text-[#CCCCCC]">
              ✓ {hasUsers} usuário(s) cadastrado(s)
            </p>
            <p className="text-xs text-[#CCCCCC]">
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
          <Badge variant="warning" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Incompleto
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">ISO ativo mas incompleto</p>
          {!hasCustomization && (
            <p className="text-xs text-[#CCCCCC] mt-1">
              ⚠ Falta configurar personalização
            </p>
          )}
          {hasUsers === 0 && (
            <p className="text-xs text-[#CCCCCC]">
              ⚠ Falta cadastrar usuários
            </p>
          )}
          {!subdomain && (
            <p className="text-xs text-[#CCCCCC]">
              ⚠ Falta configurar subdomínio
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
