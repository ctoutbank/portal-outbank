"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { SidebarInset } from "@/components/ui/sidebar";

interface ConditionalLayoutProps {
  children: ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  const isAuthRoute = pathname?.startsWith("/auth");
  
  if (isAuthRoute) {
    return <>{children}</>;
  }
  
  return (
    <SidebarInset className="bg-card rounded-lg shadow flex flex-col min-h-screen">
      <div className="flex-1">
        {children}
      </div>
      <footer className="py-4 px-6 text-center text-xs text-muted-foreground border-t border-border">
        Copyright 2026 - Consolle
      </footer>
    </SidebarInset>
  );
}
