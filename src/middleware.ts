import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

function isClerkConfigured() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return publishableKey && 
         publishableKey !== 'pk_test_placeholder' &&
         !publishableKey.includes('bGVhcm5pbmctZGVtby0xMjM0NTY3ODkw') &&
         !publishableKey.includes('placeholder');
}

export default clerkMiddleware(async (auth, request) => {
  if (process.env.NODE_ENV === 'development' && !isClerkConfigured()) {
    return NextResponse.next();
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
