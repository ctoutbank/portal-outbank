"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Pencil, Trash2, Shield, ShieldCheck, UserX, UserCheck, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteUserModal } from "./delete-user-modal";
import { deactivateUser, reactivateUser } from "@/features/users/server/admin-users";
import { toast } from "sonner";

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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteModalUser, setDeleteModalUser] = useState<UserData | null>(null);

  const getProfileBadgeVariant = (profileName: string | null) => {
    if (!profileName) return "secondary";
    const upper = profileName.toUpperCase();
    if (upper.includes("SUPER")) return "destructive";
    if (upper.includes("ADMIN")) return "default";
    return "secondary";
  };

  const handleDeactivate = async (user: UserData) => {
    startTransition(async () => {
      try {
        const result = await deactivateUser(user.id);
        if (result.success) {
          toast.success("Usuário desativado com sucesso");
          router.refresh();
        } else {
          toast.error(result.error || "Erro ao desativar usuário");
        }
      } catch (error: any) {
        toast.error(error.message || "Erro ao desativar usuário");
      }
    });
  };

  const handleReactivate = async (user: UserData) => {
    startTransition(async () => {
      try {
        const result = await reactivateUser(user.id);
        if (result.success) {
          toast.success("Usuário reativado com sucesso");
          router.refresh();
        } else {
          toast.error(result.error || "Erro ao reativar usuário");
        }
      } catch (error: any) {
        toast.error(error.message || "Erro ao reativar usuário");
      }
    });
  };

  const isSuperAdminProtected = (email: string | null) => {
    return email?.toLowerCase() === "cto@outbank.com.br";
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
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link href={`/config/users/${user.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>

                        {/* Menu de ações adicionais */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={isPending}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Ativar/Desativar */}
                            {user.active ? (
                              <DropdownMenuItem
                                onClick={() => handleDeactivate(user)}
                                disabled={isSuperAdminProtected(user.email)}
                                className="text-orange-500"
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Desativar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleReactivate(user)}
                                className="text-green-500"
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                Reativar
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            {/* Deletar */}
                            <DropdownMenuItem
                              onClick={() => setDeleteModalUser(user)}
                              disabled={isSuperAdminProtected(user.email)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de deleção */}
      {deleteModalUser && (
        <DeleteUserModal
          isOpen={!!deleteModalUser}
          onClose={() => setDeleteModalUser(null)}
          user={{
            id: deleteModalUser.id,
            email: deleteModalUser.email,
            profileName: deleteModalUser.profileName,
          }}
        />
      )}
    </div>
  );
}
