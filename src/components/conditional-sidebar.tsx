"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

/**
 * Conditionally renders children based on the current pathname.
 * Hides children on authentication routes (/sign-in, /sign-up).
 */
export function ConditionalSidebar({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  const shouldHide = pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up") || pathname?.startsWith("/auth");
  
  if (shouldHide) {
    return null;
  }
  
  return <>{children}</>;
}
