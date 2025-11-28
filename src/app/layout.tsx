import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeInitializer from "@/components/themeInitializer";
import { getCurrentTenantCustomization } from "@/lib/tenant-detection";
import SessionTimeout from "@/components/session-timeout";
import { ConditionalSidebar } from "@/components/conditional-sidebar";
import { isAdminOrSuperAdmin, hasMerchantsAccess } from "@/lib/permissions/check-permissions";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Portal OutBank",
  description: "OutBank - Plataforma de Gestão de Clientes",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenantCustomization = await getCurrentTenantCustomization();
  const isAdmin = await isAdminOrSuperAdmin();
  const hasMerchants = await hasMerchantsAccess();
  
  const loginBackgroundImage = tenantCustomization?.loginImageUrl || tenantCustomization?.imageUrl || '/bg_login.jpg';
  
  return (
    <ClerkProvider
      localization={ptBR}
      appearance={{
        signIn: {
          elements: {
            rootBox: {
              backgroundImage: `url('${loginBackgroundImage}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            },
            card: "bg-gray-900/95 backdrop-blur-sm",
            formButtonPrimary: "bg-white hover:bg-gray-200 text-gray-900",
            footerActionLink: "text-white hover:text-gray-300"
          },
          variables: {
            colorText: "#f9fafb",
            colorInputText: "#e5e7eb",
            colorPrimary: "#ffffff",
            colorBackground: "#111827",
            colorInputBackground: "#1f2937",
          }
        }
      }}
    >
      <html lang="pt-BR" suppressHydrationWarning>
        <head>
        </head>
        <body className={inter.className}>
          <ThemeInitializer />
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <SessionTimeout>
              <SidebarProvider>
                <ConditionalSidebar>
                  <AppSidebar variant="inset" tenantCustomization={tenantCustomization} isAdmin={isAdmin} hasMerchantsAccess={hasMerchants} />
                </ConditionalSidebar>
                <SidebarInset className="bg-card rounded-lg shadow">
                  {children}
                  <Toaster richColors position="top-right" />
                </SidebarInset>
              </SidebarProvider>
            </SessionTimeout>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
