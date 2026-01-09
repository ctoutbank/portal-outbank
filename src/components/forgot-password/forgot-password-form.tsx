"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao enviar email de recuperação");
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
            Email enviado!
          </h2>
          <p className="text-gray-300/80 text-sm">
            Se existe uma conta associada a <strong className="text-white">{email}</strong>, 
            você receberá um email com instruções para redefinir sua senha.
          </p>
        </div>

        <div className="pt-2">
          <p className="text-xs text-gray-400 mb-4">
            Não recebeu o email? Verifique sua pasta de spam ou aguarde alguns minutos.
          </p>
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
          className="bg-black/20 border-0 text-white focus:ring-1 focus:ring-white/30 pl-10"
        />
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
        {isLoading ? "Enviando..." : "Enviar email de recuperação"}
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
