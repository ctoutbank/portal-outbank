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
  
  // Tratar erros em auth() para evitar MIDDLEWARE_INVOCATION_FAILED
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId;
  } catch (error) {
    console.error("Error getting auth in middleware:", error);
    // Se houver erro na autenticação, continuar com userId = null (comportamento seguro)
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
      try {
        await auth.protect();
      } catch (error) {
        console.error("Error in auth.protect() (tenant):", error);
        // Se houver erro no protect e não houver userId, redirecionar para sign-in
        // Caso contrário, permitir que continue (pode ser erro temporário)
        if (!userId) {
          const signInUrl = new URL("/auth/sign-in", request.url);
          return NextResponse.redirect(signInUrl);
        }
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
    try {
      await auth.protect();
    } catch (error) {
      console.error("Error in auth.protect() (non-tenant):", error);
      // Se houver erro no protect e não houver userId, redirecionar para sign-in
      // Caso contrário, permitir que continue (pode ser erro temporário)
      if (!userId) {
        const signInUrl = new URL("/auth/sign-in", request.url);
        return NextResponse.redirect(signInUrl);
      }
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
