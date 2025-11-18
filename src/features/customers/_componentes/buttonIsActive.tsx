"use client";

import { useState, useTransition } from "react";
import { deactivateCustomer, activateCustomer, deleteCustomer } from "../server/customers";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

export default function CustomerActionButtons({ isActive }: { isActive: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false);
    
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
    <>
      <div className="flex items-center gap-3">
        {isActive ? (
          <Button 
            variant="destructive" 
            className="cursor-pointer min-w-[140px]" 
            onClick={handleDeactivate} 
            disabled={isPending}
            size="default"
          >
            {isPending ? "Desativando..." : "Desativar ISO"}
          </Button>
        ) : (
          <Button 
            variant="default" 
            className="cursor-pointer bg-green-600 hover:bg-green-700 min-w-[140px]" 
            onClick={handleActivate} 
            disabled={isPending}
            size="default"
          >
            {isPending ? "Ativando..." : "Ativar ISO"}
          </Button>
        )}
        
        <Button 
          variant="outline" 
          className="cursor-pointer border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700 min-w-[140px]" 
          onClick={handleDeleteClick} 
          disabled={isPending}
          size="default"
        >
          {isPending ? "Deletando..." : "Deletar ISO"}
        </Button>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle className="text-xl">Confirmar Exclusão</DialogTitle>
            </div>
            <DialogDescription className="pt-3 text-base">
              Tem certeza que deseja deletar este ISO permanentemente?
              <br />
              <br />
              <span className="font-semibold text-red-600">
                Esta ação não pode ser desfeita.
              </span>
              <br />
              <br />
              Todos os dados associados a este ISO, incluindo usuários, customizações e configurações serão removidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isPending}
            >
              {isPending ? "Deletando..." : "Sim, Deletar ISO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
