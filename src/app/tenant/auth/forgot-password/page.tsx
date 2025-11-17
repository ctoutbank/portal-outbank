import { ForgotPassword } from "@clerk/nextjs";
import { getCurrentTenantCustomization } from "@/lib/tenant-detection";
import Image from "next/image";

// Função helper para converter HSL para HEX
function hslToHex(hsl: string): string {
  try {
    const match = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
    if (!match) return "#000000";
    
    const h = parseInt(match[1]) / 360;
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (h < 1/6) {
      r = c; g = x; b = 0;
    } else if (h < 2/6) {
      r = x; g = c; b = 0;
    } else if (h < 3/6) {
      r = 0; g = c; b = x;
    } else if (h < 4/6) {
      r = 0; g = x; b = c;
    } else if (h < 5/6) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch {
    return "#000000";
  }
}

export default async function TenantForgotPasswordPage() {
  const customization = await getCurrentTenantCustomization();
  
  // Converter HSL para HEX se necessário
  let primaryColor = customization?.primaryColor || "#000000";
  if (primaryColor && !primaryColor.startsWith('#')) {
    primaryColor = hslToHex(primaryColor);
  }
  
  const loginImageUrl = customization?.loginImageUrl || null;
  // Buscar logoUrl da mesma forma que password-create faz
  const logoUrl = customization?.imageUrl || null;

  // Função para determinar se a cor é clara ou escura
  const isLightColor = (hex: string) => {
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128;
    } catch {
      return false;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center relative">
      {loginImageUrl && (
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url('${loginImageUrl}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
          }}
        />
      )}
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
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
        <ForgotPassword
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl bg-white/95 backdrop-blur-sm",
              formButtonPrimary: {
                backgroundColor: primaryColor,
                color: isLightColor(primaryColor) ? '#000' : '#fff',
                "&:hover": {
                  backgroundColor: primaryColor,
                  opacity: 0.9,
                },
              },
              headerTitle: "text-2xl font-bold",
              headerSubtitle: "text-gray-600",
              formFieldLabel: "text-gray-700",
              formFieldInput: "border-gray-300 focus:border-gray-500 focus:ring-gray-500",
              footerActionLink: {
                color: primaryColor,
                "&:hover": {
                  color: primaryColor,
                  opacity: 0.8,
                },
              },
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

