"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = "email" | "success";

export default function TenantForgotPasswordPage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const router = useRouter();
  
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
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

  // Obter cor primária do CSS variable
  const getPrimaryColor = () => {
    if (typeof window === 'undefined') return '#000000';
    return getComputedStyle(document.documentElement).getPropertyValue('--tenant-primary').trim() || '#000000';
  };

  const isLightColor = (color: string) => {
    try {
      let hex = color;
      if (color.startsWith('var(')) {
        hex = getPrimaryColor();
      }
      
      if (!hex.startsWith('#')) {
        const match = hex.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
        if (match) {
          const h = parseInt(match[1]) / 360;
          const s = parseInt(match[2]) / 100;
          const l = parseInt(match[3]) / 100;
          const c = (1 - Math.abs(2 * l - 1)) * s;
          const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
          const m = l - c / 2;
          let r = 0, g = 0, b = 0;
          if (h < 1/6) { r = c; g = x; b = 0; }
          else if (h < 2/6) { r = x; g = c; b = 0; }
          else if (h < 3/6) { r = 0; g = c; b = x; }
          else if (h < 4/6) { r = 0; g = x; b = c; }
          else if (h < 5/6) { r = x; g = 0; b = c; }
          else { r = c; g = 0; b = x; }
          r = Math.round((r + m) * 255);
          g = Math.round((g + m) * 255);
          b = Math.round((b + m) * 255);
          hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        } else {
          return false;
        }
      }
      
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128;
    } catch {
      return false;
    }
  };

  const primaryColor = getPrimaryColor();
  const lightColor = isLightColor(primaryColor);

  const handleSendResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep("success");
        toast.success("Se o email estiver cadastrado, você receberá as instruções de recuperação.");
      } else {
        toast.error(data.error || "Erro ao solicitar recuperação de senha");
      }
    } catch (error: any) {
      console.error("Error sending reset request:", error);
      toast.error("Erro ao solicitar recuperação de senha");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
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
        
        <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-lg p-8 w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Esqueceu sua senha?</h1>
            <p className="text-gray-600 text-sm">
              {step === "email" && "Digite seu e-mail e enviaremos instruções para redefinir sua senha"}
              {step === "success" && "Verifique seu e-mail!"}
            </p>
          </div>

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleSendResetRequest} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  disabled={isSubmitting}
                  className="mt-1"
                />
              </div>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                style={{ 
                  backgroundColor: 'var(--tenant-primary)', 
                  color: lightColor ? '#000' : '#fff' 
                }}
              >
                {isSubmitting ? "Enviando..." : "Enviar instruções"}
              </Button>
            </form>
          )}

          {/* Step 2: Success */}
          {step === "success" && (
            <div className="text-center py-8">
              <div className="mb-4">
                <CheckCircle className="h-16 w-16 mx-auto" style={{ color: 'var(--tenant-primary)' }} />
              </div>
              <h2 className="text-xl font-bold mb-2">Email enviado!</h2>
              <p className="text-gray-600 mb-6">
                Se o email estiver cadastrado em nosso sistema, você receberá as instruções para redefinir sua senha.
              </p>
              <Link href="/auth/sign-in">
                <Button
                  variant="outline"
                  className="w-full"
                >
                  Voltar para login
                </Button>
              </Link>
            </div>
          )}

          {/* Link voltar para login (apenas no primeiro step) */}
          {step === "email" && (
            <div className="mt-6 text-center">
              <Link 
                href="/auth/sign-in" 
                className="text-sm inline-flex items-center gap-2"
                style={{ color: 'var(--tenant-primary)' }}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
