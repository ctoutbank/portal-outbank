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
  const tenantCustomization = await getCurrentTenantCustomization();
  const isAdmin = await isAdminOrSuperAdmin();
  const hasMerchants = await hasMerchantsAccess();
  const isCore = await isCoreProfile();
  const authorizedMenus = await getUserAuthorizedMenus();
  const userCategoryLabel = await getUserCategoryLabel();
  const superAdmin = await isSuperAdmin();

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
