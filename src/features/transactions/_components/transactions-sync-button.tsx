"use client";

import { Button } from "@/components/ui/button";
import { syncTransactions } from "@/features/pricingSolicitation/server/integrations/dock/sync-transactions/main";
import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function TransactionsSyncButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  
  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await syncTransactions();
          router.refresh();
        })
      }
      className="bg-[#1f1f1f] border border-[#2a2a2a] text-white hover:bg-[#252525] hover:border-[#3a3a3a]"
    >
      {isPending ? (
        <>
          <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
          Sincronizando...
        </>
      ) : (
        <>
          <RefreshCcw className="w-4 h-4 mr-2" />
          Sincronizar
        </>
      )}
    </Button>
  );
}

