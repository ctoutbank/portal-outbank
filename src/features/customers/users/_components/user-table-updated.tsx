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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteUser } from "../_actions/use-Actions";
import {getUserDetailWithClerk, UserDetailForm} from "../_actions/user-actions";
import UserCustomerForm from "./user-form";

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
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
                  const initials = fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "?";
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{fullName || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {user.email || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.active ? "default" : "secondary"}>
                          {user.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {user.dtinsert
                            ? new Date(user.dtinsert).toLocaleDateString("pt-BR")
                            : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isLoading}
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditUser(user.id)}
                              className="cursor-pointer"
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user.id)}
                              className="cursor-pointer text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}    