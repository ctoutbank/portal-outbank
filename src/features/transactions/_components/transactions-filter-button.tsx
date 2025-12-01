"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterIcon } from "lucide-react";

type FilterTransactionsButtonProps = {
  activeFiltersCount: number;
  onClearFilters: () => void;
  children: React.ReactNode;
  isFiltersVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  isPending: boolean;
};

export function FilterTransactionsButton({
  activeFiltersCount,
  onClearFilters,
  children,
  isFiltersVisible,
  onVisibilityChange,
  isPending,
}: FilterTransactionsButtonProps) {
  return (
    <div className="relative z-50">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => onVisibilityChange(!isFiltersVisible)}
          className="flex items-center gap-2"
          disabled={isPending}
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
            onClick={onClearFilters}
            className="text-sm text-muted-foreground"
            disabled={isPending}
          >
            Limpar Filtros
          </Button>
        )}
      </div>
      {isFiltersVisible && children}
      {isPending && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-4 rounded-md shadow-lg">
            <span className="text-sm font-medium">Carregando...</span>
          </div>
        </div>
      )}
    </div>
  );
}

