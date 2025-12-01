"use client";

import { useSignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Step = "email" | "code" | "password" | "success";

export default function TenantForgotPasswordPage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { signIn, isLoaded, setActive } = useSignIn();
  const router = useRouter();
  
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || !signIn) return;

    setIsSubmitting(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      
      setStep("code");
      toast.success("Código enviado! Verifique sua caixa de entrada.");
    } catch (error: any) {
      console.error("Error sending reset code:", error);
      toast.error(error?.errors?.[0]?.message || "Erro ao enviar código de recuperação");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || !signIn) return;

    setIsSubmitting(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
      });

      if (result.status === "complete") {
        setStep("password");
      } else {
        toast.error("Código inválido. Tente novamente.");
      }
    } catch (error: any) {
      console.error("Error verifying code:", error);
      toast.error(error?.errors?.[0]?.message || "Código inválido");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    if (!isLoaded || !signIn) return;

    setIsSubmitting(true);
    try {
      const result = await signIn.resetPassword({
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setStep("success");
        toast.success("Senha redefinida com sucesso!");
        
        // Redirecionar para dashboard após 2 segundos
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error?.errors?.[0]?.message || "Erro ao redefinir senha");
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
              {step === "email" && "Digite seu e-mail e enviaremos um código para redefinir sua senha"}
              {step === "code" && "Digite o código enviado para seu e-mail"}
              {step === "password" && "Digite sua nova senha"}
              {step === "success" && "Senha redefinida com sucesso!"}
            </p>
          </div>

          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  disabled={isSubmitting || !isLoaded}
                  className="mt-1"
                />
              </div>
              
              <Button
                type="submit"
                disabled={isSubmitting || !isLoaded}
                className="w-full"
                style={{ 
                  backgroundColor: 'var(--tenant-primary)', 
                  color: lightColor ? '#000' : '#fff' 
                }}
              >
                {isSubmitting ? "Enviando..." : "Enviar código"}
              </Button>
            </form>
          )}

          {/* Step 2: Code */}
          {step === "code" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <Label htmlFor="code">Código de verificação</Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  disabled={isSubmitting || !isLoaded}
                  className="mt-1 text-center text-2xl tracking-widest"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Digite o código de 6 dígitos enviado para {email}</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                  }}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !isLoaded || code.length !== 6}
                  className="flex-1"
                  style={{ 
                    backgroundColor: 'var(--tenant-primary)', 
                    color: lightColor ? '#000' : '#fff' 
                  }}
                >
                  {isSubmitting ? "Verificando..." : "Verificar código"}
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  disabled={isSubmitting || !isLoaded}
                  className="mt-1"
                  minLength={8}
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  required
                  disabled={isSubmitting || !isLoaded}
                  className="mt-1"
                  minLength={8}
                />
              </div>
              
              <Button
                type="submit"
                disabled={isSubmitting || !isLoaded || password !== confirmPassword || password.length < 8}
                className="w-full"
                style={{ 
                  backgroundColor: 'var(--tenant-primary)', 
                  color: lightColor ? '#000' : '#fff' 
                }}
              >
                {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
              </Button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <div className="text-center py-8">
              <div className="mb-4">
                <CheckCircle className="h-16 w-16 mx-auto" style={{ color: 'var(--tenant-primary)' }} />
              </div>
              <h2 className="text-xl font-bold mb-2">Senha redefinida!</h2>
              <p className="text-gray-600 mb-6">
                Redirecionando para o dashboard...
              </p>
              <Link href="/auth/sign-in">
                <Button
                  variant="outline"
                  className="w-full"
                >
                  Ir para login
                </Button>
              </Link>
            </div>
          )}

          {/* Link voltar para login (apenas nos primeiros steps) */}
          {step !== "success" && (
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
