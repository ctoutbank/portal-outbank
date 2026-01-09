"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface SignInFormProps {
  customColors?: {
    buttonColor?: string;
    buttonTextColor?: string;
  };
}

export function SignInForm({ customColors }: SignInFormProps) {
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
        window.location.href = "/";
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1 relative">
        <Mail
          className="absolute left-3 top-11 -translate-y-1/2 text-white"
          size={18}
        />
        <label
          className="text-sm font-medium ml-2 text-gray-300"
          htmlFor="email"
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
          className="bg-black/20 border-0 text-white focus:ring-1 focus:ring-white/30 pl-10"
        />
      </div>

      <div className="space-y-1">
        <label
          className="text-sm font-medium ml-2 text-gray-300"
          htmlFor="password"
        >
          Senha
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
            placeholder="••••••••"
            required
            disabled={isLoading}
            autoComplete="current-password"
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
            className="text-sm text-gray-300/80 cursor-pointer"
          >
            Manter conectado
          </label>
        </div>
        <Link
          href="/auth/forgot-password"
          className="text-sm text-gray-300/80 hover:text-white"
        >
          Esqueceu a senha?
        </Link>
      </div>

      <Button
        type="submit"
        className="w-full hover:opacity-90"
        style={{
          backgroundColor: customColors?.buttonColor || "#ffffff",
          color: customColors?.buttonTextColor || "#000000",
        }}
        disabled={isLoading}
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
