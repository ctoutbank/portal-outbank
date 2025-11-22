import { redirect } from "next/navigation";
import { validateSSOToken } from "@/lib/auth/sso-handler";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { validateUserAccessBySubdomain } from "@/lib/subdomain-auth";
import { extractSubdomain, isTenantHost } from "@/lib/subdomain-auth";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function SSOCallbackPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    redirect("/auth/sign-in?error=token_missing");
  }

  try {
    // Validar token SSO
    const tokenData = await validateSSOToken(token);

    if (!tokenData) {
      redirect("/auth/sign-in?error=invalid_token");
    }

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
      redirect("/auth/sign-in?error=user_not_found");
    }

    // Obter subdomínio atual
    const headersList = await headers();
    const hostname = headersList.get("host") || "";
    let subdomain = extractSubdomain(hostname);
    const isTenant = isTenantHost(hostname);

    // Se não for um tenant host reconhecido, tentar extrair subdomain do hostname
    // ou usar o customerSlug do token
    if (!subdomain) {
      // Tentar extrair subdomain do hostname (ex: bancoprisma.vercel.app -> bancoprisma)
      const hostnameParts = hostname.split(".");
      if (hostnameParts.length >= 2) {
        const possibleSubdomain = hostnameParts[0];
        // Verificar se o possível subdomain corresponde ao customerSlug do token
        if (tokenData.customerSlug && possibleSubdomain === tokenData.customerSlug) {
          subdomain = possibleSubdomain;
        } else if (tokenData.customerSlug) {
          // Usar o customerSlug do token se disponível
          subdomain = tokenData.customerSlug;
        }
      } else if (tokenData.customerSlug) {
        // Usar o customerSlug do token como fallback
        subdomain = tokenData.customerSlug;
      }
    }

    if (!subdomain) {
      redirect("/auth/sign-in?error=invalid_subdomain");
    }

    // Verificar se o usuário tem acesso a este subdomínio
    const validation = await validateUserAccessBySubdomain(
      user[0].email,
      subdomain
    );

    if (!validation.authorized) {
      redirect("/unauthorized");
    }

    // Verificar se o usuário já está autenticado no Clerk
    const { userId } = await auth();

    if (!userId) {
      // Se não estiver autenticado, redirecionar para sign-in
      redirect(`/auth/sign-in?redirect_url=/auth/sso/callback?token=${token}`);
    }

    // Verificar se o idClerk corresponde ao usuário autenticado
    const clerkUser = await currentUser();
    if (!clerkUser || user[0].idClerk !== clerkUser.id) {
      redirect("/auth/sign-in?error=user_mismatch");
    }

    // Token válido e usuário autenticado - redirecionar para dashboard
    redirect("/dashboard");
  } catch (error: any) {
    console.error("Erro ao processar callback SSO:", error);
    redirect("/auth/sign-in?error=server_error");
  }
}

