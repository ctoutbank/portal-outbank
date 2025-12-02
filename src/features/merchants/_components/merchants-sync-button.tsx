"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function MerchantsSyncButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/merchants/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao sincronizar estabelecimentos");
      }

      toast.success("Sincronização concluída com sucesso!");
      
      // Recarregar a página após um breve delay para mostrar os dados atualizados
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error("Erro ao sincronizar:", error);
      toast.error(error.message || "Erro ao sincronizar estabelecimentos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Sincronizando..." : "Sincronizar Agora"}
    </Button>
  );
}




