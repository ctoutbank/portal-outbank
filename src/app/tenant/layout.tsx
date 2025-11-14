import { headers } from "next/headers";
import { extractSubdomain } from "@/lib/subdomain-auth";
import { getCurrentTenantCustomization } from "@/lib/tenant-detection";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const subdomain = extractSubdomain(hostname);

  if (!subdomain) {
    return {
      title: "Portal ISO",
      description: "Portal de acesso ao ISO",
    };
  }

  const customization = await getCurrentTenantCustomization();

  return {
    title: customization?.name || subdomain,
    description: `Portal de acesso ao ${customization?.name || subdomain}`,
    icons: {
      icon: customization?.faviconUrl || "/favicon.ico",
    },
  };
}

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const subdomain = extractSubdomain(hostname);

  const customization = subdomain
    ? await getCurrentTenantCustomization()
    : null;

  const primaryColor = customization?.primaryColor || "#000000";
  const secondaryColor = customization?.secondaryColor || "#666666";

  return (
    <html lang="pt-BR">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --tenant-primary: ${primaryColor};
                --tenant-secondary: ${secondaryColor};
              }
            `,
          }}
        />
      </head>
      <body>
        <div className="tenant-portal">
          {children}
        </div>
      </body>
    </html>
  );
}
