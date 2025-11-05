'use client';

import { usePathname } from 'next/navigation';
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import SessionTimeout from "@/components/session-timeout";

// Rotas que não devem ter sidebar
const NO_SIDEBAR_ROUTES = ['/create-password', '/sign-in', '/sign-up'];

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldShowSidebar = !NO_SIDEBAR_ROUTES.includes(pathname);

  if (!shouldShowSidebar) {
    return (
      <SessionTimeout>
        {children}
      </SessionTimeout>
    );
  }

  return (
    <SessionTimeout>
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset className="bg-card rounded-lg shadow">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </SessionTimeout>
  );
}