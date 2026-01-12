"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { updateUserProfile, changePassword } from "@/features/users/server/profile";
import {
  User,
  Mail,
  Shield,
  Building2,
  Lock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface ProfilePageProps {
  profile: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    imageUrl?: string;
    idCustomer: number | null;
    idProfile: number | null;
    profileName: string | null;
    profileDescription: string | null;
    fullAccess: boolean | null;
    active: boolean | null;
    isSuperAdmin: boolean;
    isAdmin: boolean;
    isPortalUser: boolean;
  };
  permissionsSummary: {
    category: {
      id: number;
      name: string | null;
      description: string | null;
    } | null;
    permissions: {
      fromCategory: number;
      individual: number;
      total: number;
      byGroup: Record<string, Array<{ id: number; name: string | null; group: string | null }>>;
      isSuperAdmin: boolean;
    };
    isos: {
      fromCategory: number;
      individual: number;
      main: { id: number; name: string | null; slug: string | null } | null;
      total: number;
      all: Array<{ id: number; name: string | null; slug: string | null }>;
    };
  } | null;
}

export function ProfilePage({ profile, permissionsSummary }: ProfilePageProps) {
  const [isPending, startTransition] = useTransition();
  
  // Estado para edição de dados
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Estado para alteração de senha
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Estado das seções colapsáveis
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [isosOpen, setIsosOpen] = useState(false);

  const handleUpdateProfile = () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Nome e sobrenome são obrigatórios");
      return;
    }

    startTransition(async () => {
      const result = await updateUserProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      if (result.success) {
        toast.success("Perfil atualizado com sucesso");
        setIsEditingProfile(false);
      } else {
        toast.error(result.error || "Erro ao atualizar perfil");
      }
    });
  };

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
      {/* Card de Dados Pessoais */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Dados Pessoais</CardTitle>
                <CardDescription>Suas informações de identificação</CardDescription>
              </div>
            </div>
            {!isEditingProfile && (
              <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingProfile ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Primeiro Nome</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Último Nome</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFirstName(profile.firstName);
                    setLastName(profile.lastName);
                    setIsEditingProfile(false);
                  }}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleUpdateProfile} disabled={isPending}>
                  {isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome completo</p>
                <p className="font-medium">{profile.firstName} {profile.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </p>
                <p className="font-medium">{profile.email}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card de Alteração de Senha */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>Altere sua senha de acesso</CardDescription>
              </div>
            </div>
            {!isChangingPassword && (
              <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(true)}>
                Alterar Senha
              </Button>
            )}
          </div>
        </CardHeader>
        {isChangingPassword && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <PasswordInput
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                disabled={isPending}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  disabled={isPending}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
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
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleChangePassword} disabled={isPending}>
                {isPending ? "Alterando..." : "Alterar Senha"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Card de Categoria e Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <CardTitle>Categoria e Status</CardTitle>
              <CardDescription>Seu perfil de acesso no sistema</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Categoria</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={profile.isSuperAdmin ? "default" : "secondary"}>
                  {permissionsSummary?.category?.name || "Sem categoria"}
                </Badge>
                {profile.isSuperAdmin && (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                    Super Admin
                  </Badge>
                )}
                {profile.isAdmin && !profile.isSuperAdmin && (
                  <Badge variant="outline" className="border-blue-500 text-blue-500">
                    Admin
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Usuário</p>
              <p className="font-medium mt-1">
                {profile.isPortalUser ? "Portal-Outbank" : "ISO"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="flex items-center gap-2 mt-1">
                {profile.active ? (
                  <Badge variant="outline" className="border-green-500 text-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" /> Ativo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-red-500 text-red-500">
                    <XCircle className="h-3 w-3 mr-1" /> Inativo
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Permissões (Colapsável) */}
      {permissionsSummary && (
        <Card className={cn(permissionsOpen && "border-primary/30")}>
          <Collapsible open={permissionsOpen} onOpenChange={setPermissionsOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {permissionsOpen ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <CardTitle>Minhas Permissões</CardTitle>
                      <CardDescription>
                        {permissionsSummary.permissions.isSuperAdmin
                          ? "Acesso total ao sistema (Super Admin)"
                          : `${permissionsSummary.permissions.total} permissões atribuídas`}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {permissionsSummary.permissions.total} funções
                  </Badge>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <Separator className="mb-4" />
                {permissionsSummary.permissions.isSuperAdmin ? (
                  <p className="text-sm text-muted-foreground">
                    Como Super Admin, você tem acesso a todas as funções do sistema.
                  </p>
                ) : Object.keys(permissionsSummary.permissions.byGroup).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma permissão atribuída.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(permissionsSummary.permissions.byGroup).map(([group, perms]) => (
                      <div key={group}>
                        <p className="text-sm font-medium mb-2">{group}</p>
                        <div className="flex flex-wrap gap-2">
                          {perms.map((perm) => (
                            <Badge key={perm.id} variant="outline" className="text-xs">
                              {perm.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Card de ISOs (Colapsável) */}
      {permissionsSummary && (
        <Card className={cn(isosOpen && "border-primary/30")}>
          <Collapsible open={isosOpen} onOpenChange={setIsosOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isosOpen ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <CardTitle>Meus ISOs</CardTitle>
                      <CardDescription>
                        {permissionsSummary.isos.total > 0
                          ? `${permissionsSummary.isos.total} ISO(s) vinculados`
                          : "Nenhum ISO vinculado"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {permissionsSummary.isos.total} ISOs
                  </Badge>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <Separator className="mb-4" />
                {permissionsSummary.isos.total === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Você não possui ISOs vinculados.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {permissionsSummary.isos.all.map((iso) => (
                      <Badge key={iso.id} variant="outline" className="py-1.5">
                        <Building2 className="h-3 w-3 mr-1" />
                        {iso.name || iso.slug || `ISO #${iso.id}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  );
}

