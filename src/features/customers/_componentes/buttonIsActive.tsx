"use client";

import { useState, useTransition, useEffect } from "react";
import { deactivateCustomer, activateCustomer, deleteCustomer, canDeleteCustomer } from "../server/customers";
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
import { AlertTriangle, Users } from "lucide-react";

interface CustomerActionButtonsProps {
  isActive: boolean;
  canDeactivate: boolean;
  canDelete: boolean;
}

export default function CustomerActionButtons({ isActive, canDeactivate, canDelete }: CustomerActionButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteCheck, setDeleteCheck] = useState<{ canDelete: boolean; reason?: string; userCount?: number; isSuperAdmin?: boolean } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
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

  const handleDeleteClick = async () => {
    setIsChecking(true);
    try {
      const check = await canDeleteCustomer(id);
      setDeleteCheck(check);
      setShowDeleteDialog(true);
    } catch (error) {
      console.error("Erro ao verificar permissão:", error);
      toast.error("Erro ao verificar permissão de exclusão.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false);
    
    startTransition(async () => {
      try {
        await deleteCustomer(id);
        toast.success("ISO deletado com sucesso!");
        router.push("/customers");
      } catch (error: any) {
        console.error("Erro ao deletar ISO:", error);
        toast.error(error?.message || "Erro ao deletar o ISO.");
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {canDeactivate && (
          isActive ? (
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
          )
        )}
        
        {canDelete && (
          <Button 
            variant="outline" 
            className="cursor-pointer border-red-600 text-red-600 hover:bg-red-950 hover:text-red-500 min-w-[140px]" 
            onClick={handleDeleteClick} 
            disabled={isPending || isChecking}
            size="default"
          >
            {isChecking ? "Verificando..." : isPending ? "Deletando..." : "Deletar ISO"}
          </Button>
        )}
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-[#1D1D1D] border-[#2E2E2E] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#E0E0E0] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="text-[#A0A0A0]">
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {!deleteCheck?.isSuperAdmin && (
              <div className="p-4 bg-black rounded-lg border border-red-900/50">
                <p className="text-red-400 text-sm">
                  Apenas Super Admin pode deletar ISOs.
                </p>
              </div>
            )}
            
            {deleteCheck?.isSuperAdmin && deleteCheck?.userCount !== undefined && deleteCheck.userCount > 0 && (
              <div className="p-4 bg-black rounded-lg border border-[#2E2E2E]">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-amber-500" />
                  <span className="text-[#E0E0E0] text-sm font-medium">
                    {deleteCheck.userCount} usuário(s) vinculado(s)
                  </span>
                </div>
                <p className="text-amber-500 text-xs">
                  Estes usuários também serão removidos.
                </p>
              </div>
            )}
            
            {deleteCheck?.isSuperAdmin && (
              <div className="p-4 bg-black rounded-lg border border-[#2E2E2E]">
                <p className="text-[#E0E0E0] text-sm">
                  Tem certeza que deseja deletar este ISO permanentemente?
                </p>
                <p className="text-[#707070] text-xs mt-2">
                  Todos os dados associados serão removidos.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isPending}
              className="border-[#2E2E2E] text-[#E0E0E0] hover:bg-[#2E2E2E]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isPending || !deleteCheck?.canDelete}
              className="bg-red-600 hover:bg-red-700 text-white border-0 disabled:opacity-50"
            >
              {isPending ? "Deletando..." : "Sim, Deletar ISO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
