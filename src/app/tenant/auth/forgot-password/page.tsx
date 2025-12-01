"use client";

import { ResetPassword } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function TenantForgotPasswordPage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Buscar apenas a logo, o resto já está no layout
    const loadLogo = async () => {
      try {
        const hostname = window.location.host;
        const subdomain = hostname.split('.')[0];
        
        const response = await fetch(`/api/public/customization/${subdomain}`);
        if (response.ok) {
          const data = await response.json();
          setLogoUrl(data.customization?.imageUrl || null);
        }
      } catch (error) {
        console.error("Error loading logo:", error);
      }
    };

    loadLogo();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      {/* Background já está aplicado no layout do tenant */}
      <div className="w-full max-w-md mx-auto px-4">
        {logoUrl && (
          <div className="flex justify-center mb-6">
            <Image
              src={logoUrl}
              alt="Logo"
              width={120}
              height={120}
              className="object-contain"
            />
          </div>
        )}
        
        {/* Componente ResetPassword do Clerk com customização */}
        <ResetPassword
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white/95 backdrop-blur-sm shadow-xl rounded-lg",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
            },
            variables: {
              colorText: "#1f2937",
              colorInputText: "#374151",
              colorPrimary: "var(--tenant-primary)",
              colorBackground: "#ffffff",
              colorInputBackground: "#f9fafb",
            },
          }}
          routing="path"
          path="/auth/forgot-password"
          signInUrl="/auth/sign-in"
        />
      </div>
    </div>
  );
}
