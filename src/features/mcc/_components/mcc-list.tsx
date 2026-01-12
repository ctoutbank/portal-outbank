"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Search, Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useState, useEffect, useRef, useTransition } from "react";
import type { MccData, NivelRisco, TipoLiquidacao } from "@/features/mcc/server/types";
import { nivelRiscoLabels, tipoLiquidacaoLabels, nivelRiscoColors } from "@/features/mcc/server/types";
import MccFormModal from "./mcc-form-modal";
import { deleteMcc, toggleMccStatus } from "@/features/mcc/server/mcc";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MccListProps {
  mccs: MccData[];
  totalCount: number;
  sortField: string;
  sortOrder: "asc" | "desc";
  categorias: string[];
  isSuperAdmin: boolean;
  headerActions?: React.ReactNode;
}

export default function MccList({
  mccs,
  totalCount,
  sortField,
  sortOrder,
  categorias,
  isSuperAdmin,
  headerActions,
}: MccListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams?.get("mccSearch") || "";
  const [searchValue, setSearchValue] = useState(currentSearch);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPending, startTransition] = useTransition();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMcc, setSelectedMcc] = useState<MccData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mccToDelete, setMccToDelete] = useState<MccData | null>(null);

  useEffect(() => {
    const searchParam = searchParams?.get("mccSearch") || "";
    if (searchParam !== searchValue) {
      setSearchValue(searchParam);
    }
  }, [searchParams]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      
      if (value.trim()) {
        params.set("mccSearch", value.trim());
        params.set("mccPage", "1");
      } else {
        params.delete("mccSearch");
        params.set("mccPage", "1");
      }

      router.push(`/categories?${params.toString()}`);
    }, 300);
  };

  const handleSort = (field: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");

    if (field === sortField) {
      params.set("mccSortOrder", sortOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("mccSortField", field);
      params.set("mccSortOrder", "asc");
    }

    router.push(`/categories?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("mccPage", "1");
    
    router.push(`/categories?${params.toString()}`);
  };

  const handleEdit = (mcc: MccData) => {
    setSelectedMcc(mcc);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedMcc(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedMcc(null);
  };

  const handleModalSuccess = () => {
    router.refresh();
  };

  const handleDelete = async () => {
    if (!mccToDelete) return;
    
    startTransition(async () => {
      const result = await deleteMcc(mccToDelete.id);
      if (result.success) {
        toast.success("MCC excluído com sucesso");
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao excluir MCC");
      }
      setDeleteDialogOpen(false);
      setMccToDelete(null);
    });
  };

  const handleToggleStatus = async (mcc: MccData) => {
    startTransition(async () => {
      const result = await toggleMccStatus(mcc.id);
      if (result.success) {
        toast.success(`MCC ${result.data?.isActive ? "ativado" : "desativado"} com sucesso`);
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao alterar status");
      }
    });
  };

  const currentCategoria = searchParams?.get("mccCategoria") || "";
  const currentNivelRisco = searchParams?.get("mccNivelRisco") || "";
  const currentTipoLiquidacao = searchParams?.get("mccTipoLiquidacao") || "";
  const currentStatus = searchParams?.get("mccStatus") || "";

  return (
    <div className="w-full overflow-x-hidden bg-[#161616]">
      <div className="mb-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#616161] z-10" />
            <Input
              type="text"
              placeholder="Buscar MCC por código, descrição ou categoria..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 h-[42px] bg-[#424242] border border-[#353535] rounded-[6px] text-[#E0E0E0] placeholder:text-[#E0E0E0] focus-visible:ring-2 focus-visible:ring-[#555555] focus-visible:border-[#555555]"
            />
          </div>
          {headerActions}
        </div>
        
        <Button onClick={handleCreate} className="bg-[#00A868] hover:bg-[#008f59] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Novo MCC
        </Button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select value={currentCategoria || "all"} onValueChange={(v) => handleFilterChange("mccCategoria", v)}>
          <SelectTrigger className="w-[180px] h-[42px] bg-[#212121] border-[#2E2E2E]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {categorias.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={currentNivelRisco || "all"} onValueChange={(v) => handleFilterChange("mccNivelRisco", v)}>
          <SelectTrigger className="w-[150px] h-[42px] bg-[#212121] border-[#2E2E2E]">
            <SelectValue placeholder="Nível de Risco" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Riscos</SelectItem>
            <SelectItem value="baixo">Baixo</SelectItem>
            <SelectItem value="medio">Médio</SelectItem>
            <SelectItem value="alto">Alto</SelectItem>
          </SelectContent>
        </Select>

        <Select value={currentTipoLiquidacao || "all"} onValueChange={(v) => handleFilterChange("mccTipoLiquidacao", v)}>
          <SelectTrigger className="w-[150px] h-[42px] bg-[#212121] border-[#2E2E2E]">
            <SelectValue placeholder="Liquidação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Liquidações</SelectItem>
            <SelectItem value="D0">D+0</SelectItem>
            <SelectItem value="D1">D+1</SelectItem>
            <SelectItem value="D2">D+2</SelectItem>
            <SelectItem value="D14">D+14</SelectItem>
            <SelectItem value="D30">D+30</SelectItem>
            <SelectItem value="sob_analise">Sob Análise</SelectItem>
          </SelectContent>
        </Select>

        <Select value={currentStatus || "all"} onValueChange={(v) => handleFilterChange("mccStatus", v)}>
          <SelectTrigger className="w-[130px] h-[42px] bg-[#212121] border-[#2E2E2E]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>

        <button
          onClick={() => handleSort("code")}
          className="flex items-center gap-2 px-4 py-2 h-[42px] border border-[#2E2E2E] bg-[#212121] hover:bg-[#2E2E2E] transition-colors rounded-[6px] text-sm font-normal text-[#E0E0E0]"
        >
          Ordenar por Código
          <ArrowUpDown className="h-4 w-4" />
          {sortField === "code" && (
            <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
          )}
        </button>
      </div>

      {mccs.length === 0 ? (
        <div className="w-full p-4 text-center border border-[rgba(255,255,255,0.1)] rounded-[6px] bg-[#1D1D1D]">
          <p className="text-[#5C5C5C] text-sm font-normal">Nenhum MCC encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {mccs.map((mcc) => (
            <Card
              key={mcc.id}
              className={`border border-[rgba(255,255,255,0.1)] rounded-[6px] shadow-sm bg-[#1D1D1D] ${!mcc.isActive ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0 flex-wrap">
                    <div className="text-[22px] font-semibold text-[#FFFFFF] min-w-[60px]">
                      {mcc.code}
                    </div>

                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="text-sm text-[#E0E0E0] font-medium truncate">
                        {mcc.description}
                      </div>
                      <div className="text-xs text-[#5C5C5C]">
                        {mcc.categoria}{mcc.subcategoria ? ` / ${mcc.subcategoria}` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-nowrap">
                      <Badge className={`${nivelRiscoColors[mcc.nivelRisco]} border text-xs whitespace-nowrap`}>
                        {nivelRiscoLabels[mcc.nivelRisco]}
                      </Badge>
                      
                      <Badge variant="outline" className="text-xs border-[#2E2E2E] text-[#E0E0E0] whitespace-nowrap">
                        {tipoLiquidacaoLabels[mcc.tipoLiquidacao]}
                      </Badge>

                      {mcc.exigeAnaliseManual && (
                        <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-400 bg-orange-500/10 whitespace-nowrap">
                          Análise Manual
                        </Badge>
                      )}

                      <Badge 
                        variant="outline" 
                        className={`text-xs whitespace-nowrap ${mcc.isActive ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}
                      >
                        {mcc.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(mcc)}
                      disabled={isPending}
                      className="h-8 w-8 text-[#5C5C5C] hover:text-[#E0E0E0]"
                      title={mcc.isActive ? "Desativar" : "Ativar"}
                    >
                      {mcc.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(mcc)}
                      className="h-8 w-8 text-[#5C5C5C] hover:text-[#E0E0E0]"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    {isSuperAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setMccToDelete(mcc);
                          setDeleteDialogOpen(true);
                        }}
                        disabled={isPending}
                        className="h-8 w-8 text-[#5C5C5C] hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MccFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        mcc={selectedMcc}
        categorias={categorias}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1D1D1D] border-[#2E2E2E]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#FFFFFF]">Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-[#5C5C5C]">
              Tem certeza que deseja excluir o MCC {mccToDelete?.code} - {mccToDelete?.description}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] hover:bg-[#2E2E2E]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
