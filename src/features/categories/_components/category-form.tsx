"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  createCategory,
  updateCategory,
  updateCategoryMenus,
  updateCategoryLocked,
} from "@/features/categories/server/categories";
import {
  updateCategoryPermissions,
} from "@/features/categories/server/permissions";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Check, AlertCircle, LayoutDashboard, Users, Briefcase, Store, DollarSign, BarChart, Calendar, Receipt, Truck, Percent, Shield, Settings, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Lista de todos os menus do sistema organizados por seções
type MenuItemType = {
  id: string;
  title: string;
  url: string;
  icon: LucideIcon;
  description: string;
};

type MenuSectionType = {
  section: string;
  items: MenuItemType[];
};

const MENU_SECTIONS: MenuSectionType[] = [
  {
    section: "Visão Geral",
    items: [
      { id: "dashboard", title: "Dashboard", url: "/", icon: LayoutDashboard, description: "Painel principal com visão geral" },
    ],
  },
  {
    section: "Cadastros",
    items: [
      { id: "isos", title: "ISOs", url: "/customers", icon: Users, description: "Gerenciamento de ISOs" },
      { id: "estabelecimentos", title: "Estabelecimentos", url: "/merchants", icon: Store, description: "Gerenciamento de estabelecimentos" },
    ],
  },
  {
    section: "Operações",
    items: [
      { id: "vendas", title: "Vendas", url: "/transactions", icon: DollarSign, description: "Consulta de vendas/transações" },
      { id: "analytics", title: "Analytics", url: "/analytics", icon: BarChart, description: "Relatórios e análises" },
      { id: "fechamento", title: "Fechamento", url: "/fechamento", icon: Calendar, description: "Fechamento mensal" },
      { id: "repasses", title: "Repasses", url: "/admin/repasses", icon: Receipt, description: "Gestão de repasses" },
    ],
  },
  {
    section: "Administração",
    items: [
      { id: "fornecedores", title: "Fornecedores", url: "/supplier", icon: Truck, description: "Gestão de fornecedores" },
      { id: "margens", title: "Margens", url: "/margens", icon: Percent, description: "Configuração de margens" },
      { id: "cnae_mcc", title: "CNAE/MCC", url: "/categories", icon: Briefcase, description: "Cadastro de CNAE e MCC" },
      { id: "lgpd", title: "LGPD", url: "/consent/modules", icon: Shield, description: "Gestão de consentimentos" },
      { id: "config", title: "Configurações", url: "/config", icon: Settings, description: "Configurações do sistema" },
    ],
  },
];

// Lista plana de todos os menus para compatibilidade
const SYSTEM_MENUS = MENU_SECTIONS.flatMap((section) => section.items);

// Mapeamento bidirecional entre grupos de permissões e menus
// Chave: nome do grupo de permissão (EXATAMENTE como está no banco), Valor: id do menu correspondente
const PERMISSION_TO_MENU_MAP: Record<string, string> = {
  // Grupos existentes no banco
  "Dashboard": "dashboard",
  "Estabelecimentos": "estabelecimentos",
  "Vendas": "vendas",
  "Fechamento": "fechamento",
  "Categorias": "config",
  "Configurar Perfis e Usuários": "config",
  // Grupos do Portal Outbank (podem ser criados via createPortalFunctionsIfNotExists)
  "ISOs": "isos",
  "CNAE/MCC": "cnae_mcc",
  "Analytics": "analytics",
  "Repasses": "repasses",
  "Fornecedores": "fornecedores",
  "Margens": "margens",
  "Consentimento LGPD": "lgpd",
  "Configurações": "config",
  "Usuários": "config",
};

// Mapeamento reverso: menu -> grupos de permissões
// Inclui tanto grupos legados quanto grupos do Portal Outbank
const MENU_TO_PERMISSION_GROUPS: Record<string, string[]> = {
  "dashboard": ["Dashboard"],
  "isos": ["ISOs"],
  "cnae_mcc": ["CNAE/MCC"],
  "estabelecimentos": ["Estabelecimentos"],
  "vendas": ["Vendas"],
  "analytics": ["Analytics"],
  "fechamento": ["Fechamento"],
  "repasses": ["Repasses"],
  "fornecedores": ["Fornecedores"],
  "margens": ["Margens"],
  "lgpd": ["Consentimento LGPD"],
  "config": ["Configurar Perfis e Usuários", "Categorias", "Configurações", "Usuários"],
};

