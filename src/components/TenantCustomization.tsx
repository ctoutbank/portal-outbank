"use client";

import { useEffect } from "react";
import { getCustomizationBySubdomain } from "@/utils/serverActions";

interface TenantCustomizationProps {
  subdomain?: string;
}

export default function TenantCustomization({ subdomain }: TenantCustomizationProps) {
  useEffect(() => {
    const loadTenantCustomization = async () => {
      if (!subdomain) return;

      try {
        const customization = await getCustomizationBySubdomain(subdomain);
        
        if (customization) {
          if (customization.faviconUrl) {
            const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
            if (favicon) {
              favicon.href = customization.faviconUrl;
            } else {
              const newFavicon = document.createElement('link');
              newFavicon.rel = 'icon';
              newFavicon.href = customization.faviconUrl;
              document.head.appendChild(newFavicon);
            }
          }

          if (customization.loginImageUrl) {
            const style = document.createElement('style');
            style.textContent = `
              .clerk-rootBox {
                background-image: url('${customization.loginImageUrl}') !important;
                background-size: cover !important;
                background-position: center !important;
                background-repeat: no-repeat !important;
              }
            `;
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
