"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        body: JSON.stringify({ email, password }),
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
    <div className="w-full max-w-md">
      <div className="bg-[#0f0f0f] rounded-2xl shadow-2xl border border-[#2a2a2a] overflow-hidden">
        <div className="px-8 pt-10 pb-6 text-center">
          <h1 className="text-2xl font-semibold text-white mb-2">Consolle</h1>
          <p className="text-[#808080] text-sm">Área Administrativa</p>
        </div>

        <div className="px-8 pb-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="email" className="block text-sm font-medium text-[#a0a0a0] mb-2">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#3a3a3a] focus:border-[#3a3a3a] transition-all placeholder:text-[#555]"
              />
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="text-sm font-medium text-[#a0a0a0]">
                  Senha
                </label>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-[#808080] hover:text-white transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-[#3a3a3a] focus:border-[#3a3a3a] transition-all placeholder:text-[#555]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#a0a0a0] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black hover:bg-[#1a1a1a] text-white border border-[#2a2a2a] rounded-lg py-3 px-4 font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isLoading ? "Entrando..." : "Entrar"}</span>
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </div>

        <div className="bg-[#0a0a0a] border-t border-[#2a2a2a] px-8 py-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[#555] text-xs">Desenvolvido por</span>
            <span className="text-white text-xs font-semibold">Consolle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
