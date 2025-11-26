"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FilterIcon } from "lucide-react"

type CategoriesFilterButtonProps = {
  activeFiltersCount: number
  onClearFilters: () => void
  children: React.ReactNode
  isFiltersVisible: boolean
  onVisibilityChange: (visible: boolean) => void
}

export function CustomersFilterButton({
  activeFiltersCount,
  onClearFilters,
  children,
  isFiltersVisible,
  onVisibilityChange
}: CategoriesFilterButtonProps) {
  return (
    <div className="relative z-50 w-full">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
        <Button
          variant="outline"
          onClick={() => onVisibilityChange(!isFiltersVisible)}
          className="flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
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
            className="text-sm text-muted-foreground cursor w-full sm:w-auto"
          >
            Limpar Filtros
          </Button>
        )}
      </div>
      {isFiltersVisible && children}
    </div>
  )
}