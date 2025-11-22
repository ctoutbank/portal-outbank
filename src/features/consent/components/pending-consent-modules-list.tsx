"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface PendingModule {
  merchantModuleId: number;
  merchantId: number;
  moduleId: number;
  moduleName: string | null;
  moduleSlug: string | null;
  merchantName: string | null;
  notified: boolean | null;
}

interface Notification {
  id: number;
  title: string | null;
  message: string | null;
  type: string | null;
  link: string | null;
  isRead: boolean | null;
}

interface PendingConsentModulesListProps {
  notifications: Notification[];
  pendingModules: PendingModule[];
}

export default function PendingConsentModulesList({
  notifications,
  pendingModules,
}: PendingConsentModulesListProps) {
  const [loading, setLoading] = useState<number | null>(null);

  if (pendingModules.length === 0 && notifications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum módulo pendente
            </h3>
            <p className="text-muted-foreground">
              Você já deu consentimento a todos os módulos disponíveis.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Notificações Pendentes
            </CardTitle>
            <CardDescription>
              Você tem {notifications.length} notificação(ões) sobre novos módulos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-amber-50 dark:bg-amber-950/20"
                >
                  <div className="flex-1">
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                  {notification.link && (
                    <Link href={notification.link}>
                      <Button size="sm" variant="outline">
                        Ver detalhes
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Módulos Aguardando Consentimento
          </CardTitle>
          <CardDescription>
            Você precisa dar seu consentimento LGPD para usar estes módulos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingModules.map((module) => (
              <div
                key={module.merchantModuleId}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{module.moduleName || "Módulo"}</h3>
                    <Badge variant="pending">
                      {module.moduleSlug?.toUpperCase() || "MOD"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Estabelecimento: <strong>{module.merchantName || "N/A"}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    É necessário seu consentimento LGPD para ativar este módulo
                  </p>
                </div>
                <Link href={`/consent/modules/${module.moduleId}?merchant=${module.merchantId}`}>
                  <Button
                    variant="default"
                    disabled={loading === module.merchantModuleId}
                  >
                    {loading === module.merchantModuleId ? (
                      "Carregando..."
                    ) : (
                      <>
                        Dar Consentimento
                      </>
                    )}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


