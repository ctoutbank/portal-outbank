import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/create-password", "/api/create-password"]);

export default clerkMiddleware(async (auth, request) => {
  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token, Cache-Control, Pragma, Expires, Last-Modified, If-Modified-Since, If-Unmodified-Since, If-None-Match, If-Match, X-Clerk-Auth-Reason, X-Clerk-Auth-Status, X-Clerk-Debug, X-Clerk-SDK-Version",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Expose-Headers": "X-Clerk-Auth-Reason, X-Clerk-Auth-Status, X-Clerk-Debug",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
