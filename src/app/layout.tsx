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
  
  const loginBackgroundImage = tenantCustomization?.loginImageUrl || '/bg_login.jpg';
  
  return (
    <ClerkProvider
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
