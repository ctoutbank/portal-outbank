"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export function TenantSignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Login realizado com sucesso!");
        window.location.href = "/tenant/dashboard";
      } else {
        toast.error(data.error || "Credenciais inválidas");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800/50 p-8 rounded-xl backdrop-blur-sm">
      <div className="space-y-1 relative">
        <Mail
          className="absolute left-3 top-11 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <label
          className="text-sm font-medium ml-2"
          htmlFor="email"
          style={{ color: 'var(--tenant-login-text, #d1d5db)' }}
        >
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          disabled={isLoading}
          autoComplete="email"
          className="bg-black/20 border-gray-600 text-white focus:ring-1 focus:ring-white/30 pl-10"
        />
      </div>

      <div className="space-y-1">
        <label
          className="text-sm font-medium ml-2"
          htmlFor="password"
          style={{ color: 'var(--tenant-login-text, #d1d5db)' }}
        >
          Senha
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading}
            autoComplete="current-password"
            className="bg-black/20 border-gray-600 text-white focus:ring-1 focus:ring-white/30 pl-10 pr-10"
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

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            className="border-gray-500 data-[state=checked]:bg-white data-[state=checked]:text-black"
          />
          <label
            htmlFor="rememberMe"
            className="text-sm cursor-pointer"
            style={{ color: 'var(--tenant-login-text, #d1d5db)' }}
          >
            Manter conectado
          </label>
        </div>
        <Link
          href="/tenant/auth/forgot-password"
          className="text-sm hover:underline"
          style={{ color: 'var(--tenant-login-text, #d1d5db)' }}
        >
          Esqueceu a senha?
        </Link>
      </div>

      <Button
        type="submit"
        className="w-full hover:opacity-90"
        style={{
          backgroundColor: 'var(--tenant-login-button, #ffffff)',
          color: 'var(--tenant-login-button-text, #000000)',
        }}
        disabled={isLoading}
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
