"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { changePassword, updateUserProfile } from "@/features/users/server/profile";
import {
  Shield,
  Building2,
  Lock,
  ChevronDown,
  ChevronRight,
  Users,
  Key,
  Pencil,
  Camera,
  X,
  Check,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ProfilePageProps {
  profile: {
    id: number;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
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
  portalLogoUrl?: string | null;
  totalIsosInSystem?: number;
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

export function ProfilePage({ profile, permissionsSummary, portalLogoUrl, totalIsosInSystem }: ProfilePageProps) {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(profile.firstName || "");
  const [lastName, setLastName] = useState(profile.lastName || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.imageUrl || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [securityOpen, setSecurityOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [isosOpen, setIsosOpen] = useState(false);

  const handleEditProfile = () => {
    setIsEditing(true);
    setSecurityOpen(true);
    setPermissionsOpen(true);
    setIsosOpen(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFirstName(profile.firstName || "");
    setLastName(profile.lastName || "");
    setAvatarUrl(profile.imageUrl || "");
  };

  const handleSaveProfile = () => {
    startTransition(async () => {
      const result = await updateUserProfile({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        imageUrl: avatarUrl || undefined,
      });

      if (result.success) {
        toast.success("Perfil atualizado com sucesso");
        setIsEditing(false);
      } else {
        toast.error(result.error || "Erro ao atualizar perfil");
      }
    });
  };

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 2MB");
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de imagem não permitido. Use: JPG, PNG, GIF ou WebP.");
      return;
    }

    setIsUploadingAvatar(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao fazer upload');
      }

      const { url } = await response.json();
      setAvatarUrl(url);
      toast.success("Foto atualizada com sucesso");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao fazer upload da foto");
    } finally {
      setIsUploadingAvatar(false);
    }
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
        setSecurityOpen(false);
      } else {
        toast.error(result.error || "Erro ao alterar senha");
      }
    });
  };

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0]?.toUpperCase() || "U";
    }
    const email = profile.email || "";
    return email[0]?.toUpperCase() || "U";
  };

  const getDisplayName = () => {
    if (firstName || lastName) {
      return `${firstName || ""} ${lastName || ""}`.trim();
    }
    return profile.email;
  };

  const getCategoryLabel = () => {
    if (profile.isSuperAdmin) return "Super Admin";
    return permissionsSummary?.category?.name || "Usuário";
  };

  const getIsoCount = () => {
    if (profile.isSuperAdmin && totalIsosInSystem) {
      return totalIsosInSystem;
    }
    return permissionsSummary?.isos.total || 0;
  };

  const getIsoLabel = () => {
    if (profile.isSuperAdmin) {
      return "Todos os ISOs";
    }
    return "ISOs Vinculados";
  };

  const getAvatarUrl = () => {
    if (avatarUrl) return avatarUrl;
    if (profile.imageUrl) return profile.imageUrl;
    if (portalLogoUrl) return portalLogoUrl;
    return null;
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      <Card className="bg-[#1f1f1f] border-[#2a2a2a]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div></div>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditProfile}
                className="border-[#2a2a2a] bg-transparent text-[#808080] hover:bg-[#2a2a2a] hover:text-white"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isPending}
                  className="border-[#2a2a2a] bg-transparent text-[#808080] hover:bg-[#2a2a2a] hover:text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={isPending}
                  className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#2a2a2a]"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0 relative">
              <div
                onClick={handleAvatarClick}
                className={`relative ${isEditing ? 'cursor-pointer group' : ''}`}
              >
                {getAvatarUrl() ? (
                  <img
                    src={getAvatarUrl()!}
                    alt="Avatar"
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover ring-4 ring-[#2a2a2a] bg-white"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#2a2a2a] flex items-center justify-center ring-4 ring-[#2a2a2a]">
                    <span className="text-2xl md:text-3xl font-semibold text-[#808080]">
                      {getInitials()}
                    </span>
                  </div>
                )}
                {isEditing && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUploadingAvatar ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-[#808080]">Primeiro Nome</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Seu primeiro nome"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-[#808080]">Sobrenome</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Seu sobrenome"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#808080]">Email</Label>
                    <p className="text-sm text-white">{profile.email}</p>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xl md:text-2xl font-bold text-white truncate mb-4">
                    {getDisplayName()}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                    <div className="min-w-0">
                      <p className="text-xs text-[#808080] mb-1">Categoria</p>
                      <p className="text-sm font-medium text-white truncate">{getCategoryLabel()}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-[#808080] mb-1">Tipo de Usuário</p>
                      <p className="text-sm font-medium text-white truncate">
                        {profile.isPortalUser ? "Portal-Outbank" : "ISO"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-[#808080] mb-1">Email</p>
                      <p className="text-sm font-medium text-white truncate">{profile.email}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator className="my-6 bg-[#2a2a2a]" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-[#808080]" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-white">{getIsoCount()}</p>
                <p className="text-xs text-[#808080] truncate">{getIsoLabel()}</p>
              </div>
            </div>
            
            <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                <Key className="w-5 h-5 text-[#808080]" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-white">{permissionsSummary?.permissions.total || 0}</p>
                <p className="text-xs text-[#808080] truncate">Permissões</p>
              </div>
            </div>
            
            <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-[#808080]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {profile.active ? (
                    <Badge variant="success" className="text-xs px-2 py-0.5">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs px-2 py-0.5">
                      Inativo
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-[#808080] truncate mt-1">Status</p>
              </div>
            </div>
            
            <div className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-[#808080]" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap gap-1">
                  {profile.isSuperAdmin && (
                    <Badge variant="draft" className="text-xs px-2 py-0.5">Super</Badge>
                  )}
                  {profile.isAdmin && !profile.isSuperAdmin && (
                    <Badge variant="info" className="text-xs px-2 py-0.5">Admin</Badge>
                  )}
                  {!profile.isSuperAdmin && !profile.isAdmin && (
                    <span className="text-sm font-medium text-white">Usuário</span>
                  )}
                </div>
                <p className="text-xs text-[#808080] truncate mt-1">Nível de Acesso</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1f1f1f] border-[#2a2a2a]">
        <Collapsible open={securityOpen} onOpenChange={setSecurityOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-[#2a2a2a]/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {securityOpen ? (
                    <ChevronDown className="h-5 w-5 text-[#808080]" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-[#808080]" />
                  )}
                  <div className="h-10 w-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                    <Lock className="h-5 w-5 text-[#808080]" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-base">Segurança</CardTitle>
                    <CardDescription className="text-[#808080]">
                      Altere sua senha de acesso
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-[#2a2a2a] text-[#808080] border-0">
                  Senha
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <Separator className="bg-[#2a2a2a]" />
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-[#808080]">Senha Atual</Label>
                <PasswordInput
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  disabled={isPending}
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-[#808080]">Nova Senha</Label>
                  <PasswordInput
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    disabled={isPending}
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[#808080]">Confirmar Nova Senha</Label>
                  <PasswordInput
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    disabled={isPending}
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
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
                    setSecurityOpen(false);
                  }}
                  disabled={isPending}
                  className="border-[#2a2a2a] bg-transparent text-[#808080] hover:bg-[#2a2a2a] hover:text-white"
                >
                  Cancelar
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={handleChangePassword} 
                  disabled={isPending}
                  className="border-[#2a2a2a] bg-transparent text-white hover:bg-[#2a2a2a]"
                >
                  {isPending ? "Alterando..." : "Salvar Senha"}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {permissionsSummary && (
        <Card className="bg-[#1f1f1f] border-[#2a2a2a]">
          <Collapsible open={permissionsOpen} onOpenChange={setPermissionsOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-[#2a2a2a]/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {permissionsOpen ? (
                      <ChevronDown className="h-5 w-5 text-[#808080]" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-[#808080]" />
                    )}
                    <div className="h-10 w-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                      <Shield className="h-5 w-5 text-[#808080]" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-base">Minhas Permissões</CardTitle>
                      <CardDescription className="text-[#808080]">
                        {permissionsSummary.permissions.isSuperAdmin
                          ? "Acesso total ao sistema (Super Admin)"
                          : `${permissionsSummary.permissions.total} permissões atribuídas`}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-[#2a2a2a] text-[#808080] border-0">
                    {permissionsSummary.permissions.total} funções
                  </Badge>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <Separator className="mb-4 bg-[#2a2a2a]" />
                {permissionsSummary.permissions.isSuperAdmin ? (
                  <p className="text-sm text-[#808080]">
                    Como Super Admin, você tem acesso a todas as funções do sistema.
                  </p>
                ) : Object.keys(permissionsSummary.permissions.byGroup).length === 0 ? (
                  <p className="text-sm text-[#808080]">
                    Nenhuma permissão atribuída.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(permissionsSummary.permissions.byGroup).map(([group, perms]) => (
                      <div key={group}>
                        <p className="text-sm font-medium mb-2 text-white">{group}</p>
                        <div className="flex flex-wrap gap-2">
                          {perms.map((perm) => (
                            <Badge key={perm.id} variant="outline" className="text-xs border-[#2a2a2a] text-[#808080]">
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

      {permissionsSummary && (
        <Card className="bg-[#1f1f1f] border-[#2a2a2a]">
          <Collapsible open={isosOpen} onOpenChange={setIsosOpen}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-[#2a2a2a]/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isosOpen ? (
                      <ChevronDown className="h-5 w-5 text-[#808080]" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-[#808080]" />
                    )}
                    <div className="h-10 w-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-[#808080]" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-base">Meus ISOs</CardTitle>
                      <CardDescription className="text-[#808080]">
                        {profile.isSuperAdmin
                          ? `Acesso a todos os ${totalIsosInSystem || 0} ISOs do sistema`
                          : permissionsSummary.isos.total > 0
                            ? `${permissionsSummary.isos.total} ISO(s) vinculados`
                            : "Nenhum ISO vinculado"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-[#2a2a2a] text-[#808080] border-0">
                    {profile.isSuperAdmin ? `${totalIsosInSystem || 0} ISOs` : `${permissionsSummary.isos.total} ISOs`}
                  </Badge>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <Separator className="mb-4 bg-[#2a2a2a]" />
                {profile.isSuperAdmin ? (
                  <p className="text-sm text-[#808080]">
                    Como Super Admin, você tem acesso a todos os {totalIsosInSystem || 0} ISOs do sistema.
                  </p>
                ) : permissionsSummary.isos.total === 0 ? (
                  <p className="text-sm text-[#808080]">
                    Você não possui ISOs vinculados.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {permissionsSummary.isos.all.map((iso) => (
                      <Badge key={iso.id} variant="outline" className="py-1.5 border-[#2a2a2a] text-[#808080]">
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
