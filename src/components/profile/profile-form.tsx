"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { changePassword } from "@/features/users/server/profile";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";

interface ProfileFormProps {
  email: string;
  profileName: string;
}

export function ProfileForm({ email, profileName }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos de senha");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("A nova senha e a confirmação não coincidem");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres");
      return;
    }

    startTransition(async () => {
      const result = await changePassword({
        currentPassword,
        newPassword,
      });

      if (result.success) {
        toast.success("Senha alterada com sucesso");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsChangingPassword(false);
      } else {
        toast.error(result.error || "Erro ao alterar senha");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-lg font-medium">
                {email?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <CardTitle className="text-white">Dados Pessoais</CardTitle>
              <CardDescription className="text-[#808080]">
                Suas informações de identificação
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[#808080] flex items-center gap-2">
              <Mail className="h-4 w-4" /> Email
            </Label>
            <Input
              value={email}
              disabled
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white disabled:opacity-70"
            />
            <p className="text-xs text-[#606060]">
              O email não pode ser alterado
            </p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-[#808080] flex items-center gap-2">
              <User className="h-4 w-4" /> Categoria
            </Label>
            <Input
              value={profileName}
              disabled
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white disabled:opacity-70"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Lock className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-white">Segurança</CardTitle>
                <CardDescription className="text-[#808080]">
                  Altere sua senha de acesso
                </CardDescription>
              </div>
            </div>
            {!isChangingPassword && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsChangingPassword(true)}
                className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
              >
                Alterar Senha
              </Button>
            )}
          </div>
        </CardHeader>
        {isChangingPassword && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-[#808080]">
                Senha Atual
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  disabled={isPending}
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606060] hover:text-white"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-[#808080]">
                  Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    disabled={isPending}
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606060] hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#808080]">
                  Confirmar Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    disabled={isPending}
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606060] hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setIsChangingPassword(false);
                }}
                disabled={isPending}
                className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
              >
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={handleChangePassword} 
                disabled={isPending}
                className="bg-white text-black hover:bg-white/90"
              >
                {isPending ? "Alterando..." : "Alterar Senha"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
