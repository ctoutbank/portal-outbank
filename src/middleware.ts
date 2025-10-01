import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

function isClerkConfigured() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  const isInvalidKey = !publishableKey || 
      publishableKey === 'pk_test_placeholder' ||
      publishableKey.includes('bGVhcm5pbmctZGVtby0xMjM0NTY3ODkw') ||
      publishableKey.includes('placeholder') ||
      publishableKey === 'pk_test_bGVhcm5pbmctZGVtby0xMjM0NTY3ODkwLmNsZXJrLmFjY291bnRzLmRldg';
  
  return !isInvalidKey;
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  try {
    if (process.env.NODE_ENV === 'development' && !isClerkConfigured()) {
      console.log('🔧 Development mode: Skipping Clerk authentication');
      return NextResponse.next();
    }
    
    if (process.env.NODE_ENV === 'production' && !isClerkConfigured()) {
      console.error('❌ Clerk not configured in production');
      return NextResponse.redirect(new URL('/error', request.url));
    }
    
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  } catch (error) {
    console.error('Middleware error:', error);
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/sign-in', request.url));
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
