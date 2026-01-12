import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { extractSubdomain, isTenantHost } from "@/lib/subdomain-auth/host";

const DEV_BYPASS_ENABLED =
  process.env.NODE_ENV === "development" &&
  process.env.DEV_BYPASS_AUTH === "true" &&
  !process.env.VERCEL;

const DEV_FALLBACK_SECRET = 'dev-only-secret-do-not-use-in-production-32bytes';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (!secret) {
    if (DEV_BYPASS_ENABLED) {
      return new TextEncoder().encode(DEV_FALLBACK_SECRET);
    }
    throw new Error('JWT_SECRET (or AUTH_SECRET/NEXTAUTH_SECRET) environment variable is required');
  }
  return new TextEncoder().encode(secret);
}

const publicPaths = [
  "/sign-in",
  "/sign-up",
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/forgot-password",
  "/password-create",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/public",
  "/api/check-subdomain-auth",
  "/unauthorized",
  "/_next",
  "/favicon.ico",
];

function isPublicRoute(pathname: string): boolean {
  return publicPaths.some(path => pathname.startsWith(path));
}

async function verifyJwt(token: string): Promise<{ userId: number } | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return { userId: payload.userId as number };
  } catch (error) {
    const secretAvailable = !!process.env.JWT_SECRET;
    console.error('[middleware] JWT verification failed:', error instanceof Error ? error.message : 'Unknown error', '| JWT_SECRET available:', secretAvailable);
    return null;
  }
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (DEV_BYPASS_ENABLED) {
    return NextResponse.next();
  }

  const hostname = request.headers.get("host") || "";
  const subdomain = extractSubdomain(hostname);
  const isTenant = isTenantHost(hostname);
  const token = request.cookies.get('auth_token')?.value;
  const user = token ? await verifyJwt(token) : null;
  const userId = user?.userId || null;

  if (isTenant && subdomain) {
    if (!userId && pathname === "/") {
      const signInUrl = new URL("/auth/sign-in", request.url);
      return NextResponse.redirect(signInUrl);
    }

    if (userId && pathname === "/") {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    if (!isPublicRoute(pathname) && !userId) {
      const signInUrl = new URL("/auth/sign-in", request.url);
      return NextResponse.redirect(signInUrl);
    }

    const tenantRouteMap: Record<string, string> = {
      "/": "/tenant",
      "/sign-in": "/tenant/auth/sign-in",
      "/auth/sign-in": "/tenant/auth/sign-in",
      "/auth/sign-up": "/tenant/auth/sign-up",
      "/auth/forgot-password": "/tenant/auth/forgot-password",
      "/forgot-password": "/tenant/auth/forgot-password",
      "/password-create": "/tenant/password-create",
      "/dashboard": "/tenant/dashboard",
      "/unauthorized": "/tenant/unauthorized",
    };

    const targetPath = tenantRouteMap[pathname];

    if (targetPath) {
      const rewriteUrl = new URL(targetPath, request.url);
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

  if (!isPublicRoute(pathname) && !userId) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    const response = NextResponse.redirect(signInUrl);
    if (token) {
      response.cookies.delete('auth_token');
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
