"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState, useRef } from "react";
import { getUserDetail, UserDetailForm, unlinkUserFromIso, resetUserPassword } from "../_actions/user-actions";
import UserCustomerForm from "./user-form";
import { toast } from "sonner";
import { Building2, Users, KeyRound, Pencil, Trash2, Plus, AlertTriangle, ChevronDown, ChevronUp, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserTableProps {
  users: UserWithDetails[];
  customerId: number;
  customerName?: string;
  onRefresh?: () => void;
}
export type UserWithDetails = {
  id: number;
  slug: string | null;
  dtinsert: string | null;
  dtupdate: string | null;
  active: boolean | null;
  idClerk: string | null;
  idCustomer: number | null;
  idProfile: number | null;
  fullAccess: boolean | null;
  idAddress: number | null;
  hashedPassword: string | null;
  email: string | null;
  initialPassword: string | null;
  userType?: string | null;
  canViewSensitiveData?: boolean | null;

  firstName?: string | null;
  lastName?: string | null;

  password?: string;
  selectedMerchants?: string[];
};

export default function UserTable({
  users,
  customerId,
  customerName,
  onRefresh,
}: UserTableProps) {
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [expandedUserData, setExpandedUserData] = useState<UserDetailForm | null>(null);
  const [loadingUserId, setLoadingUserId] = useState<number | null>(null);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newPasswordData, setNewPasswordData] = useState<{password: string; email: string} | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{id: number; name: string} | null>(null);
  const [userToReset, setUserToReset] = useState<{id: number; name: string; email: string} | null>(null);
  
  const requestIdRef = useRef(0);

  function handleNewUser() {
    setExpandedUserId(null);
    setExpandedUserData(null);
    setShowNewUserForm(true);
  }

  function closeNewUserForm() {
    setShowNewUserForm(false);
    if (onRefresh) {
      onRefresh();
    }
  }

  async function toggleUserExpansion(userId: number) {
    setShowNewUserForm(false);
    
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      setExpandedUserData(null);
      return;
    }

    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    setExpandedUserId(userId);
    setLoadingUserId(userId);
    setExpandedUserData(null);

    try {
      const userDetail = await getUserDetail(userId);
      
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      
      if (userDetail) {
        setExpandedUserData(userDetail);
      } else {
        toast.error("Não foi possível carregar os dados do usuário");
        setExpandedUserId(null);
      }
    } catch (error) {
      if (currentRequestId !== requestIdRef.current) {
        return;
      }
      console.error("Erro ao carregar dados do usuário:", error);
      toast.error("Erro ao carregar dados do usuário");
      setExpandedUserId(null);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoadingUserId(null);
      }
    }
  }

  function closeEditForm() {
    setExpandedUserId(null);
    setExpandedUserData(null);
    if (onRefresh) {
      onRefresh();
    }
  }

  function getUserName(user: UserWithDetails): string {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || "Sem nome";
  }

  function openDeleteConfirm(user: UserWithDetails) {
    setUserToDelete({ id: user.id, name: getUserName(user) });
    setShowDeleteConfirm(true);
  }

  async function confirmDeleteUser() {
    if (!userToDelete) return;
    
    try {
      setIsLoading(true);
      // Usa unlinkUserFromIso para desvincular o usuário apenas deste ISO
      // Se o usuário só está vinculado a este ISO, ele será deletado completamente
      const success = await unlinkUserFromIso(userToDelete.id, customerId);
      if (success) {
        toast.success("Usuário removido com sucesso!");
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast.error("Erro ao remover usuário. Tente novamente.");
      }
    } catch (error: any) {
      console.error("Erro ao remover usuário:", error);
      const errorMessage = error?.message || "Erro ao remover usuário. Tente novamente.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  }

  function openResetConfirm(user: UserWithDetails) {
    setUserToReset({ id: user.id, name: getUserName(user), email: user.email || "" });
    setShowResetConfirm(true);
  }

  async function confirmResetPassword() {
    if (!userToReset) return;
    
    try {
      setIsLoading(true);
      const result = await resetUserPassword(userToReset.id);
      
      if (result.success && result.password && result.email) {
        setNewPasswordData({
          password: result.password,
          email: result.email,
        });
        setShowResetConfirm(false);
        setUserToReset(null);
        setShowPasswordDialog(true);
        toast.success("Nova senha gerada com sucesso!");
      } else {
        toast.error(result.error || "Erro ao gerar nova senha");
      }
    } catch (error) {
      console.error("Erro ao resetar senha:", error);
      toast.error("Erro ao gerar nova senha");
    } finally {
      setIsLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  return (
    <div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-[#E0E0E0]">Usuários Cadastrados</h3>
          <Button 
            onClick={handleNewUser} 
            variant="outline" 
            className="cursor-pointer border-[#2E2E2E] hover:bg-[#2E2E2E] text-[#E0E0E0]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {showNewUserForm && (
          <div className="border border-[#2E2E2E] rounded-lg bg-[#1A1A1A] p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[#E0E0E0] font-medium">Novo Usuário</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewUserForm(false)}
                className="h-8 w-8 p-0 text-[#A0A0A0] hover:text-[#E0E0E0] hover:bg-[#2E2E2E]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <UserCustomerForm
              customerId={customerId}
              onSuccess={closeNewUserForm}
              hideWrapper={true}
            />
          </div>
        )}
        
        {users.length === 0 && !showNewUserForm ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-[#2E2E2E] rounded-lg">
            <div className="p-3 bg-[#2E2E2E] rounded-full mb-4">
              <Users className="h-8 w-8 text-[#E0E0E0]" />
            </div>
            <h3 className="text-lg font-medium text-[#E0E0E0] mb-1">Nenhum usuário cadastrado</h3>
            <p className="text-sm text-[#A0A0A0]">
              Clique em "Novo Usuário" acima para adicionar o primeiro administrador deste ISO.
            </p>
          </div>
        ) : users.length > 0 && (
          <div className="border border-[#2E2E2E] rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2E2E2E] hover:bg-transparent">
                  <TableHead className="text-[#E0E0E0] font-medium w-8"></TableHead>
                  <TableHead className="text-[#E0E0E0] font-medium">Nome</TableHead>
                  <TableHead className="text-[#E0E0E0] font-medium">Email</TableHead>
                  <TableHead className="text-[#E0E0E0] font-medium">Categoria</TableHead>
                  <TableHead className="text-[#E0E0E0] font-medium">Criado em</TableHead>
                  <TableHead className="text-[#E0E0E0] font-medium">Status</TableHead>
                  <TableHead className="text-[#E0E0E0] font-medium text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <React.Fragment key={user.id}>
                    <TableRow 
                      className={`border-[#2E2E2E] hover:bg-[#212121] cursor-pointer ${expandedUserId === user.id ? 'bg-[#1A1A1A]' : ''}`}
                      onClick={() => toggleUserExpansion(user.id)}
                    >
                      <TableCell className="w-8 text-[#A0A0A0]">
                        {loadingUserId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : expandedUserId === user.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="text-[#E0E0E0] font-medium">
                        {getUserName(user)}
                      </TableCell>
                      <TableCell className="text-[#E0E0E0]">
                        {user.email || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-[#2E2E2E] text-[#E0E0E0] bg-[#2E2E2E]">
                          <Building2 className="h-3 w-3 mr-1" />
                          ISO Admin
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#E0E0E0]">
                        {formatDate(user.dtinsert)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={user.active 
                            ? "border-[#2E2E2E] text-[#E0E0E0] bg-[#2E2E2E]" 
                            : "border-[#2E2E2E] text-[#707070] bg-[#1A1A1A]"
                          }
                        >
                          {user.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openResetConfirm(user)}
                            disabled={isLoading}
                            className="cursor-pointer h-8 w-8 p-0 text-[#A0A0A0] hover:text-[#E0E0E0] hover:bg-[#2E2E2E]"
                            title="Gerar nova senha"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => toggleUserExpansion(user.id)} 
                            disabled={loadingUserId !== null} 
                            className="cursor-pointer h-8 w-8 p-0 text-[#A0A0A0] hover:text-[#E0E0E0] hover:bg-[#2E2E2E]"
                            title="Editar usuário"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openDeleteConfirm(user)}
                            disabled={isLoading}
                            className="cursor-pointer h-8 w-8 p-0 text-[#707070] hover:text-[#E0E0E0] hover:bg-[#2E2E2E]"
                            title="Excluir usuário"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedUserId === user.id && (
                      <TableRow key={`${user.id}-edit`} className="border-[#2E2E2E] bg-[#1A1A1A] hover:bg-[#1A1A1A]">
                        <TableCell colSpan={7} className="p-0">
                          <div className="p-4 border-t border-[#2E2E2E]">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-[#E0E0E0] font-medium">
                                Editar Usuário: {getUserName(user)}
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setExpandedUserId(null);
                                  setExpandedUserData(null);
                                }}
                                className="h-8 w-8 p-0 text-[#A0A0A0] hover:text-[#E0E0E0] hover:bg-[#2E2E2E]"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            {loadingUserId === user.id ? (
                              <div className="flex items-center justify-center py-8 text-[#A0A0A0]">
                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                Carregando dados...
                              </div>
                            ) : expandedUserData ? (
                              <UserCustomerForm
                                user={expandedUserData}
                                customerId={customerId}
                                onSuccess={closeEditForm}
                                hideWrapper={true}
                              />
                            ) : (
                              <div className="flex items-center justify-center py-8 text-[#707070]">
                                Erro ao carregar dados do usuário
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-[#1D1D1D] border-[#2E2E2E]">
          <DialogHeader>
            <DialogTitle className="text-[#E0E0E0]">Nova Senha Gerada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-black border border-[#2E2E2E] rounded-md">
              <p className="text-sm text-[#E0E0E0]">
                A senha foi enviada por email para o usuário.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#E0E0E0]">Email:</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-2 bg-black border border-[#2E2E2E] rounded text-sm text-[#E0E0E0]">
                  {newPasswordData?.email}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(newPasswordData?.email || "")}
                  className="border-[#2E2E2E] hover:bg-[#2E2E2E] text-[#E0E0E0]"
                >
                  Copiar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#E0E0E0]">Nova Senha:</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-2 bg-black border border-[#2E2E2E] rounded text-sm font-bold text-[#E0E0E0]">
                  {newPasswordData?.password}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(newPasswordData?.password || "")}
                  className="border-[#2E2E2E] hover:bg-[#2E2E2E] text-[#E0E0E0]"
                >
                  Copiar
                </Button>
              </div>
            </div>

            <p className="text-xs text-[#A0A0A0]">
              Guarde esta senha se necessário. Ela não será exibida novamente.
            </p>

            <Button
              variant="outline"
              className="w-full border-[#2E2E2E] hover:bg-[#2E2E2E] text-[#E0E0E0]"
              onClick={() => {
                setShowPasswordDialog(false);
                setNewPasswordData(null);
                if (onRefresh) {
                  onRefresh();
                }
              }}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-[#1D1D1D] border-[#2E2E2E] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#E0E0E0] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Excluir Usuário
            </DialogTitle>
            <DialogDescription className="text-[#A0A0A0]">
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-black rounded-lg border border-[#2E2E2E]">
              <p className="text-[#E0E0E0] text-sm">
                Tem certeza que deseja excluir o usuário <span className="font-semibold text-white">{userToDelete?.name}</span>?
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setUserToDelete(null);
              }}
              className="border-[#2E2E2E] text-[#E0E0E0] hover:bg-[#2E2E2E]"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDeleteUser}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              {isLoading ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="bg-[#1D1D1D] border-[#2E2E2E] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#E0E0E0] flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-[#A0A0A0]" />
              Gerar Nova Senha
            </DialogTitle>
            <DialogDescription className="text-[#A0A0A0]">
              A senha atual será substituída.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-black rounded-lg border border-[#2E2E2E] space-y-2">
              <p className="text-[#E0E0E0] text-sm">
                Gerar nova senha para <span className="font-semibold text-white">{userToReset?.name}</span>?
              </p>
              <p className="text-[#707070] text-xs">
                A nova senha será enviada para: {userToReset?.email}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowResetConfirm(false);
                setUserToReset(null);
              }}
              className="border-[#2E2E2E] text-[#E0E0E0] hover:bg-[#2E2E2E]"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmResetPassword}
              disabled={isLoading}
              className="bg-[#2E2E2E] hover:bg-[#404040] text-[#E0E0E0] border-0"
            >
              {isLoading ? "Gerando..." : "Gerar Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
