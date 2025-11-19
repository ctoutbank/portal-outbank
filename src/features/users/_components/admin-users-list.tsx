"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Shield, ShieldCheck } from "lucide-react";

type UserData = {
  id: number;
  email: string | null;
  idCustomer: number | null;
  idProfile: number | null;
  active: boolean | null;
  fullAccess: boolean | null;
  customerName: string | null;
  profileName: string | null;
  profileDescription: string | null | undefined;
};

interface AdminUsersListProps {
  users: UserData[];
}

export function AdminUsersList({ users }: AdminUsersListProps) {
  const getProfileBadgeVariant = (profileName: string | null) => {
    if (!profileName) return "secondary";
    const upper = profileName.toUpperCase();
    if (upper.includes("SUPER")) return "destructive";
    if (upper.includes("ADMIN")) return "default";
    return "secondary";
  };

  return (
    <div>
      <div className="border rounded-lg shadow-sm bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold text-sm">Email</TableHead>
              <TableHead className="font-semibold text-sm">ISO</TableHead>
              <TableHead className="font-semibold text-sm">Perfil</TableHead>
              <TableHead className="font-semibold text-sm">Status</TableHead>
              <TableHead className="font-semibold text-sm">Acesso</TableHead>
              <TableHead className="font-semibold text-sm text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="py-3">
                    <span className="text-sm font-medium">{user.email || "--"}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm">
                      {user.customerName || "--"}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant={getProfileBadgeVariant(user.profileName)}>
                      {user.profileName?.includes("SUPER") && (
                        <ShieldCheck className="h-3 w-3 mr-1" />
                      )}
                      {user.profileName?.includes("ADMIN") && !user.profileName?.includes("SUPER") && (
                        <Shield className="h-3 w-3 mr-1" />
                      )}
                      {user.profileName || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant={user.active ? "default" : "secondary"}>
                      {user.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    {user.fullAccess ? (
                      <Badge variant="outline">Acesso Total</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">--</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link href={`/config/users/${user.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
