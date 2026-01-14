import { SidebarWithViewMode } from "@/components/sidebar-with-view-mode";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ConditionalLayout } from "@/components/conditional-layout";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeInitializer from "@/components/themeInitializer";
import { getCurrentTenantCustomization } from "@/lib/tenant-detection";
import SessionTimeout from "@/components/session-timeout";
import { ConditionalSidebar } from "@/components/conditional-sidebar";
import { isAdminOrSuperAdmin, hasMerchantsAccess, isCoreProfile, getUserAuthorizedMenus, getUserCategoryLabel, isSuperAdmin } from "@/lib/permissions/check-permissions";
import { ViewModeProvider } from "@/contexts/ViewModeContext";

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Portal OutBank",
  description: "OutBank - Plataforma de Gestão de Clientes",
  icons: {
    icon: "/outbank-logo.png",
    apple: "/outbank-logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // OTIMIZAÇÃO: Executar todas as chamadas de permissão em paralelo
  const startTime = performance.now();
  
  const [
    tenantCustomization,
    isAdmin,
    hasMerchants,
    isCore,
    authorizedMenus,
    userCategoryLabel,
    superAdmin
  ] = await Promise.all([
    getCurrentTenantCustomization(),
    isAdminOrSuperAdmin(),
    hasMerchantsAccess(),
    isCoreProfile(),
    getUserAuthorizedMenus(),
    getUserCategoryLabel(),
    isSuperAdmin()
  ]);
  
  const endTime = performance.now();
  console.log(`[Layout] Permissões carregadas em paralelo: ${(endTime - startTime).toFixed(0)}ms`);

  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <head>
      </head>
      <body className={inter.className}>
        <ThemeInitializer />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SessionTimeout>
            <ViewModeProvider isSuperAdmin={superAdmin}>
              <SidebarProvider>
                <ConditionalSidebar>
                  <SidebarWithViewMode
                    tenantCustomization={tenantCustomization}
                    isAdmin={isAdmin}
                    hasMerchantsAccess={hasMerchants}
                    isCore={isCore}
                    authorizedMenus={authorizedMenus}
                    userCategoryLabel={userCategoryLabel}
                    isSuperAdmin={superAdmin}
                  />
                </ConditionalSidebar>
                <ConditionalLayout>
                  {children}
                  <Toaster richColors position="top-right" />
                </ConditionalLayout>
              </SidebarProvider>
            </ViewModeProvider>
          </SessionTimeout>
        </ThemeProvider>
      </body>
    </html>
  );
}
