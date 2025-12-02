"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function MerchantNotFoundToast() {
  const router = useRouter();

  useEffect(() => {
    toast.error("Estabelecimento não encontrado ou você não tem acesso a ele.");
    router.push("/merchants");
  }, [router]);

  return (
    <div className="p-4 text-center">
      <p className="text-muted-foreground">
        Estabelecimento não encontrado ou você não tem acesso a ele.
      </p>
    </div>
  );
}




