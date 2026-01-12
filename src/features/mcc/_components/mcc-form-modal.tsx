"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createMcc, updateMcc } from "@/features/mcc/server/mcc";
import type { MccData, NivelRisco, TipoLiquidacao } from "@/features/mcc/server/types";

const mccFormSchema = z.object({
  code: z.string().min(4, "Código deve ter 4 dígitos").max(4, "Código deve ter 4 dígitos"),
  description: z.string().min(1, "Descrição é obrigatória"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  subcategoria: z.string().optional(),
  nivelRisco: z.enum(["baixo", "medio", "alto"]),
  tipoLiquidacao: z.enum(["D0", "D1", "D2", "D14", "D30", "sob_analise"]),
  isActive: z.boolean(),
  exigeAnaliseManual: z.boolean(),
  observacoesRegulatorias: z.string().optional(),
});

type MccFormData = z.infer<typeof mccFormSchema>;

interface MccFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mcc: MccData | null;
  categorias: string[];
}

export default function MccFormModal({
  isOpen,
  onClose,
  onSuccess,
  mcc,
  categorias,
}: MccFormModalProps) {
  const [isPending, startTransition] = useTransition();
  const [customCategoria, setCustomCategoria] = useState("");
  const isEditing = !!mcc;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<MccFormData>({
    resolver: zodResolver(mccFormSchema),
    defaultValues: {
      code: "",
      description: "",
      categoria: "",
      subcategoria: "",
      nivelRisco: "baixo",
      tipoLiquidacao: "D2",
      isActive: true,
      exigeAnaliseManual: false,
      observacoesRegulatorias: "",
    },
  });

  const currentCategoria = watch("categoria");
  const currentNivelRisco = watch("nivelRisco");
  const currentTipoLiquidacao = watch("tipoLiquidacao");
  const currentIsActive = watch("isActive");
  const currentExigeAnalise = watch("exigeAnaliseManual");

  useEffect(() => {
    if (mcc) {
      reset({
        code: mcc.code,
        description: mcc.description,
        categoria: mcc.categoria,
        subcategoria: mcc.subcategoria || "",
        nivelRisco: mcc.nivelRisco,
        tipoLiquidacao: mcc.tipoLiquidacao,
        isActive: mcc.isActive,
        exigeAnaliseManual: mcc.exigeAnaliseManual,
        observacoesRegulatorias: mcc.observacoesRegulatorias || "",
      });
      setCustomCategoria("");
    } else {
      reset({
        code: "",
        description: "",
        categoria: "",
        subcategoria: "",
        nivelRisco: "baixo",
        tipoLiquidacao: "D2",
        isActive: true,
        exigeAnaliseManual: false,
        observacoesRegulatorias: "",
      });
      setCustomCategoria("");
    }
  }, [mcc, reset]);

  const onSubmit = (data: MccFormData) => {
    startTransition(async () => {
      const categoria = data.categoria === "__custom__" ? customCategoria : data.categoria;
      
      if (!categoria) {
        toast.error("Categoria é obrigatória");
        return;
      }

      if (isEditing) {
        const result = await updateMcc(mcc.id, {
          description: data.description,
          categoria,
          subcategoria: data.subcategoria || undefined,
          nivelRisco: data.nivelRisco as NivelRisco,
          tipoLiquidacao: data.tipoLiquidacao as TipoLiquidacao,
          isActive: data.isActive,
          exigeAnaliseManual: data.exigeAnaliseManual,
          observacoesRegulatorias: data.observacoesRegulatorias || undefined,
        });

        if (result.success) {
          toast.success("MCC atualizado com sucesso");
          onSuccess();
          onClose();
        } else {
          toast.error(result.error || "Erro ao atualizar MCC");
        }
      } else {
        const result = await createMcc({
          code: data.code,
          description: data.description,
          categoria,
          subcategoria: data.subcategoria || undefined,
          nivelRisco: data.nivelRisco as NivelRisco,
          tipoLiquidacao: data.tipoLiquidacao as TipoLiquidacao,
          isActive: data.isActive,
          exigeAnaliseManual: data.exigeAnaliseManual,
          observacoesRegulatorias: data.observacoesRegulatorias || undefined,
        });

        if (result.success) {
          toast.success("MCC criado com sucesso");
          onSuccess();
          onClose();
        } else {
          toast.error(result.error || "Erro ao criar MCC");
        }
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1D1D1D] border-[#2E2E2E] text-[#E0E0E0] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#FFFFFF]">
            {isEditing ? "Editar MCC" : "Novo MCC"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código MCC</Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="0000"
                maxLength={4}
                disabled={isEditing}
                className="bg-[#212121] border-[#2E2E2E]"
              />
              {errors.code && (
                <p className="text-xs text-red-400">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nivelRisco">Nível de Risco</Label>
              <Select
                value={currentNivelRisco}
                onValueChange={(v) => setValue("nivelRisco", v as NivelRisco)}
              >
                <SelectTrigger className="bg-[#212121] border-[#2E2E2E]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              {...register("description")}
              placeholder="Descrição do MCC"
              className="bg-[#212121] border-[#2E2E2E]"
            />
            {errors.description && (
              <p className="text-xs text-red-400">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={currentCategoria}
                onValueChange={(v) => setValue("categoria", v)}
              >
                <SelectTrigger className="bg-[#212121] border-[#2E2E2E]">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">+ Nova categoria</SelectItem>
                </SelectContent>
              </Select>
              {currentCategoria === "__custom__" && (
                <Input
                  value={customCategoria}
                  onChange={(e) => setCustomCategoria(e.target.value)}
                  placeholder="Nome da nova categoria"
                  className="mt-2 bg-[#212121] border-[#2E2E2E]"
                />
              )}
              {errors.categoria && (
                <p className="text-xs text-red-400">{errors.categoria.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategoria">Subcategoria</Label>
              <Input
                id="subcategoria"
                {...register("subcategoria")}
                placeholder="Opcional"
                className="bg-[#212121] border-[#2E2E2E]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipoLiquidacao">Tipo de Liquidação</Label>
            <Select
              value={currentTipoLiquidacao}
              onValueChange={(v) => setValue("tipoLiquidacao", v as TipoLiquidacao)}
            >
              <SelectTrigger className="bg-[#212121] border-[#2E2E2E]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="D0">D+0</SelectItem>
                <SelectItem value="D1">D+1</SelectItem>
                <SelectItem value="D2">D+2</SelectItem>
                <SelectItem value="D14">D+14</SelectItem>
                <SelectItem value="D30">D+30</SelectItem>
                <SelectItem value="sob_analise">Sob Análise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoesRegulatorias">Observações Regulatórias</Label>
            <Textarea
              id="observacoesRegulatorias"
              {...register("observacoesRegulatorias")}
              placeholder="Observações sobre regulamentação (opcional)"
              className="bg-[#212121] border-[#2E2E2E] min-h-[80px]"
            />
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={currentIsActive}
                onCheckedChange={(v) => setValue("isActive", v)}
              />
              <Label htmlFor="isActive" className="text-sm">Ativo</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="exigeAnaliseManual"
                checked={currentExigeAnalise}
                onCheckedChange={(v) => setValue("exigeAnaliseManual", v)}
              />
              <Label htmlFor="exigeAnaliseManual" className="text-sm">Exige Análise Manual</Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-[#212121] border-[#2E2E2E] hover:bg-[#2E2E2E]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#00A868] hover:bg-[#008f59]"
            >
              {isPending ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
