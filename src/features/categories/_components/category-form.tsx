"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  createCategory,
  updateCategory,
} from "@/features/categories/server/categories";
import {
  updateCategoryPermissions,
} from "@/features/categories/server/permissions";
import {
  updateCategoryCustomers,
} from "@/features/categories/server/category-customers";
import { AdminCustomerAssignment } from "@/features/users/_components/admin-customer-assignment";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryData = {
  id?: number;
  name: string | null;
  description: string | null;
  active: boolean | null;
  restrictCustomerData: boolean | null;
  isSalesAgent?: boolean | null;
};

type FunctionData = {
  id: number;
  name: string | null;
  group: string | null;
  active: boolean | null;
};

type FunctionsData = {
  all: FunctionData[];
  grouped: Record<string, FunctionData[]>;
  groups: string[];
};

interface CategoryFormProps {
  category?: CategoryData;
  functions: FunctionsData;
  assignedFunctionIds?: number[];
  customers?: Array<{ id: number; name: string | null; slug?: string | null }>;
  assignedCustomerIds?: number[];
}

// Estados das seções
type SectionStatus = "pending" | "modified" | "saved" | "error";

interface SectionState {
  status: SectionStatus;
  isOpen: boolean;
}

export function CategoryForm({
  category,
  functions,
  assignedFunctionIds = [],
  customers = [],
  assignedCustomerIds = [],
}: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Dados básicos
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [active, setActive] = useState(category?.active ?? true);
  const [restrictCustomerData, setRestrictCustomerData] = useState(
    category?.restrictCustomerData || false
  );
  
  // Permissões e ISOs
  const [selectedFunctionIds, setSelectedFunctionIds] = useState<number[]>(
    assignedFunctionIds || []
  );
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>(
    assignedCustomerIds || []
  );

  // Estado das seções (para indicadores visuais)
  const [sections, setSections] = useState<Record<string, SectionState>>({
    basic: { status: category?.id ? "saved" : "pending", isOpen: true },
    permissions: { status: assignedFunctionIds.length > 0 ? "saved" : "pending", isOpen: false },
    isos: { status: assignedCustomerIds.length > 0 ? "saved" : "pending", isOpen: false },
  });

  // Estados salvos originais (para detectar modificações)
  const [originalBasic] = useState({
    name: category?.name || "",
    description: category?.description || "",
    active: category?.active ?? true,
    restrictCustomerData: category?.restrictCustomerData || false,
  });
  const [originalFunctionIds] = useState<number[]>(assignedFunctionIds || []);
  const [originalCustomerIds] = useState<number[]>(assignedCustomerIds || []);

  const isSuperAdmin = category?.name
    ? category.name.toUpperCase().includes("SUPER_ADMIN") ||
      category.name.toUpperCase().includes("SUPER")
    : false;

  // Detectar modificações em cada seção
  const basicModified = useMemo(() => {
    return (
      name !== originalBasic.name ||
      description !== originalBasic.description ||
      active !== originalBasic.active ||
      restrictCustomerData !== originalBasic.restrictCustomerData
    );
  }, [name, description, active, restrictCustomerData, originalBasic]);

  const permissionsModified = useMemo(() => {
    if (selectedFunctionIds.length !== originalFunctionIds.length) return true;
    return !selectedFunctionIds.every((id) => originalFunctionIds.includes(id));
  }, [selectedFunctionIds, originalFunctionIds]);

  const isosModified = useMemo(() => {
    if (selectedCustomerIds.length !== originalCustomerIds.length) return true;
    return !selectedCustomerIds.every((id) => originalCustomerIds.includes(id));
  }, [selectedCustomerIds, originalCustomerIds]);

  // Atualizar status das seções quando há modificações
  const getSectionStatus = (section: string): SectionStatus => {
    if (section === "basic" && basicModified) return "modified";
    if (section === "permissions" && permissionsModified) return "modified";
    if (section === "isos" && isosModified) return "modified";
    return sections[section]?.status || "pending";
  };

  const toggleSection = (sectionKey: string) => {
    setSections((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        isOpen: !prev[sectionKey].isOpen,
      },
    }));
  };

  const handleToggleFunction = (functionId: number) => {
    setSelectedFunctionIds((prev) =>
      prev.includes(functionId)
        ? prev.filter((id) => id !== functionId)
        : [...prev, functionId]
    );
  };

  const handleSelectGroup = (group: string) => {
    const groupFunctions = functions.grouped[group] || [];
    const groupFunctionIds = groupFunctions.map((f) => f.id);
    const allSelected = groupFunctionIds.every((id) =>
      selectedFunctionIds.includes(id)
    );

    if (allSelected) {
      // Desmarcar todas
      setSelectedFunctionIds((prev) =>
        prev.filter((id) => !groupFunctionIds.includes(id))
      );
    } else {
      // Marcar todas
      setSelectedFunctionIds((prev) => {
        const newIds = [...prev];
        groupFunctionIds.forEach((id) => {
          if (!newIds.includes(id)) {
            newIds.push(id);
          }
        });
        return newIds;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Nome da categoria é obrigatório");
      return;
    }

    startTransition(async () => {
      try {
        let categoryId: number;

        if (category?.id) {
          // Atualizar categoria existente
          const updateData: any = {
            name: name.trim(),
            description: description.trim() || undefined,
            restrictCustomerData,
            active,
          };

          // Se não é Super Admin, pode atualizar nome
          if (!isSuperAdmin) {
            updateData.name = name.trim();
          }

          await updateCategory(category.id, updateData);
          categoryId = category.id;
        } else {
          // Criar nova categoria
          const result = await createCategory({
            name: name.trim(),
            description: description.trim() || undefined,
            restrictCustomerData,
            isSalesAgent: false,
          });
          categoryId = result.id;
        }

        // Atualizar permissões
        await updateCategoryPermissions(categoryId, selectedFunctionIds);

        // Atualizar ISOs da categoria
        await updateCategoryCustomers(categoryId, selectedCustomerIds);

        // Marcar todas as seções como salvas
        setSections({
          basic: { status: "saved", isOpen: true },
          permissions: { status: "saved", isOpen: false },
          isos: { status: "saved", isOpen: false },
        });

        toast.success(
          category?.id
            ? "Categoria atualizada com sucesso"
            : "Categoria criada com sucesso"
        );
        router.push("/config/categories");
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || "Erro ao salvar categoria");
      }
    });
  };

  // Componente para indicador de status da seção
  const SectionStatusIndicator = ({ status }: { status: SectionStatus }) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-500/20 border-yellow-500/50",
        icon: null,
        label: "Pendente",
      },
      modified: {
        color: "bg-blue-500/20 border-blue-500/50",
        icon: <AlertCircle className="h-4 w-4 text-blue-500" />,
        label: "Modificado",
      },
      saved: {
        color: "bg-green-500/20 border-green-500/50",
        icon: <Check className="h-4 w-4 text-green-500" />,
        label: "Salvo",
      },
      error: {
        color: "bg-red-500/20 border-red-500/50",
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        label: "Erro",
      },
    };

    const config = statusConfig[status];

    return (
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border",
          config.color
        )}
      >
        {config.icon}
        <span className="text-muted-foreground">{config.label}</span>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Seção 1: Informações Básicas */}
      <Card
        className={cn(
          "transition-all duration-300",
          getSectionStatus("basic") === "saved" && "border-green-500/30",
          getSectionStatus("basic") === "modified" && "border-blue-500/30"
        )}
      >
        <Collapsible open={sections.basic.isOpen} onOpenChange={() => toggleSection("basic")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {sections.basic.isOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <CardTitle className="text-lg">Informações Básicas</CardTitle>
                    <CardDescription>
                      Nome, descrição e configurações gerais da categoria
                    </CardDescription>
                  </div>
                </div>
                <SectionStatusIndicator status={getSectionStatus("basic")} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nome <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Gerente de Franquia"
                    required
                    disabled={isSuperAdmin || isPending}
                  />
                  {isSuperAdmin && (
                    <p className="text-sm text-muted-foreground">
                      O nome da categoria Super Admin não pode ser alterado.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o papel e responsabilidades"
                    rows={2}
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="restrictCustomerData"
                    checked={restrictCustomerData}
                    onCheckedChange={(checked) =>
                      setRestrictCustomerData(checked === true)
                    }
                    disabled={isPending}
                  />
                  <Label
                    htmlFor="restrictCustomerData"
                    className="cursor-pointer font-normal text-sm"
                  >
                    Restringir dados sensíveis (CPF, CNPJ, email, telefone)
                  </Label>
                </div>

                {category?.id && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="active"
                      checked={active}
                      onCheckedChange={(checked) => setActive(checked === true)}
                      disabled={isPending}
                    />
                    <Label htmlFor="active" className="cursor-pointer font-normal text-sm">
                      Categoria ativa
                    </Label>
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Seção 2: Permissões */}
      <Card
        className={cn(
          "transition-all duration-300",
          getSectionStatus("permissions") === "saved" && "border-green-500/30",
          getSectionStatus("permissions") === "modified" && "border-blue-500/30"
        )}
      >
        <Collapsible open={sections.permissions.isOpen} onOpenChange={() => toggleSection("permissions")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {sections.permissions.isOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <CardTitle className="text-lg">
                      Permissões
                      {selectedFunctionIds.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({selectedFunctionIds.length} selecionadas)
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Funções e acessos que usuários desta categoria terão
                    </CardDescription>
                  </div>
                </div>
                <SectionStatusIndicator status={getSectionStatus("permissions")} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {functions.groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma função (permissão) disponível no sistema.
                </p>
              ) : (
                <div className="space-y-4">
                  {functions.groups.map((group) => {
                    const groupFunctions = functions.grouped[group] || [];
                    const groupFunctionIds = groupFunctions.map((f) => f.id);
                    const allSelected = groupFunctionIds.every((id) =>
                      selectedFunctionIds.includes(id)
                    );
                    const someSelected = groupFunctionIds.some((id) =>
                      selectedFunctionIds.includes(id)
                    );
                    const selectedCount = groupFunctionIds.filter((id) =>
                      selectedFunctionIds.includes(id)
                    ).length;

                    return (
                      <div
                        key={group}
                        className={cn(
                          "p-3 rounded-lg border transition-colors",
                          someSelected ? "bg-accent/30 border-accent" : "bg-card"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`group-${group}`}
                              checked={allSelected}
                              onCheckedChange={() => handleSelectGroup(group)}
                              disabled={isPending}
                            />
                            <Label
                              htmlFor={`group-${group}`}
                              className="font-semibold cursor-pointer"
                            >
                              {group}
                            </Label>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {selectedCount}/{groupFunctions.length}
                          </span>
                        </div>

                        <div className="ml-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {groupFunctions.map((func) => (
                            <div
                              key={func.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`function-${func.id}`}
                                checked={selectedFunctionIds.includes(func.id)}
                                onCheckedChange={() => handleToggleFunction(func.id)}
                                disabled={isPending}
                              />
                              <Label
                                htmlFor={`function-${func.id}`}
                                className="cursor-pointer font-normal text-sm"
                              >
                                {func.name || "Sem nome"}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Seção 3: ISOs Herdados */}
      <Card
        className={cn(
          "transition-all duration-300",
          getSectionStatus("isos") === "saved" && "border-green-500/30",
          getSectionStatus("isos") === "modified" && "border-blue-500/30"
        )}
      >
        <Collapsible open={sections.isos.isOpen} onOpenChange={() => toggleSection("isos")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {sections.isos.isOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <CardTitle className="text-lg">
                      ISOs Herdados
                      {selectedCustomerIds.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({selectedCustomerIds.length} selecionados)
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      ISOs que serão automaticamente atribuídos aos usuários desta categoria
                    </CardDescription>
                  </div>
                </div>
                <SectionStatusIndicator status={getSectionStatus("isos")} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">
              {customers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum ISO disponível. Os ISOs devem ser cadastrados antes de serem atribuídos a categorias.
                </p>
              ) : (
                <AdminCustomerAssignment
                  customers={customers}
                  selectedCustomerIds={selectedCustomerIds}
                  onSelectionChange={(customerIds) => {
                    setSelectedCustomerIds(customerIds);
                  }}
                />
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Botões de ação */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {(basicModified || permissionsModified || isosModified) && (
            <span className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              Existem alterações não salvas
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? category?.id
                ? "Salvando..."
                : "Criando..."
              : category?.id
              ? "Salvar Alterações"
              : "Criar Categoria"}
          </Button>
        </div>
      </div>
    </form>
  );
}
