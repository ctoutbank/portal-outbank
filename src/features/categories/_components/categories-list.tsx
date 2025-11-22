"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModuleBadge } from "@/components/ui/module-badge";
import { CategoryList } from "../server/category";
import { ChevronRight, ArrowUpDown } from "lucide-react";

interface CategorylistProps {
  Categories: CategoryList;
  sortField: string;
  sortOrder: "asc" | "desc";
}

export default function Categorylist({
  Categories,
  sortField,
  sortOrder,
}: CategorylistProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSort = (field: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");

    if (field === sortField) {
      params.set("sortOrder", sortOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sortField", field);
      params.set("sortOrder", "asc");
    }

    router.push(`/categories?${params.toString()}`);
  };

  if (Categories.categories.length === 0) {
    return (
      <div className="w-full p-8 text-center border border-border bg-card">
        <p className="text-muted-foreground">Nenhuma categoria encontrada</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden">
      {/* Header com botões de ordenação */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => handleSort("name")}
          className="flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-muted transition-colors rounded-none text-sm font-medium"
        >
          Ordenar por CNAE
          <ArrowUpDown className="h-4 w-4" />
          {sortField === "name" && (
            <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
          )}
        </button>
      </div>

      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Categories.categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.id}`}
            className="block h-full"
          >
            <Card className="h-full border border-border rounded-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-4 h-full flex flex-col">
                {/* CNAE em destaque */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    CNAE
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {category.cnae || "-"}
                  </div>
                </div>

                {/* MCC */}
                <div className="mb-3">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    MCC
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {category.mcc || "-"}
                  </div>
                </div>

                {/* Nome da categoria */}
                <div className="mb-4 flex-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Nome
                  </div>
                  <div className="text-sm text-foreground line-clamp-2">
                    {category.name || "-"}
                  </div>
                </div>

                {/* Badges e informações */}
                <div className="mt-auto space-y-2 pt-3 border-t border-border">
                  <div className="flex items-center justify-between gap-2">
                    <ModuleBadge
                      moduleSlug="adq"
                      showIcon={true}
                      variant="outline"
                    />
                    <Badge
                      variant={category.active ? "success" : "destructive"}
                      className="rounded-none"
                    >
                      {category.active ? "ATIVO" : "INATIVO"}
                    </Badge>
                  </div>

                  {/* Valor Cartão Presente */}
                  {category.anticipation_risk_factor_cnp !== null && (
                    <div className="pt-2 border-t border-border">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Cartão Presente
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {category.anticipation_risk_factor_cnp}%
                      </div>
                    </div>
                  )}

                  {/* Indicador de clique */}
                  <div className="flex items-center justify-end pt-2 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                    Ver detalhes
                    <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
