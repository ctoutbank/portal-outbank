"use client";

import { useTransition } from "react";
import { deactivateCustomer } from "../server/customers";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DeactivateCustomerButton() {
  const [isPending, startTransition] = useTransition();
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const handleClick = () => {
    startTransition(async () => {
      try {
        await deactivateCustomer(id);
        toast.success("ISO desativado com sucesso!");
        router.push(`/customers`);
      } catch (error) {
        console.error("Erro ao desativar ISO:", error);
        toast.error("Erro ao desativar o ISO.");
      }
    });
  };

  return (
    <Button variant="destructive" className="cursor-pointer" onClick={handleClick} disabled={isPending}>
      {isPending ? "Desativando..." : "Desativar ISO"}
    </Button>
  );
}
