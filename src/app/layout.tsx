import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeInitializer from "@/components/themeInitializer";
import { getCurrentTenantCustomization } from "@/lib/tenant-detection";
import SessionTimeout from "@/components/session-timeout";
import { getClerkConfig } from "@/lib/clerk-config";

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
  let tenantCustomization = null;
  let clerkConfig = null;
  
  try {
    tenantCustomization = await getCurrentTenantCustomization();
    clerkConfig = getClerkConfig();
  } catch (error) {
    console.warn('Error loading tenant customization or Clerk config:', error);
  }
  
  const loginBackgroundImage = tenantCustomization?.loginImageUrl || '/bg_login.jpg';
  
  // If Clerk is not configured (development mode), render without ClerkProvider
  if (!clerkConfig) {
    return (
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
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="min-h-screen bg-background p-8">
              <div className="max-w-4xl mx-auto">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                    Development Mode
                  </h2>
                  <p className="text-yellow-700">
                    Clerk authentication is not configured. Running in development mode without authentication.
                  </p>
                </div>
                <SessionTimeout>
                  <SidebarProvider>
                    <AppSidebar variant="inset" />
                    <SidebarInset className="bg-card rounded-lg shadow">
                      {children}
                      <Toaster richColors position="top-right" />
                    </SidebarInset>
                  </SidebarProvider>
                </SessionTimeout>
              </div>
            </div>
          </ThemeProvider>
        </body>
      </html>
    );
  }
  
  return (
    <ClerkProvider
      publishableKey={clerkConfig.publishableKey}
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
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SessionTimeout>
              <SidebarProvider>
                <AppSidebar variant="inset" />
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
