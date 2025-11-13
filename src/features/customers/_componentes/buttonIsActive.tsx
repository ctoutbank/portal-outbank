"use client";

import { useTransition } from "react";
import { deactivateCustomer, activateCustomer, deleteCustomer } from "../server/customers";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CustomerActionButtons({ isActive }: { isActive: boolean }) {
  const [isPending, startTransition] = useTransition();
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);

  const handleDeactivate = () => {
    startTransition(async () => {
      try {
        await deactivateCustomer(id);
        toast.success("ISO desativado com sucesso!");
        router.refresh();
      } catch (error) {
        console.error("Erro ao desativar ISO:", error);
        toast.error("Erro ao desativar o ISO.");
      }
    });
  };

  const handleActivate = () => {
    startTransition(async () => {
      try {
        await activateCustomer(id);
        toast.success("ISO ativado com sucesso!");
        router.refresh();
      } catch (error) {
        console.error("Erro ao ativar ISO:", error);
        toast.error("Erro ao ativar o ISO.");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Tem certeza que deseja deletar este ISO permanentemente? Esta ação não pode ser desfeita.")) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteCustomer(id);
        toast.success("ISO deletado com sucesso!");
        router.push("/customers");
      } catch (error) {
        console.error("Erro ao deletar ISO:", error);
        toast.error("Erro ao deletar o ISO.");
      }
    });
  };

  return (
    <div className="flex items-center space-x-2">
      {isActive ? (
        <Button 
          variant="destructive" 
          className="cursor-pointer" 
          onClick={handleDeactivate} 
          disabled={isPending}
        >
          {isPending ? "Desativando..." : "Desativar ISO"}
        </Button>
      ) : (
        <Button 
          variant="default" 
          className="cursor-pointer bg-green-600 hover:bg-green-700" 
          onClick={handleActivate} 
          disabled={isPending}
        >
          {isPending ? "Ativando..." : "Ativar ISO"}
        </Button>
      )}
      
      <Button 
        variant="outline" 
        className="cursor-pointer border-red-600 text-red-600 hover:bg-red-50" 
        onClick={handleDelete} 
        disabled={isPending}
      >
        {isPending ? "Deletando..." : "Deletar ISO"}
      </Button>
    </div>
  );
}
