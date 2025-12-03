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
  // Debug: verificar se users têm o campo customers
  if (users.length > 0) {
    console.log('[AdminUsersList] Total de usuários:', users.length);
    console.log('[AdminUsersList] Primeiro usuário:', {
      id: users[0]?.id,
      email: users[0]?.email,
      customers: users[0]?.customers,
      customersLength: users[0]?.customers?.length
    });
  }

  const getProfileBadgeVariant = (profileName: string | null) => {
    if (!profileName) return "secondary";
    const upper = profileName.toUpperCase();
    if (upper.includes("SUPER")) return "destructive";
    if (upper.includes("ADMIN")) return "default";
    return "secondary";
  };

  return (
    <div>
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1f1f1f] border-b border-[#2a2a2a] hover:bg-[#1f1f1f]">
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider">Email</TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider">ISO</TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider">Perfil</TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider">Status</TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider">Acesso</TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-[#808080]">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-b border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors"
                  >
                    <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                      <span className="text-white">{user.email || "--"}</span>
                    </TableCell>
                    <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                      {user.customers && Array.isArray(user.customers) && user.customers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.customers
                            .filter((c): c is { idCustomer: number; customerName: string | null } => 
                              c !== null && c !== undefined && c.idCustomer !== null && c.idCustomer !== undefined
                            )
                            .slice(0, 3)
                            .map((customer) => (
                              <Badge 
                                key={`${user.id}-customer-${customer.idCustomer}`}
                                variant="outline" 
                                className="text-[11px] font-normal"
                              >
                                {customer.customerName || `ISO ${customer.idCustomer}`}
                              </Badge>
                            ))}
                          {user.customers.length > 3 && (
                            <Badge 
                              variant="secondary" 
                              className="text-[11px] font-normal"
                              title={`Mais ${user.customers.length - 3} ISO(s)`}
                            >
                              +{user.customers.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#808080]">--</span>
                      )}
                    </TableCell>
                    <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                      {user.profileName?.toUpperCase().includes("SUPER") ? (
                        <Badge className="bg-black text-white text-[11px] tracking-wider font-medium">
                          {user.profileName?.includes("SUPER") && (
                            <ShieldCheck className="h-3 w-3 mr-1" />
                          )}
                          SUPER ADMIN
                        </Badge>
                      ) : (
                        <Badge variant={getProfileBadgeVariant(user.profileName)} className="text-[11px]">
                          {user.profileName?.includes("ADMIN") && !user.profileName?.includes("SUPER") && (
                            <Shield className="h-3 w-3 mr-1" />
                          )}
                          {user.profileName || "N/A"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                      {user.active ? (
                        <Badge className="bg-green-600 hover:bg-green-700 text-white text-[11px]">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[11px]">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                      {user.lastAccess ? (() => {
                        try {
                          const date = new Date(user.lastAccess);
                          if (isNaN(date.getTime())) {
                            return <span className="text-[#808080]">--</span>;
                          }
                          return (
                            <span className="text-[11px] text-[#606060]">
                              {new Intl.DateTimeFormat('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }).format(date)}
                            </span>
                          );
                        } catch (error) {
                          return <span className="text-[#808080]">--</span>;
                        }
                      })() : (
                        <span className="text-[#808080]">--</span>
                      )}
                    </TableCell>
                    <TableCell className="p-4 text-right">
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
    </div>
  );
}
