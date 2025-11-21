"use client";

import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

interface ConsentNotificationsBadgeProps {
  className?: string;
}

export function ConsentNotificationsBadge({ className }: ConsentNotificationsBadgeProps) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Buscar quantidade de notificações pendentes
    fetch("/api/consent/pending-count")
      .then((res) => res.json())
      .then((data) => {
        if (data.count !== undefined) {
          setPendingCount(data.count);
        }
      })
      .catch((error) => {
        console.error("Erro ao buscar notificações pendentes:", error);
      });

    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      fetch("/api/consent/pending-count")
        .then((res) => res.json())
        .then((data) => {
          if (data.count !== undefined) {
            setPendingCount(data.count);
          }
        })
        .catch((error) => {
          console.error("Erro ao buscar notificações pendentes:", error);
        });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (pendingCount === 0) {
    return null;
  }

  return (
    <Badge
      variant="destructive"
      className={`h-5 w-5 flex items-center justify-center p-0 text-xs ${className || ""}`}
    >
      {pendingCount > 9 ? "9+" : pendingCount}
    </Badge>
  );
}

