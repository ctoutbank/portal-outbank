"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { UserDetail } from "../_actions/use-Actions";

interface UsersCustomerListProps {
  users: UserDetail[];
  totalCount: number;
  onEdit?: (userId: number) => void;
  onDelete?: (userId: number) => void;
  permissions?: string[];
}

export default function UsersCustomerList({ 
  users, 
  totalCount, 
  onEdit, 
  onDelete, 
  permissions = []
}: UsersCustomerListProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const hasManagePermission = permissions.includes("Gerenciador") || permissions.length === 0;

  return (
    <div className="border rounded-lg mt-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-medium">Nome</TableHead>
            <TableHead className="font-medium">ID Clerk</TableHead>
            <TableHead className="font-medium">Perfil</TableHead>
            <TableHead className="font-medium text-center">Status</TableHead>
            {hasManagePermission && (
              <TableHead className="font-medium text-center">Ações</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Nenhum usuário encontrado.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow
                key={user.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <TableCell className="py-3">
                  {hasManagePermission && onEdit ? (
                    <button
                      onClick={() => onEdit(user.id)}
                      className="text-primary hover:underline"
                    >
                      {user.slug}
                    </button>
                  ) : (
                    <span>{user.slug}</span>
                  )}
                </TableCell>
                <TableCell className="py-3">{user.idClerk || "-"}</TableCell>
                <TableCell className="py-3">{user.idProfile || "-"}</TableCell>
                <TableCell className="py-3 text-center">
                  <Badge
                    variant={user.active ? "default" : "destructive"}
                    className={`${
                      user.active ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  >
                    {user.active ? "Ativo" : "Desativado"}
                  </Badge>
                </TableCell>
                {hasManagePermission && (
                  <TableCell className="py-3">
                    <div className="flex items-center justify-center gap-1">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-muted"
                          title="Editar"
                          onClick={() => onEdit(user.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-muted"
                          title="Excluir"
                          onClick={() => onDelete(user.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="p-4 border-t">
        <p className="text-sm text-muted-foreground">
          Total de {totalCount} usuário{totalCount !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
} 