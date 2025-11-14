import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractSubdomain, isTenantHost } from "@/lib/subdomain-auth/host";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/auth/sign-in(.*)",
  "/auth/sign-up(.*)",
  "/api/public(.*)",
  "/api/check-subdomain-auth(.*)",
  "/unauthorized(.*)",
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const hostname = request.headers.get("host") || "";
  const subdomain = extractSubdomain(hostname);
  const isTenant = isTenantHost(hostname);
  const { userId } = await auth();
  const pathname = request.nextUrl.pathname;
  
  if (isTenant && subdomain) {
    if (!userId && pathname === "/") {
      const signInUrl = new URL("/auth/sign-in", request.url);
      return NextResponse.redirect(signInUrl);
    }
    
    if (userId && pathname === "/") {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
    
    const tenantRouteMap: Record<string, string> = {
      "/": "/tenant",
      "/sign-in": "/tenant/auth/sign-in",
      "/auth/sign-in": "/tenant/auth/sign-in",
      "/auth/sign-up": "/tenant/auth/sign-up",
      "/dashboard": "/tenant/dashboard",
      "/unauthorized": "/tenant/unauthorized",
    };
    
    const targetPath = tenantRouteMap[pathname];
    
    if (targetPath) {
      const rewriteUrl = new URL(targetPath, request.url);
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
    await auth.protect();
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
