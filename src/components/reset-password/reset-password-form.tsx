"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  useEffect(() => {
    async function validateToken() {
      try {
        const response = await fetch(`/api/auth/validate-reset-token?token=${token}`);
        const data = await response.json();
        setIsValidToken(data.valid);
      } catch (err) {
        console.error("Erro ao validar token:", err);
        setIsValidToken(false);
      } finally {
        setIsValidating(false);
      }
    }
    validateToken();
  }, [token]);

  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      router.push("/auth/sign-in");
    }
  }, [success, countdown, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao redefinir senha");
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error("Erro:", err);
      setError("Ocorreu um erro. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-300/80">Validando link...</p>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-white mb-2">
            Link inválido ou expirado
          </h2>
          <p className="text-gray-300/80 text-sm">
            Este link de recuperação de senha não é mais válido. 
            Solicite um novo link de recuperação.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <Link href="/auth/forgot-password">
            <Button className="w-full bg-white text-black hover:bg-white/90">
              Solicitar novo link
            </Button>
          </Link>
          <Link href="/auth/sign-in">
            <Button variant="outline" className="w-full border-gray-500/50 text-gray-300 hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para o login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-white mb-2">
            Senha redefinida!
          </h2>
          <p className="text-gray-300/80 text-sm">
            Sua senha foi alterada com sucesso. 
            Você será redirecionado para o login em {countdown} segundos.
          </p>
        </div>

        <Link href="/auth/sign-in">
          <Button className="w-full bg-white text-black hover:bg-white/90">
            Ir para o login agora
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <label
          className="text-sm font-medium ml-2 text-gray-300"
          htmlFor="password"
        >
          Nova senha
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white"
            size={18}
          />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua nova senha"
            required
            minLength={6}
            className="bg-black/20 border-0 text-white focus:ring-1 focus:ring-white/30 pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <label
          className="text-sm font-medium ml-2 text-gray-300"
          htmlFor="confirmPassword"
        >
          Confirmar nova senha
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white"
            size={18}
          />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirme sua nova senha"
            required
            minLength={6}
            className="bg-black/20 border-0 text-white focus:ring-1 focus:ring-white/30 pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-white text-black hover:bg-white/90"
        disabled={isLoading}
      >
        {isLoading ? "Salvando..." : "Redefinir senha"}
      </Button>

      <div className="text-center">
        <Link
          href="/auth/sign-in"
          className="text-sm text-gray-300/80 hover:text-white flex items-center justify-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o login
        </Link>
      </div>
    </form>
  );
}
