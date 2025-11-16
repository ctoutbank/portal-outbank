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
import { deleteUser } from "../_actions/use-Actions";
import {getUserDetailWithClerk, UserDetailForm, revealInitialPassword} from "../_actions/user-actions";
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
  active: boolean | null;         // alterado
  idClerk: string | null;
  idCustomer: number | null;
  idProfile: number | null;
  fullAccess: boolean | null;     // alterado
  idAddress: number | null;
  hashedPassword: string | null;
  email: string | null;           // alterado

  // Campos do Clerk
  firstName?: string;
  lastName?: string;

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
  const [revealedPassword, setRevealedPassword] = useState<{userId: number; password: string; email: string} | null>(null);
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
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      try {
        const success = await deleteUser(userId);
        if (success && onRefresh) {
          onRefresh();
        }
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
      }
    }
  }

  async function handleRevealPassword(userId: number) {
    try {
      setIsLoading(true);
      const result = await revealInitialPassword(userId);
      
      if (result.success && result.password && result.email) {
        setRevealedPassword({
          userId,
          password: result.password,
          email: result.email,
        });
        setShowPasswordDialog(true);
        toast.success("Senha revelada com sucesso!");
      } else {
        toast.error(result.error || "Erro ao revelar senha");
      }
    } catch (error) {
      console.error("Erro ao revelar senha:", error);
      toast.error("Erro ao revelar senha");
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
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Inserção</TableHead>
                  <TableHead>Data de Atualização</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{`${user.firstName} ${user.lastName}`.trim() || "-"}</TableCell>
                    <TableCell>
                      {user.active ? "Ativo" : "Inativo"}
                    </TableCell>
                    <TableCell>
                      {user.dtinsert
                        ? new Date(user.dtinsert).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {user.dtupdate
                        ? new Date(user.dtupdate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button onClick={() => handleEditUser(user.id)} disabled={isLoading} className="cursor-pointer">
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleRevealPassword(user.id)}
                          disabled={isLoading}
                          className="cursor-pointer"
                        >
                          Ver Senha
                        </Button>
                        <Button
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
            <DialogTitle>Senha do Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta é a senha que foi enviada para o email do usuário quando a conta foi criada.
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email:</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm">
                  {revealedPassword?.email}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(revealedPassword?.email || "")}
                >
                  Copiar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Senha:</label>
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm font-bold">
                  {revealedPassword?.password}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(revealedPassword?.password || "")}
                >
                  Copiar
                </Button>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => {
                setShowPasswordDialog(false);
                setRevealedPassword(null);
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