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
      <div className="w-full p-7 text-center border border-[rgba(255,255,255,0.1)] rounded-[6px] bg-[#1D1D1D]">
        <p className="text-[#5C5C5C] text-sm font-normal">Nenhuma categoria encontrada</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden bg-[#161616]">
      {/* Campo de busca */}
      <div className="mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#616161] z-10" />
          <Input
            type="text"
            placeholder="Buscar por CNAE, MCC ou nome..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 h-[42px] bg-[#424242] border border-[#353535] rounded-[6px] text-[#E0E0E0] placeholder:text-[#E0E0E0] focus-visible:ring-2 focus-visible:ring-[#555555] focus-visible:border-[#555555]"
          />
        </div>
      </div>

      {/* Header com botões de ordenação */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button
          onClick={() => handleSort("name")}
          className="flex items-center gap-2 px-4 py-2 h-[42px] border border-[#2E2E2E] bg-[#212121] hover:bg-[#2E2E2E] transition-colors rounded-[6px] text-sm font-normal text-[#E0E0E0]"
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
            <Card className="border border-[rgba(255,255,255,0.1)] rounded-[6px] shadow-sm hover:shadow-md transition-shadow cursor-pointer group bg-[#1D1D1D]">
              <CardContent className="p-7">
                <div className="flex items-center justify-between gap-4 sm:gap-6 flex-wrap">
                  <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0 flex-wrap">
                    {/* CNAE */}
                    <div className="text-[22px] font-semibold text-[#FFFFFF]">
                      {category.cnae || "-"}
                    </div>

                    {/* MCC com label */}
                    <div className="text-sm text-[#E0E0E0] flex items-center gap-1">
                      <span className="text-[#5C5C5C] font-normal">MCC:</span>
                      <span className="font-normal">{category.mcc || "-"}</span>
                    </div>

                    {/* Nome - sempre flexível */}
                    <div className="text-sm text-[#E0E0E0] font-normal flex-1 min-w-0 truncate">
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
                        className="rounded-[6px]"
                      >
                        {category.active ? "ATIVO" : "INATIVO"}
                      </Badge>
                    </div>
                  </div>

                  {/* Indicador de clique */}
                  <ChevronRight className="h-4 w-4 text-[#616161] group-hover:text-[#E0E0E0] group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
