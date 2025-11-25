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
  let isAdmin = false;
  try {
    isAdmin = await isAdminOrSuperAdmin();
  } catch (error) {
    console.error("Error checking admin permissions in layout:", error);
    // Em caso de erro, assumir que não é admin (comportamento seguro)
    isAdmin = false;
  }
  
  const loginBackgroundImage = tenantCustomization?.loginImageUrl || tenantCustomization?.imageUrl || '/bg_login.jpg';
  
  // Obter URLs de sign-in e sign-up das variáveis de ambiente ou usar valores padrão
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