// Palavras-chave de permissões baseline (acesso básico/leitura)
// Ordem de prioridade: primeiro que encontrar será usado
const BASELINE_KEYWORDS = ["Listar", "Visualizar", "Acessar", "Ver"];

type CategoryData = {
  id?: number;
  name: string | null;
  description: string | null;
  active: boolean | null;
  restrictCustomerData: boolean | null;
  categoryType?: string | null;
  locked?: boolean | null;
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
  assignedMenuIds?: string[];
  isLocked?: boolean;
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
  assignedMenuIds = [],
  isLocked = false,
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
  const [categoryType, setCategoryType] = useState(category?.categoryType || "OUTRO");
  const [locked, setLocked] = useState(isLocked);
  
  // Permissões
  const [selectedFunctionIds, setSelectedFunctionIds] = useState<number[]>(
    assignedFunctionIds || []
  );

  // Menus autorizados
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>(
    assignedMenuIds || []
  );

  // Estado das seções (para indicadores visuais)
  const [sections, setSections] = useState<Record<string, SectionState>>({
    basic: { status: category?.id ? "saved" : "pending", isOpen: true },
    permissions: { status: assignedFunctionIds.length > 0 ? "saved" : "pending", isOpen: false },
    menus: { status: assignedMenuIds.length > 0 ? "saved" : "pending", isOpen: false },
  });

  // Estados salvos originais (para detectar modificações)
  const [originalBasic] = useState({
    name: category?.name || "",
    description: category?.description || "",
    active: category?.active ?? true,
    restrictCustomerData: category?.restrictCustomerData || false,
    categoryType: category?.categoryType || "OUTRO",
  });
  const [originalFunctionIds] = useState<number[]>(assignedFunctionIds || []);
  const [originalMenuIds] = useState<string[]>(assignedMenuIds || []);

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
      restrictCustomerData !== originalBasic.restrictCustomerData ||
      categoryType !== originalBasic.categoryType
    );
  }, [name, description, active, restrictCustomerData, categoryType, originalBasic]);

  const permissionsModified = useMemo(() => {
    if (selectedFunctionIds.length !== originalFunctionIds.length) return true;
    return !selectedFunctionIds.every((id) => originalFunctionIds.includes(id));
  }, [selectedFunctionIds, originalFunctionIds]);

  const menusModified = useMemo(() => {
    if (selectedMenuIds.length !== originalMenuIds.length) return true;
    return !selectedMenuIds.every((id) => originalMenuIds.includes(id));
  }, [selectedMenuIds, originalMenuIds]);

  // Atualizar status das seções quando há modificações
  const getSectionStatus = (section: string): SectionStatus => {
    if (section === "basic" && basicModified) return "modified";
    if (section === "permissions" && permissionsModified) return "modified";
    if (section === "menus" && menusModified) return "modified";
    return sections[section]?.status || "pending";
  };

  // Função auxiliar para obter o grupo de uma função pelo ID
  const getFunctionGroupById = (functionId: number): string | null => {
    const func = functions.all.find((f) => f.id === functionId);
    return func?.group || null;
  };

  // Sincroniza menu quando permissão é adicionada
  const syncMenuFromPermission = (group: string, isAdding: boolean) => {
    const menuId = PERMISSION_TO_MENU_MAP[group];
    if (!menuId) return;
    
    if (isAdding && !selectedMenuIds.includes(menuId)) {
      setSelectedMenuIds((prev) => [...prev, menuId]);
    }
    // Nota: Não removemos o menu automaticamente ao desmarcar permissão
    // porque outras permissões podem ainda usar esse menu
  };

  // Sincroniza permissões quando menu é adicionado
  const syncPermissionsFromMenu = (menuId: string, isAdding: boolean) => {
    const permissionGroups = MENU_TO_PERMISSION_GROUPS[menuId];
    if (!permissionGroups || permissionGroups.length === 0) return;
    
    if (isAdding) {
      // Adiciona apenas a permissão baseline (acesso básico/leitura) de cada grupo relacionado
      permissionGroups.forEach((group) => {
        const groupFunctions = functions.grouped[group] || [];
        if (groupFunctions.length === 0) return;
        
        // Busca a permissão baseline usando palavras-chave de leitura
        // Tenta cada palavra-chave na ordem de prioridade
        let baselineFunc = null;
        for (const keyword of BASELINE_KEYWORDS) {
          baselineFunc = groupFunctions.find((f) => 
            f.name && f.name.toLowerCase().includes(keyword.toLowerCase())
          );
          if (baselineFunc) break;
        }
        
        // Se não encontrou por palavra-chave, não adiciona nada
        // (evita adicionar permissão errada)
        if (baselineFunc && !selectedFunctionIds.includes(baselineFunc.id)) {
          setSelectedFunctionIds((prev) => [...prev, baselineFunc!.id]);
        }
      });
    }
    // Nota: Não removemos permissões automaticamente ao desmarcar menu
  };

  const handleToggleMenu = (menuId: string) => {
    const isAdding = !selectedMenuIds.includes(menuId);
    
    setSelectedMenuIds((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
    
    // Sincronizar permissões correspondentes
    syncPermissionsFromMenu(menuId, isAdding);
  };

  const handleSelectAllMenus = () => {
    const allMenuIds = SYSTEM_MENUS.map((m) => m.id);
    const allSelected = allMenuIds.every((id) => selectedMenuIds.includes(id));
    if (allSelected) {
      setSelectedMenuIds([]);
    } else {
      setSelectedMenuIds(allMenuIds);
      // Sincronizar todas as permissões básicas
      allMenuIds.forEach((menuId) => syncPermissionsFromMenu(menuId, true));
    }
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
    const isAdding = !selectedFunctionIds.includes(functionId);
    const group = getFunctionGroupById(functionId);
    
    setSelectedFunctionIds((prev) =>
      prev.includes(functionId)
        ? prev.filter((id) => id !== functionId)
        : [...prev, functionId]
    );
    
    // Sincronizar menu correspondente
    if (group && isAdding) {
      syncMenuFromPermission(group, true);
    }
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
      // Sincronizar menu correspondente
      syncMenuFromPermission(group, true);
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
            categoryType,
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
            categoryType,
          });
          categoryId = result.id;
        }

        // Atualizar permissões
        await updateCategoryPermissions(categoryId, selectedFunctionIds);

        // Atualizar menus autorizados
        await updateCategoryMenus(categoryId, selectedMenuIds);

        // Marcar todas as seções como salvas
        setSections({
          basic: { status: "saved", isOpen: true },
          permissions: { status: "saved", isOpen: false },
          menus: { status: "saved", isOpen: false },
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

              {/* Tipo de Categoria - exibição apenas para categorias existentes CORE/Executivo */}
              {category?.id && (category.categoryType === "CORE" || category.categoryType === "EXECUTIVO") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Categoria</Label>
                    <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted text-muted-foreground">
                      <span className="font-medium">
                        {category.categoryType === "CORE" ? "Core" : "Executivo"}
                      </span>
                      <span className="text-xs">
                        (categoria fixa do sistema)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Categorias CORE e Executivo são únicas e não podem ser alteradas
                    </p>
                  </div>
                </div>
              )}

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
                {category?.id && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="locked"
                      checked={locked}
                      onCheckedChange={async (checked) => {
                        const newLocked = checked === true;
                        const previousValue = locked;
                        
                        // Atualização otimista
                        setLocked(newLocked);
                        
                        // Salvar no servidor
                        if (category?.id) {
                          try {
                            await updateCategoryLocked(category.id!, newLocked);
                            toast.success(newLocked ? "Categoria bloqueada" : "Categoria desbloqueada");
                          } catch (error: any) {
                            // Reverter para o valor anterior em caso de erro
                            setLocked(previousValue);
                            toast.error(error.message || "Erro ao atualizar bloqueio");
                          }
                        }
                      }}
                      disabled={isPending}
                    />
                    <Label htmlFor="locked" className="cursor-pointer font-normal text-sm">
                      Bloquear exclusão desta categoria
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Ordenar grupos do menor para o maior número de funcionalidades */}
                  {[...functions.groups].sort((a, b) => {
                    const countA = (functions.grouped[a] || []).length;
                    const countB = (functions.grouped[b] || []).length;
                    return countA - countB;
                  }).map((group) => {
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

                    // Determinar tamanho do card baseado no número de funcionalidades
                    // Grupos com >6 funcionalidades ocupam 2 colunas, >12 ocupam 4 colunas
                    const colSpan = groupFunctions.length > 12 
                      ? "md:col-span-2 lg:col-span-4" 
                      : groupFunctions.length > 6 
                        ? "md:col-span-2 lg:col-span-2" 
                        : "";

                    return (
                      <div
                        key={group}
                        className={cn(
                          "p-3 rounded-lg border transition-colors",
                          someSelected ? "bg-accent/30 border-accent" : "bg-[#121212] border-[#252525]",
                          colSpan
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
                              className="font-semibold cursor-pointer text-xs"
                            >
                              {group}
                            </Label>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {selectedCount}/{groupFunctions.length}
                          </span>
                        </div>

                        <div className={cn(
                          "ml-6 grid gap-1.5",
                          groupFunctions.length > 12 
                            ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" 
                            : groupFunctions.length > 6 
                              ? "grid-cols-2" 
                              : "grid-cols-1"
                        )}>
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
                                className="cursor-pointer font-normal text-[10px] leading-tight text-[#808080]"
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

      {/* Seção 3: Menus Autorizados */}
      <Card
        className={cn(
          "transition-all duration-300",
          getSectionStatus("menus") === "saved" && "border-green-500/30",
          getSectionStatus("menus") === "modified" && "border-blue-500/30"
        )}
      >
        <Collapsible open={sections.menus?.isOpen} onOpenChange={() => toggleSection("menus")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {sections.menus?.isOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <CardTitle className="text-lg">
                      Menus Autorizados
                      {selectedMenuIds.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({selectedMenuIds.length}/{SYSTEM_MENUS.length} selecionados)
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Itens de menu que usuários desta categoria terão acesso
                    </CardDescription>
                  </div>
                </div>
                <SectionStatusIndicator status={getSectionStatus("menus")} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {/* Botão selecionar/deselecionar todos */}
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all-menus"
                    checked={selectedMenuIds.length === SYSTEM_MENUS.length}
                    onCheckedChange={handleSelectAllMenus}
                    disabled={isPending}
                  />
                  <Label
                    htmlFor="select-all-menus"
                    className="font-semibold cursor-pointer text-sm"
                  >
                    Selecionar Todos
                  </Label>
                </div>
              </div>

              {/* Menus agrupados por seção */}
              <div className="space-y-6">
                {MENU_SECTIONS.map((section) => (
                  <div key={section.section}>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      {section.section}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {section.items.map((menu) => {
                        const MenuIcon = menu.icon;
                        const isSelected = selectedMenuIds.includes(menu.id);
                        
                        return (
                          <div
                            key={menu.id}
                            className={cn(
                              "p-3 rounded-lg border transition-colors cursor-pointer",
                              isSelected ? "bg-accent/30 border-accent" : "bg-[#121212] border-[#252525] hover:bg-accent/10"
                            )}
                            onClick={() => handleToggleMenu(menu.id)}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id={`menu-${menu.id}`}
                                checked={isSelected}
                                onCheckedChange={() => handleToggleMenu(menu.id)}
                                disabled={isPending}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <MenuIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <Label
                                    htmlFor={`menu-${menu.id}`}
                                    className="font-medium cursor-pointer text-sm truncate"
                                  >
                                    {menu.title}
                                  </Label>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {menu.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Botões de ação */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {(basicModified || permissionsModified || menusModified) && (
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
