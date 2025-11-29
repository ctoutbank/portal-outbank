"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronRight, ArrowUpDown, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { MccWithGroup } from "@/features/mcc/server/types";

interface MccListProps {
  mccs: MccWithGroup[];
  totalCount: number;
  sortField: string;
  sortOrder: "asc" | "desc";
}

export default function MccList({
  mccs,
  totalCount,
  sortField,
  sortOrder,
}: MccListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams?.get("mccSearch") || "";
  const [searchValue, setSearchValue] = useState(currentSearch);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  if (mccs.length === 0) {
    return (
      <div className="w-full p-4 text-center border border-[rgba(255,255,255,0.1)] rounded-[6px] bg-[#1D1D1D]">
        <p className="text-[#5C5C5C] text-sm font-normal">Nenhum MCC encontrado</p>
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
            placeholder="Buscar MCC por código ou descrição..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 h-[42px] bg-[#424242] border border-[#353535] rounded-[6px] text-[#E0E0E0] placeholder:text-[#E0E0E0] focus-visible:ring-2 focus-visible:ring-[#555555] focus-visible:border-[#555555]"
          />
        </div>
      </div>

      {/* Header com botões de ordenação */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
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

      {/* Lista de MCCs */}
      <div className="space-y-2">
        {mccs.map((mcc) => (
          <Card
            key={mcc.id}
            className="border border-[rgba(255,255,255,0.1)] rounded-[6px] shadow-sm bg-[#1D1D1D]"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 sm:gap-6 flex-wrap">
                <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0 flex-wrap">
                  {/* Código MCC */}
                  <div className="text-[22px] font-semibold text-[#FFFFFF]">
                    {mcc.code}
                  </div>

                  {/* Grupo MCC */}
                  <div className="text-sm text-[#E0E0E0] flex items-center gap-1">
                    <span className="text-[#5C5C5C] font-normal">Grupo:</span>
                    <span className="font-normal">{mcc.groupDescription || "-"}</span>
                  </div>

                  {/* Descrição */}
                  <div className="text-sm text-[#E0E0E0] font-normal flex-1 min-w-0 truncate">
                    {mcc.description || "-"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

