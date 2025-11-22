"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModuleBadge } from "@/components/ui/module-badge";
import { Input } from "@/components/ui/input";
import { CategoryList } from "../server/category";
import { ChevronRight, ArrowUpDown, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";

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
  const currentSearch = searchParams?.get("search") || "";
  const [searchValue, setSearchValue] = useState(currentSearch);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Atualizar valor do input quando searchParams mudar externamente
  useEffect(() => {
    const searchParam = searchParams?.get("search") || "";
    if (searchParam !== searchValue) {
      setSearchValue(searchParam);
    }
  }, [searchParams]);

  // Debounce para busca
  const handleSearchChange = (value: string) => {
    setSearchValue(value);

    // Limpar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Novo timer para debounce
    debounceTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      
      if (value.trim()) {
        params.set("search", value.trim());
        params.set("page", "1"); // Reset para primeira página ao buscar
      } else {
        params.delete("search");
        params.set("page", "1");
      }

      router.push(`/categories?${params.toString()}`);
    }, 300);
  };

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
      {/* Campo de busca */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por CNAE, MCC ou nome..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 rounded-none border-border"
          />
        </div>
      </div>

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

      {/* Lista horizontal de cards */}
      <div className="space-y-2">
        {Categories.categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.id}`}
            className="block"
          >
            <Card className="border border-border rounded-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                    {/* CNAE */}
                    <div className="font-bold text-lg min-w-[100px] text-foreground">
                      {category.cnae || "-"}
                    </div>

                    {/* MCC */}
                    <div className="text-sm font-medium text-foreground min-w-[80px]">
                      {category.mcc || "-"}
                    </div>

                    {/* Nome */}
                    <div className="text-sm text-foreground flex-1 min-w-0 truncate">
                      {category.name || "-"}
                    </div>

                    {/* Badges - Status e Módulos */}
                    <div className="flex items-center gap-2 flex-shrink-0">
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
                  </div>

                  {/* Indicador de clique */}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
