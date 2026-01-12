"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import {getUserDetailWithClerk, UserDetailForm, deleteUser, resetUserPassword} from "../_actions/user-actions";
import UserCustomerForm from "./user-form";
import { toast } from "sonner";

interface UserTableProps {
  users: UserWithClerk[];
  customerId: number;
  onRefresh?: () => void;
}
export type UserWithClerk = {
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
  isInvisible: boolean | null;
  userType: string | null;
  canViewSensitiveData: boolean | null;
  imageUrl: string | null;

  // Campos derivados do nome
  firstName: string | null;
  lastName: string | null;

  // Campos exigidos pelo formulário
  password?: string;
  selectedMerchants?: string[];
};
export default function UserTable({
  users,
  customerId,
  onRefresh,
}: UserTableProps) {
  const [selectedUser, setSelectedUser] = useState<UserDetailForm| null>(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newPasswordData, setNewPasswordData] = useState<{password: string; email: string} | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const closeDialog = () => {
    setOpen(false);
    if (onRefresh) {
      onRefresh();
    }
  };

  function handleNewUser() {
    setSelectedUser(null);
    setOpen(true);
  }


  async function handleEditUser(userId: number) {
    try {
      setIsLoading(true);
      const userDetail = await getUserDetailWithClerk(userId);
      
      if (userDetail) {
        setSelectedUser(userDetail);
        setOpen(true);
      } else {
        console.error("Não foi possível carregar os detalhes do usuário");
      }
    } catch (error) {
      console.error("Erro ao buscar usuário para edição:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteUser(userId: number) {
    if (confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.")) {
      try {
        setIsLoading(true);
        const success = await deleteUser(userId);
        if (success) {
          toast.success("Usuário excluído com sucesso!");
          if (onRefresh) {
            onRefresh();
          }
        } else {
          toast.error("Erro ao excluir usuário. Tente novamente.");
        }
      } catch (error: any) {
        console.error("Erro ao excluir usuário:", error);
        const errorMessage = error?.message || "Erro ao excluir usuário. Tente novamente.";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  }

  async function handleResetPassword(userId: number) {
    if (!confirm("Tem certeza que deseja gerar uma nova senha? A senha atual será substituída e uma nova será enviada por email.")) {
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await resetUserPassword(userId);
      
      if (result.success && result.password && result.email) {
        setNewPasswordData({
          password: result.password,
          email: result.email,
        });
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger onClick={handleNewUser}>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedUser?.id ? "Editar Usuário" : "Novo Usuário"}
              </DialogTitle>
              <UserCustomerForm
                user={selectedUser || undefined}
                customerId={customerId}
                onSuccess={closeDialog}
              />
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div>
            <h2 className="text-2xl font-bold">Usuários</h2>
            <p className="text-sm text-muted-foreground">
              Gerencie os usuários do cliente
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-6">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Senha</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || "-"}</TableCell>
                    <TableCell className="text-sm">{user.email || "-"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.active ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResetPassword(user.id)}
                        disabled={isLoading}
                        className="cursor-pointer"
                      >
                        Gerar Nova Senha
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => handleEditUser(user.id)} disabled={isLoading} className="cursor-pointer">
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={isLoading}
                          className="cursor-pointer"
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Senha Gerada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                ✓ A senha foi enviada por email para o usuário.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email:</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm">
                  {newPasswordData?.email}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(newPasswordData?.email || "")}
                >
                  Copiar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nova Senha:</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm font-bold text-yellow-900">
                  {newPasswordData?.password}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(newPasswordData?.password || "")}
                >
                  Copiar
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Guarde esta senha se necessário. Ela não será exibida novamente.
            </p>

            <Button
              className="w-full"
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
    </div>
  );
}       