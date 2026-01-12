"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, ArrowLeft, Percent } from "lucide-react";
import Link from "next/link";

interface TenantUser {
  id: number;
  email: string | null;
  profileName: string | null;
  profileDescription: string | null;
  active: boolean | null;
  userType: string | null;
  commissionType: string | null;
  commissionPercent: number;
}

interface TenantUsersResponse {
  users: TenantUser[];
  totalCount: number;
  tenantName: string | null;
}

function formatCommissionType(type: string | null): string {
  if (!type) return "-";
  switch (type.toUpperCase()) {
    case "CORE":
      return "Core";
    case "EXECUTIVO":
      return "Executivo";
    case "OUTBANK":
      return "Outbank";
    default:
      return type;
  }
}

export default function TenantUsersPage() {
  const [data, setData] = useState<TenantUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/tenant/usuarios");
        if (!response.ok) {
          throw new Error("Erro ao carregar usuários");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button asChild className="mt-4">
              <Link href="/tenant/dashboard">Voltar ao Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tenant/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Usuários do {data?.tenantName || "ISO"}</CardTitle>
                <CardDescription>
                  Gerencie os usuários e suas comissões
                </CardDescription>
              </div>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data?.users && data.users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo Comissão</TableHead>
                  <TableHead className="text-right">Margem %</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.profileName || "Sem categoria"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.commissionType ? (
                        <Badge variant="secondary">
                          {formatCommissionType(user.commissionType)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.commissionPercent > 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="font-semibold text-primary">
                            {user.commissionPercent.toFixed(2)}%
                          </span>
                          <Percent className="h-3 w-3 text-muted-foreground" />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.active ? "default" : "secondary"}>
                        {user.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Adicione usuários para gerenciar o acesso ao portal do ISO.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Usuário
              </Button>
            </div>
          )}

          {data?.totalCount !== undefined && data.totalCount > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Total: {data.totalCount} usuário(s)
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
