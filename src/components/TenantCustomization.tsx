"use client";

import { useEffect } from "react";
import { getCustomizationBySubdomain } from "@/utils/serverActions";

interface TenantCustomizationProps {
  subdomain?: string;
}

// ✅ Função helper para adicionar cache busting
function addCacheBustingToUrl(url: string | null | undefined): string {
  if (!url) return url || '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
}

// ✅ Função helper para converter HSL para HEX
function hslToHex(hsl: string | null | undefined): string {
  if (!hsl) return "#000000";
  if (hsl.startsWith('#')) return hsl;
  
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

export default function TenantCustomization({ subdomain }: TenantCustomizationProps) {
  useEffect(() => {
    const loadTenantCustomization = async () => {
      if (!subdomain) return;

      try {
        const customization = await getCustomizationBySubdomain(subdomain);
        
        if (customization) {
          // ✅ Atualizar favicon com cache busting
          if (customization.faviconUrl) {
            const faviconUrl = addCacheBustingToUrl(customization.faviconUrl);
            const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
            if (favicon) {
              favicon.href = faviconUrl;
            } else {
              const newFavicon = document.createElement('link');
              newFavicon.rel = 'icon';
              newFavicon.href = faviconUrl;
              document.head.appendChild(newFavicon);
            }
          }

          // ✅ Atualizar cores CSS variables
          if (customization.primaryColor || customization.secondaryColor) {
            const root = document.documentElement;
            if (customization.primaryColor) {
              root.style.setProperty('--tenant-primary', hslToHex(customization.primaryColor));
            }
            if (customization.secondaryColor) {
              root.style.setProperty('--tenant-secondary', hslToHex(customization.secondaryColor));
            }
          }

          // ✅ Atualizar background image com cache busting
          if (customization.loginImageUrl) {
            const loginImageUrl = addCacheBustingToUrl(customization.loginImageUrl);
            const style = document.createElement('style');
            style.id = 'tenant-login-background';
            style.textContent = `
              .clerk-rootBox {
                background-image: url('${loginImageUrl}') !important;
                background-size: cover !important;
                background-position: center !important;
                background-repeat: no-repeat !important;
              }
              body {
                background-image: url('${loginImageUrl}') !important;
                background-size: cover !important;
                background-position: center !important;
                background-repeat: no-repeat !important;
                background-attachment: fixed !important;
              }
            `;
            // Remover estilo anterior se existir
            const existingStyle = document.getElementById('tenant-login-background');
            if (existingStyle) {
              existingStyle.remove();
            }
            document.head.appendChild(style);
          }
        }
      } catch (error) {
        console.error("Error loading tenant customization:", error);
      }
    };

    loadTenantCustomization();
  }, [subdomain]);

  return null;
}
