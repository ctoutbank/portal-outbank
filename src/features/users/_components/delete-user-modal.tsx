"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, UserMinus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  deleteUserWithTransfer,
  getUserAttributions,
  getAvailableTransferTargets,
} from "@/features/users/server/admin-users";
import { useRouter } from "next/navigation";

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: number;
    email: string | null;
    profileName: string | null;
  };
}

export function DeleteUserModal({ isOpen, onClose, user }: DeleteUserModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [attributions, setAttributions] = useState<{
    managedCustomers: Array<{ id: number; idCustomer: number | null; customerName: string | null }>;
    totalCustomers: number;
  } | null>(null);
  const [availableTargets, setAvailableTargets] = useState<Array<{
    id: number;
    email: string | null;
    profileName: string | null;
  }>>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados quando modal abre
  useEffect(() => {
    if (isOpen && user.id) {
      setIsLoading(true);
      Promise.all([
        getUserAttributions(user.id),
        getAvailableTransferTargets(user.id),
      ])
        .then(([attrs, targets]) => {
          setAttributions(attrs);
          setAvailableTargets(targets);
          // Selecionar primeiro target disponível como padrão
          if (targets.length > 0) {
            setSelectedTargetId(targets[0].id);
          }
        })
        .catch((error) => {
          console.error("Erro ao carregar dados:", error);
          toast.error("Erro ao carregar dados do usuário");
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, user.id]);

  const handleDelete = () => {
    if (!selectedTargetId && attributions && attributions.totalCustomers > 0) {
      toast.error("Selecione um usuário para transferir as atribuições");
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteUserWithTransfer(user.id, selectedTargetId || undefined);
        
        if (result.success) {
          toast.success("Usuário deletado com sucesso");
          onClose();
          router.refresh();
        }
      } catch (error: any) {
        console.error("Erro ao deletar usuário:", error);
        toast.error(error.message || "Erro ao deletar usuário");
      }
    });
  };

  const isSuperAdminUser = user.profileName?.toUpperCase().includes("SUPER");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Deletar Usuário
          </DialogTitle>
          <DialogDescription>
            Esta ação é irreversível. O usuário será permanentemente removido do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações do usuário */}
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <UserMinus className="h-4 w-4 text-destructive" />
              <span className="font-medium">Usuário a ser deletado:</span>
            </div>
            <p className="text-sm">{user.email}</p>
            {user.profileName && (
              <Badge variant="outline" className="mt-2 text-xs">
                {user.profileName}
              </Badge>
            )}
          </div>

          {/* Aviso para Super Admin */}
          {isSuperAdminUser && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                ⚠️ Atenção: Você está tentando deletar um usuário com perfil Super Admin.
                Se este for o usuário protegido (cto@outbank.com.br), a operação será bloqueada.
              </p>
            </div>
          )}

          {/* Carregando atribuições */}
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Carregando atribuições...
            </div>
          ) : (
            <>
              {/* Atribuições que serão transferidas */}
              {attributions && attributions.totalCustomers > 0 && (
                <div className="space-y-3">
                  <div className="p-3 bg-accent/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">
                      Atribuições que serão transferidas:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {attributions.managedCustomers.slice(0, 5).map((mc) => (
                        <Badge key={mc.id} variant="secondary" className="text-xs">
                          {mc.customerName || `ISO #${mc.idCustomer}`}
                        </Badge>
                      ))}
                      {attributions.managedCustomers.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{attributions.managedCustomers.length - 5} ISOs
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Seleção do usuário destino */}
                  <div className="space-y-2">
                    <Label>
                      Transferir atribuições para: <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={selectedTargetId?.toString() || ""}
                      onValueChange={(value) => setSelectedTargetId(Number(value))}
                      disabled={isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o usuário destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTargets.map((target) => (
                          <SelectItem key={target.id} value={target.id.toString()}>
                            <div className="flex items-center gap-2">
                              <span>{target.email}</span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <Badge variant="outline" className="text-xs">
                                {target.profileName || "N/A"}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Os ISOs gerenciados serão transferidos para este usuário.
                    </p>
                  </div>
                </div>
              )}

              {/* Sem atribuições para transferir */}
              {attributions && attributions.totalCustomers === 0 && (
                <div className="p-3 bg-accent/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Este usuário não possui ISOs vinculados para transferir.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending || isLoading || (attributions?.totalCustomers ?? 0) > 0 && !selectedTargetId}
          >
            {isPending ? "Deletando..." : "Confirmar Deleção"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

