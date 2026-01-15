import { headers } from "next/headers";
import { extractSubdomain } from "@/lib/subdomain-auth";
import { getCurrentTenantCustomization } from "@/lib/tenant-detection";
import TenantCustomization from "@/components/TenantCustomization";
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

  // ✅ Converter HSL para HEX se necessário (cores no banco estão em HSL: "360 100% 50%")
  function hslToHexForLayout(hsl: string | null | undefined): string {
    if (!hsl) return "#000000";
    // Se já é HEX, retornar como está
    if (hsl.startsWith('#')) return hsl;
    // Converter HSL para HEX
    try {
      const parts = hsl.trim().split(/\s+/);
      if (parts.length !== 3) return "#000000";
      const h = parseFloat(parts[0]) / 360;
      const s = parseFloat(parts[1]) / 100;
      const l = parseFloat(parts[2]) / 100;

      const a = s * Math.min(l, 1 - l);
      const f = (n: number) => {
        const k = (n + h * 12) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, "0");
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    } catch {
      return "#000000";
    }
  }

  const primaryColor = hslToHexForLayout(customization?.primaryColor) || "#000000";
  const secondaryColor = hslToHexForLayout(customization?.secondaryColor) || "#666666";
  const loginButtonColor = hslToHexForLayout(customization?.loginButtonColor) || "#3b82f6";
  const loginButtonTextColor = hslToHexForLayout(customization?.loginButtonTextColor) || "#ffffff";
  const loginTitleColor = hslToHexForLayout(customization?.loginTitleColor) || "#ffffff";
  const loginTextColor = hslToHexForLayout(customization?.loginTextColor) || "#d1d5db";
  const loginImageUrl = customization?.loginImageUrl || null;

  return (
    <html lang="pt-BR">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --tenant-primary: ${primaryColor};
                --tenant-secondary: ${secondaryColor};
                --tenant-login-button: ${loginButtonColor};
                --tenant-login-button-text: ${loginButtonTextColor};
                --tenant-login-title: ${loginTitleColor};
                --tenant-login-text: ${loginTextColor};
              }
              ${loginImageUrl ? `
              body {
                background-image: url('${loginImageUrl}');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                background-attachment: fixed;
              }
              ` : ''}
            `,
          }}
        />
      </head>
      <body>
        <TenantCustomization
          subdomain={subdomain || undefined}
          initialCustomization={customization}
        />
        <div className="tenant-portal">
          {children}
        </div>
      </body>
    </html>
  );
}
