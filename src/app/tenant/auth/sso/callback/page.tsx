import { redirect } from "next/navigation";
import { validateSSOToken } from "@/lib/auth/sso-handler";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { validateUserAccessBySubdomain } from "@/lib/subdomain-auth";
import { extractSubdomain } from "@/lib/subdomain-auth";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

function logCallback(level: "info" | "error" | "warn", message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[SSO Callback ${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  if (data) {
    console.log(logMessage, JSON.stringify(data, null, 2));
  } else {
    console.log(logMessage);
  }
}

export default async function SSOCallbackPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token;

  logCallback("info", "Callback SSO iniciado", { 
    hasToken: !!token,
    tokenPrefix: token ? token.substring(0, 8) + "..." : null,
  });

  if (!token) {
    logCallback("error", "Token SSO ausente na URL");
    redirect("/auth/sign-in?error=token_missing");
  }

  try {
    // Validar token SSO
    logCallback("info", "Validando token SSO");
    const tokenData = await validateSSOToken(token);

    if (!tokenData) {
      logCallback("error", "Token SSO inválido ou expirado");
      redirect("/auth/sign-in?error=invalid_token");
    }

    logCallback("info", "Token SSO validado", {
      userId: tokenData.userId,
      customerId: tokenData.customerId,
      customerSlug: tokenData.customerSlug,
    });

    // Buscar usuário no banco
    const user = await db
      .select({
        id: users.id,
        idClerk: users.idClerk,
        email: users.email,
        idCustomer: users.idCustomer,
      })
      .from(users)
      .where(eq(users.id, tokenData.userId))
      .limit(1);

    if (!user || user.length === 0 || !user[0].email) {
      logCallback("error", "Usuário não encontrado no banco", {
        userId: tokenData.userId,
      });
      redirect("/auth/sign-in?error=user_not_found");
    }

    logCallback("info", "Usuário encontrado no banco", {
      userId: user[0].id,
      email: user[0].email,
      idClerk: user[0].idClerk,
      idCustomer: user[0].idCustomer,
    });

    // Obter subdomínio atual
    const headersList = await headers();
    const hostname = headersList.get("host") || "";
    const subdomain = extractSubdomain(hostname);

    logCallback("info", "Informações do hostname", { hostname, subdomain });

    if (!subdomain) {
      logCallback("error", "Subdomínio inválido", { hostname });
      redirect("/auth/sign-in?error=invalid_subdomain");
    }

    // Verificar se o usuário tem acesso a este subdomínio
    logCallback("info", "Validando acesso ao subdomínio", {
      email: user[0].email,
      subdomain,
    });
    const validation = await validateUserAccessBySubdomain(
      user[0].email,
      subdomain
    );

    logCallback("info", "Resultado da validação de acesso", {
      authorized: validation.authorized,
      reason: (validation as any).reason || null,
    });

    if (!validation.authorized) {
      logCallback("warn", "Usuário não autorizado para este subdomínio", {
        email: user[0].email,
        subdomain,
        reason: (validation as any).reason,
      });
      redirect("/unauthorized");
    }

    // Verificar se o usuário já está autenticado no Clerk
    const { userId: clerkUserId } = await auth();

    logCallback("info", "Status de autenticação Clerk", {
      authenticated: !!clerkUserId,
      clerkUserId,
      expectedIdClerk: user[0].idClerk,
    });

    if (!clerkUserId) {
      // Se não estiver autenticado, redirecionar para sign-in
      // Preservar o token SSO na URL para uso após autenticação
      // IMPORTANTE: Usar URL absoluta para garantir que o Clerk redirecione para o subdomínio correto
      logCallback("info", "Usuário não autenticado no Clerk, redirecionando para sign-in");
      const protocol = headersList.get("x-forwarded-proto") || "https";
      const currentHost = headersList.get("host") || hostname;
      const callbackUrl = `${protocol}://${currentHost}/auth/sso/callback?token=${token}`;
      const redirectUrl = encodeURIComponent(callbackUrl);
      redirect(`/auth/sign-in?redirect_url=${redirectUrl}`);
    }

    // Verificar se o idClerk corresponde ao usuário autenticado
    const clerkUser = await currentUser();
    if (!clerkUser || user[0].idClerk !== clerkUser.id) {
      logCallback("error", "Mismatch entre usuário do token e Clerk", {
        tokenIdClerk: user[0].idClerk,
        clerkUserId: clerkUser?.id,
      });
      redirect("/auth/sign-in?error=user_mismatch");
    }

    // Token válido e usuário autenticado - redirecionar para dashboard
    logCallback("info", "Callback SSO concluído com sucesso, redirecionando para dashboard");
    redirect("/dashboard");
  } catch (error: any) {
    logCallback("error", "Erro ao processar callback SSO", {
      message: error.message,
      stack: error.stack,
    });
    redirect("/auth/sign-in?error=server_error");
  }
}

