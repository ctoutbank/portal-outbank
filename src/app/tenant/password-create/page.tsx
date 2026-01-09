"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserCache } from "@/lib/user-cache";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";
import { Lock } from "lucide-react";
import { updatePasswordAction } from "./actions";

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

// Função helper para determinar se a cor é clara ou escura
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

export default function PasswordCreatePage() {
  const { user, isLoading: userLoading } = useUserCache();
  const router = useRouter();
  const [customization, setCustomization] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const loadCustomization = async () => {
      try {
        const hostname = window.location.host;
        const subdomain = hostname.split('.')[0];
        
        const response = await fetch(`/api/public/customization/${subdomain}`);
        if (response.ok) {
          const data = await response.json();
          setCustomization(data.customization);
        }
      } catch (error) {
        console.error("Error loading customization:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!userLoading) {
      loadCustomization();
    }
  }, [userLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updatePasswordAction(password);
      if (result.success) {
        toast.success("Senha atualizada com sucesso!");
        // Aguardar um pouco para garantir que o metadata foi atualizado
        await new Promise(resolve => setTimeout(resolve, 500));
        router.push("/dashboard");
      } else {
        toast.error(result.error || "Erro ao atualizar senha");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Erro ao atualizar senha. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  const primaryColorHex = customization?.primaryColor 
    ? hslToHex(customization.primaryColor) 
    : "#000000";
  const logoUrl = customization?.imageUrl || customization?.loginImageUrl;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Dialog open={true}>
        <DialogContent 
          className="sm:max-w-md [&>button]:hidden" 
          style={{ borderTopColor: primaryColorHex, borderTopWidth: '4px' }}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            {logoUrl && (
              <div className="flex justify-center mb-4">
                <Image
                  src={logoUrl}
                  alt="Logo"
                  width={120}
                  height={120}
                  className="object-contain"
                />
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mb-2">
              <Lock className="h-5 w-5" style={{ color: primaryColorHex }} />
              <DialogTitle className="text-2xl">Definir Nova Senha</DialogTitle>
            </div>
            <DialogDescription>
              Informações de Segurança
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua nova senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme sua nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full"
              />
            </div>
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
              style={{ 
                backgroundColor: primaryColorHex, 
                color: isLightColor(primaryColorHex) ? '#000' : '#fff' 
              }}
            >
              {isSubmitting ? "Salvando..." : "Confirmar Nova Senha"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
