"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { deleteUser, UserDetail } from "../_actions/use-Actions";
import { UserDetailForm, getUserDetailWithClerk } from "../_actions/user-actions";
import UserCustomerForm from "./user-form";


interface UserTableProps {
  users: UserDetail[];
  customerId: number;
  onRefresh?: () => void;
}

export default function UserTable({
  users,
  customerId,
  onRefresh,
}: UserTableProps) {
  const [selectedUser, setSelectedUser] = useState<UserDetailForm | null>(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Usuários</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os usuários do cliente
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger onClick={handleNewUser}>
            <div className="h-8 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90">
              Novo Usuário
            </div>
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
                    <TableCell>{user.slug}</TableCell>
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
                        <Button onClick={() => handleEditUser(user.id)} disabled={isLoading}>
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={isLoading}
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
    </div>
  );
}
