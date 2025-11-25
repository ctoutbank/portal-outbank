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
import { isAdminOrSuperAdmin } from "@/lib/permissions/check-permissions";
import { validateAndLogClerkEnv } from "@/lib/clerk/env-validation";

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
  // Validar variáveis de ambiente do Clerk (apenas em desenvolvimento)
  validateAndLogClerkEnv();

  const tenantCustomization = await getCurrentTenantCustomization();
  let isAdmin = false;
  try {
    isAdmin = await isAdminOrSuperAdmin();
  } catch (error) {
    console.error("Error checking admin permissions in layout:", error);
    // Em caso de erro, assumir que não é admin (comportamento seguro)
  }
  
  const loginBackgroundImage = tenantCustomization?.loginImageUrl || tenantCustomization?.imageUrl || '/bg_login.jpg';
  
  /**
   * Configuração do ClerkProvider
   * 
   * Variáveis de ambiente utilizadas:
   * - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: Obrigatória (chave pública do Clerk)
   * - CLERK_SECRET_KEY: Obrigatória (chave secreta do Clerk)
   * - NEXT_PUBLIC_CLERK_SIGN_IN_URL: Opcional (fallback: /auth/sign-in)
   * - NEXT_PUBLIC_CLERK_SIGN_UP_URL: Opcional (fallback: /auth/sign-up)
   * 
   * Para Satellite Domains (subdomínios), também configure:
   * - CLERK_DOMAIN: Domínio principal do Clerk (ex: clerk.consolle.one)
   * - CLERK_IS_SATELLITE: true (se estiver usando Satellite Domains)
   * 
   * Veja .env.example para mais detalhes
   */
  const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/auth/sign-in";
  const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/auth/sign-up";

  return (
    <ClerkProvider
      localization={ptBR}
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      appearance={{
        signIn: {
          elements: {
            rootBox: {
              backgroundImage: `url('${loginBackgroundImage}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            },
            card: "bg-white/95 backdrop-blur-sm",
            formButtonPrimary: "bg-black hover:bg-gray-800",
            footerActionLink: "text-black hover:text-gray-700"
          }
        }
      }}
    >
      <html lang="pt-BR" suppressHydrationWarning>
        <head>
          {tenantCustomization?.faviconUrl && (
            <link rel="icon" href={tenantCustomization.faviconUrl} />
          )}
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
                  <AppSidebar variant="inset" tenantCustomization={tenantCustomization} isAdmin={isAdmin} />
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
