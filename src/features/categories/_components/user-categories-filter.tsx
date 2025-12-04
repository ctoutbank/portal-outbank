"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FilterIcon } from "lucide-react";

type UserCategoriesFilterProps = {
  nameIn?: string;
  activeIn?: boolean | string;
};

export function UserCategoriesFilter({
  nameIn,
  activeIn,
}: UserCategoriesFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  
  const [name, setName] = useState(nameIn || "");
  const [active, setActive] = useState(activeIn?.toString() || "");

  // Sincronizar estados com searchParams quando a página carregar
  useEffect(() => {
    if (searchParams) {
      const nameParam = searchParams.get("name") || "";
      const activeParam = searchParams.get("active") || "";

      if (nameParam !== name) setName(nameParam);
      if (activeParam !== active) setActive(activeParam);
    }
  }, [searchParams]);

  const handleFilter = () => {
    try {
      const params = new URLSearchParams(searchParams?.toString() || "");

      if (name && name.trim()) {
        params.set("name", name.trim());
      } else {
        params.delete("name");
      }

      if (active && active.trim()) {
        params.set("active", active.trim());
      } else {
        params.delete("active");
      }

      params.set("page", "1");
      router.replace(`/config/categories?${params.toString()}`);
      setIsFiltersVisible(false);
    } catch (error) {
      console.error("Erro ao aplicar filtros:", error);
    }
  };

  const handleClearFilters = () => {
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      
      router.replace(`/config/categories?${params.toString()}`);
      
      setName("");
      setActive("");
      setIsFiltersVisible(false);
    } catch (error) {
      console.error("Erro ao limpar filtros:", error);
    }
  };

  const activeFiltersCount =
    (nameIn ? 1 : 0) +
    (activeIn !== undefined ? 1 : 0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleFilter();
    }
  };

  return (
    <div className="relative z-50">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => setIsFiltersVisible(!isFiltersVisible)}
          className="flex items-center gap-2"
        >
          <FilterIcon className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount}</Badge>
          )}
        </Button>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            onClick={handleClearFilters}
            className="text-sm text-muted-foreground"
          >
            Limpar Filtros
          </Button>
        )}
      </div>
      
      {isFiltersVisible && (
        <div
          className="absolute left-0 mt-2 bg-background border rounded-lg p-4 shadow-md w-[600px] z-50"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">Nome</Label>
                <Input
                  placeholder="Nome da categoria"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-9"
                />
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Status</Label>
                <Select 
                  value={active || "all"} 
                  onValueChange={(value) => {
                    setActive(value === "all" ? "" : value);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 mt-4 border-t">
            <Button onClick={handleFilter} className="flex items-center gap-2" size="sm">
              Filtrar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

