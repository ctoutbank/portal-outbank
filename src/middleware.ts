import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractSubdomain, isTenantHost } from "@/lib/subdomain-auth/host";
import { clerkClient } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/auth/sign-in(.*)",
  "/auth/sign-up(.*)",
  "/auth/forgot-password(.*)",
  "/auth/sso/callback(.*)",
  "/forgot-password(.*)",
  "/password-create(.*)",
  "/api/public(.*)",
  "/api/check-subdomain-auth(.*)",
  "/api/auth/sso(.*)",
  "/unauthorized(.*)",
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const hostname = request.headers.get("host") || "";
  const subdomain = extractSubdomain(hostname);
  const isTenant = isTenantHost(hostname);
  
  // Tratar erro em auth() para evitar MIDDLEWARE_INVOCATION_FAILED
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId;
  } catch (error) {
    console.error("Error in auth() middleware:", error);
    // Em caso de erro, continuar com userId = null
  }
  
  const pathname = request.nextUrl.pathname;
  
  if (isTenant && subdomain) {
    if (!userId && pathname === "/") {
      const signInUrl = new URL("/auth/sign-in", request.url);
      return NextResponse.redirect(signInUrl);
    }
    
    // Verificar se usuário precisa criar senha (primeiro login)
    if (userId && pathname !== "/password-create" && !isPublicRoute(request)) {
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(userId);
        const isFirstLogin = user.publicMetadata?.isFirstLogin === true;
        
        if (isFirstLogin) {
          const passwordCreateUrl = new URL("/password-create", request.url);
          return NextResponse.redirect(passwordCreateUrl);
        }
      } catch (error) {
        console.error("Error checking user metadata:", error);
      }
    }
    
    if (userId && pathname === "/") {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    
    if (!isPublicRoute(request)) {
      // Verificar autenticação antes de proteger
      if (!userId) {
        const signInUrl = new URL("/auth/sign-in", request.url);
        signInUrl.searchParams.set("redirect_url", request.url);
        return NextResponse.redirect(signInUrl);
      }
      
      // Se houver userId, tentar proteger (pode lançar NEXT_REDIRECT)
      try {
        await auth.protect();
      } catch (error: any) {
        // NEXT_REDIRECT é uma exceção especial do Next.js para redirects
        // Em vez de re-lançar, fazer redirect manualmente para evitar erro no clerkMiddleware
        if (error?.digest?.startsWith('NEXT_REDIRECT')) {
          // Extrair URL de redirect do erro ou usar sign-in padrão
          const redirectUrl = error?.returnBackUrl || "/auth/sign-in";
          const signInUrl = new URL(redirectUrl.includes("/auth/sign-in") ? redirectUrl : "/auth/sign-in", request.url);
          if (!signInUrl.searchParams.has("redirect_url")) {
            signInUrl.searchParams.set("redirect_url", request.url);
          }
          return NextResponse.redirect(signInUrl);
        }
        console.error("Error in auth.protect() (tenant):", error);
        // Se houver erro real e não houver userId, redirecionar para sign-in
        if (!userId) {
          const signInUrl = new URL("/auth/sign-in", request.url);
          signInUrl.searchParams.set("redirect_url", request.url);
          return NextResponse.redirect(signInUrl);
        }
        // Se houver userId mas auth.protect() falhou, permitir continuar
      }
    }
    
    const tenantRouteMap: Record<string, string> = {
      "/": "/tenant",
      "/sign-in": "/tenant/auth/sign-in",
      "/auth/sign-in": "/tenant/auth/sign-in",
      "/auth/sign-up": "/tenant/auth/sign-up",
      "/auth/forgot-password": "/tenant/auth/forgot-password",
      "/auth/sso/callback": "/tenant/auth/sso/callback",
      "/forgot-password": "/tenant/auth/forgot-password",
      "/password-create": "/tenant/password-create",
      "/dashboard": "/tenant/dashboard",
      "/unauthorized": "/tenant/unauthorized",
    };
    
    const targetPath = tenantRouteMap[pathname];
    
    if (targetPath) {
      const rewriteUrl = new URL(targetPath, request.url);
      // Preservar query params explicitamente
      rewriteUrl.search = request.nextUrl.search;
      const response = NextResponse.rewrite(rewriteUrl);
      response.cookies.set("tenant", subdomain, {
        path: "/",
        httpOnly: false,
      });
      return response;
    }
    
    const response = NextResponse.next();
    response.cookies.set("tenant", subdomain, {
      path: "/",
      httpOnly: false,
    });
    
    return response;
  }
  
  if (!isPublicRoute(request)) {
    // Verificar autenticação antes de proteger
    if (!userId) {
      const signInUrl = new URL("/auth/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", request.url);
      return NextResponse.redirect(signInUrl);
    }
    
    // Se houver userId, tentar proteger (pode lançar NEXT_REDIRECT)
    try {
      await auth.protect();
    } catch (error: any) {
      // NEXT_REDIRECT é uma exceção especial do Next.js para redirects
      // Em vez de re-lançar, fazer redirect manualmente para evitar erro no clerkMiddleware
      if (error?.digest?.startsWith('NEXT_REDIRECT')) {
        // Extrair URL de redirect do erro ou usar sign-in padrão
        const redirectUrl = error?.returnBackUrl || "/auth/sign-in";
        const signInUrl = new URL(redirectUrl.includes("/auth/sign-in") ? redirectUrl : "/auth/sign-in", request.url);
        if (!signInUrl.searchParams.has("redirect_url")) {
          signInUrl.searchParams.set("redirect_url", request.url);
        }
        return NextResponse.redirect(signInUrl);
      }
      console.error("Error in auth.protect() (non-tenant):", error);
      // Se houver erro real e não houver userId, redirecionar para sign-in
      if (!userId) {
        const signInUrl = new URL("/auth/sign-in", request.url);
        signInUrl.searchParams.set("redirect_url", request.url);
        return NextResponse.redirect(signInUrl);
      }
      // Se houver userId mas auth.protect() falhou, permitir continuar
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
