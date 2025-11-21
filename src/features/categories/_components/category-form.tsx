"use client";

import { useState, useTransition } from "react";
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

export function CategoryForm({
  category,
  functions,
  assignedFunctionIds = [],
  customers = [],
  assignedCustomerIds = [],
}: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [active, setActive] = useState(category?.active ?? true);
  const [restrictCustomerData, setRestrictCustomerData] = useState(
    category?.restrictCustomerData || false
  );
  const [selectedFunctionIds, setSelectedFunctionIds] = useState<number[]>(
    assignedFunctionIds || []
  );
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>(
    assignedCustomerIds || []
  );

  const isSuperAdmin = category?.name
    ? category.name.toUpperCase().includes("SUPER_ADMIN") ||
      category.name.toUpperCase().includes("SUPER")
    : false;

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Categoria</CardTitle>
          <CardDescription>
            Configure os detalhes básicos da categoria de usuários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              placeholder="Descreva o papel e responsabilidades desta categoria"
              rows={3}
              disabled={isPending}
            />
          </div>

          <div className="space-y-4">
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
                className="cursor-pointer font-normal"
              >
                Restringir acesso a dados sensíveis (CPF, CNPJ, email, telefone)
                <p className="text-xs text-muted-foreground mt-1">
                  Quando ativado, usuários desta categoria terão dados sensíveis
                  mascarados. Nome fantasia, razão social, cidade e estado sempre
                  permanecerão visíveis.
                </p>
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
                <Label htmlFor="active" className="cursor-pointer font-normal">
                  Categoria ativa
                </Label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ISOs da Categoria</CardTitle>
          <CardDescription>
            Selecione os ISOs que serão herdados automaticamente por todos os usuários desta categoria.
            Isso é útil para criar redes de franquias ou grupos de ISOs pré-configurados.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissões</CardTitle>
          <CardDescription>
            Selecione as permissões que serão atribuídas aos usuários desta
            categoria. As permissões serão aplicadas aos ISOs que o usuário tiver acesso
            (herdados da categoria + atribuídos individualmente).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {functions.groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma função (permissão) disponível no sistema.
            </p>
          ) : (
            functions.groups.map((group) => {
              const groupFunctions = functions.grouped[group] || [];
              const groupFunctionIds = groupFunctions.map((f) => f.id);
              const allSelected = groupFunctionIds.every((id) =>
                selectedFunctionIds.includes(id)
              );
              const someSelected = groupFunctionIds.some((id) =>
                selectedFunctionIds.includes(id)
              );

              return (
                <div key={group} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`group-${group}`}
                        checked={allSelected}
                        onCheckedChange={() => handleSelectGroup(group)}
                        disabled={isPending}
                      />
                      <Label
                        htmlFor={`group-${group}`}
                        className="text-base font-semibold cursor-pointer"
                      >
                        {group}
                      </Label>
                    </div>
                    {someSelected && (
                      <span className="text-xs text-muted-foreground">
                        {groupFunctionIds.filter((id) =>
                          selectedFunctionIds.includes(id)
                        ).length}{" "}
                        de {groupFunctions.length} selecionadas
                      </span>
                    )}
                  </div>

                  <div className="ml-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
                          className="cursor-pointer font-normal"
                        >
                          {func.name || "Sem nome"}
                        </Label>
                      </div>
                    ))}
                  </div>

                  <Separator />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
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
    </form>
  );
}

