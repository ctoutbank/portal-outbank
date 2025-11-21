"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import { DateTime } from "luxon";

interface ConsentHistoryItem {
  id: number;
  action: string | null;
  consentText: string | null;
  ipAddress: string | null;
  userEmail: string | null;
  dtinsert: string | null;
  moduleName: string | null;
  moduleSlug: string | null;
}

interface ConsentHistoryListProps {
  history: ConsentHistoryItem[];
  userId: number;
}

export default function ConsentHistoryList({
  history,
  userId,
}: ConsentHistoryListProps) {
  const getActionBadge = (action: string | null) => {
    switch (action) {
      case "GRANTED":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Consentido
          </Badge>
        );
      case "REVOKED":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Revogado
          </Badge>
        );
      case "NOTIFIED":
        return (
          <Badge variant="pending" className="gap-1">
            <Clock className="h-3 w-3" />
            Notificado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {action || "Desconhecido"}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return DateTime.fromISO(dateString)
        .setZone("America/Sao_Paulo")
        .toLocaleString(DateTime.DATETIME_MED);
    } catch {
      return dateString;
    }
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum histórico encontrado
            </h3>
            <p className="text-muted-foreground">
              Você ainda não tem histórico de consentimentos LGPD registrado.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico Completo de Consentimentos</CardTitle>
        <CardDescription>
          Todos os consentimentos e revogações LGPD registrados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="w-[200px]">Termo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {formatDate(item.dtinsert)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {item.moduleName || "N/A"}
                      </span>
                      {item.moduleSlug && (
                        <Badge variant="secondary" className="text-xs">
                          {item.moduleSlug.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getActionBadge(item.action)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.userEmail || "N/A"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.ipAddress || "N/A"}
                  </TableCell>
                  <TableCell>
                    {item.consentText ? (
                      <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {item.consentText.substring(0, 100)}...
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

