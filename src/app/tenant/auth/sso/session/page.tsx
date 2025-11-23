"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

/**
 * Página que processa o session token do Clerk e autentica o usuário automaticamente
 * Esta página é chamada após a API criar o session token
 */
export default function SSOSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession, isSignedIn } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const sessionToken = searchParams.get("__session_token");
  const ssoToken = searchParams.get("token");
  const redirectTo = searchParams.get("redirect_to") || "/dashboard";

  useEffect(() => {
    const authenticate = async () => {
      if (!sessionToken) {
        console.error("Session token não encontrado");
        router.push("/auth/sign-in?error=session_token_missing");
        return;
      }

      try {
        // Se já estiver autenticado, redirecionar direto
        if (isSignedIn) {
          const callbackUrl = ssoToken 
            ? `/auth/sso/callback?token=${ssoToken}`
            : redirectTo;
          router.push(callbackUrl);
          return;
        }

        // Tentar usar o session token para autenticar
        // O Clerk pode processar session tokens via API ou redirecionamento especial
        // Vamos tentar fazer uma chamada à API do Clerk para criar a sessão
        
        try {
          // Tentar fazer uma requisição para a API do Clerk para processar o session token
          // O Clerk pode ter um endpoint especial para isso
          const response = await fetch("/api/auth/sso/set-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionToken }),
          });

          if (response.ok) {
            // Sessão criada com sucesso, redirecionar
            if (ssoToken) {
              router.push(`/auth/sso/callback?token=${ssoToken}`);
            } else {
              router.push(redirectTo);
            }
            return;
          }
        } catch (apiError) {
          console.error("Erro ao chamar API de sessão:", apiError);
        }

        // Se a API não funcionar, tentar redirecionar para Clerk com o token
        // O Clerk pode processar session tokens via URL em alguns casos
        const currentUrl = new URL(window.location.href);
        currentUrl.pathname = "/auth/sso/callback";
        if (ssoToken) {
          currentUrl.searchParams.set("token", ssoToken);
        }
        currentUrl.searchParams.set("__session_token", sessionToken);
        
        // Forçar reload completo para processar o token
        window.location.href = currentUrl.toString();
      } catch (error) {
        console.error("Erro ao processar session token:", error);
        router.push("/auth/sign-in?error=session_error");
      } finally {
        setIsProcessing(false);
      }
    };

    authenticate();
  }, [sessionToken, redirectTo, router, isSignedIn, ssoToken, setSession]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Autenticando...</h2>
        <p className="text-muted-foreground">Por favor, aguarde enquanto configuramos sua sessão.</p>
        {isProcessing && (
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
}
