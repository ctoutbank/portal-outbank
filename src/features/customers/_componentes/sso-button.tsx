"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Função client-side para construir URL de redirecionamento SSO
function redirectToISOWithSSO(customerSlug: string, token: string): string {
  if (!customerSlug) {
    throw new Error("Slug do ISO não encontrado");
  }

  // Todos os ISOs usam o domínio consolle.one
  // Em desenvolvimento, usar localhost
  const hostname = window.location.hostname;
  let baseDomain = "consolle.one"; // padrão para produção
  
  // Apenas em desenvolvimento usar localhost
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    baseDomain = "localhost:3000";
  }
  // Sempre usar consolle.one para ISOs em produção

  // Construir URL do subdomínio do ISO
  const protocol = window.location.protocol;
  const subdomainUrl = `${protocol}//${customerSlug}.${baseDomain}`;

  // URL de callback SSO
  return `${subdomainUrl}/auth/sso/callback?token=${token}`;
}

interface SSOButtonProps {
  customerId: number;
  customerSlug: string | null | undefined;
  hasAccess: boolean;
}

export function SSOButton({ customerId, customerSlug, hasAccess }: SSOButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!hasAccess || !customerSlug) {
    return (
      <span className="text-muted-foreground text-sm">
        --
      </span>
    );
  }

  const handleSSOClick = async () => {
    try {
      setIsLoading(true);

      // Buscar informações do usuário atual
      const userResponse = await fetch("/api/auth/user-info");
      if (!userResponse.ok) {
        throw new Error("Erro ao buscar informações do usuário");
      }
      const userInfo = await userResponse.json();

      if (!userInfo?.id) {
        throw new Error("Usuário não autenticado");
      }

      // Gerar token SSO (via server action)
      const response = await fetch("/api/auth/sso/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userInfo.id,
          customerId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao gerar token SSO");
      }

      const { token } = await response.json();

      // Redirecionar para o ISO com SSO em nova aba
      const redirectUrl = redirectToISOWithSSO(customerSlug, token);
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
      setIsLoading(false);
    } catch (error: any) {
      console.error("Erro ao acessar ISO via SSO:", error);
      toast.error(error.message || "Erro ao acessar ISO via SSO");
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSSOClick}
            disabled={isLoading || !customerSlug}
            className="h-8 w-8 p-0"
          >
            <LogIn className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Acessar via SSO</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

