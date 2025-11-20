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
  lastAccess?: string | null;
  idClerk?: string | null;
  customers?: Array<{ idCustomer: number; customerName: string | null }>;
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
                    {user.customers && user.customers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.customers.slice(0, 3).map((customer, idx) => (
                          <Badge 
                            key={idx} 
                            variant="outline" 
                            className="text-xs font-normal"
                          >
                            {customer.customerName || `ISO ${customer.idCustomer}`}
                          </Badge>
                        ))}
                        {user.customers.length > 3 && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs font-normal"
                          >
                            +{user.customers.length - 3}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    {user.profileName?.toUpperCase().includes("SUPER") ? (
                      <Badge className="bg-black text-white text-[10px] tracking-wider font-medium">
                        {user.profileName?.includes("SUPER") && (
                          <ShieldCheck className="h-3 w-3 mr-1" />
                        )}
                        SUPER ADMIN
                      </Badge>
                    ) : (
                      <Badge variant={getProfileBadgeVariant(user.profileName)}>
                        {user.profileName?.includes("ADMIN") && !user.profileName?.includes("SUPER") && (
                          <Shield className="h-3 w-3 mr-1" />
                        )}
                        {user.profileName || "N/A"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    {user.active ? (
                      <Badge className="bg-green-600 hover:bg-green-700 text-white">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    {user.lastAccess ? (
                      <span className="text-sm text-muted-foreground">
                        {new Intl.DateTimeFormat('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(new Date(user.lastAccess))}
                      </span>
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
