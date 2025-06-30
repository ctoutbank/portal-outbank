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

export function CategoriesFilterButton({
  activeFiltersCount,
  onClearFilters,
  children,
  isFiltersVisible,
  onVisibilityChange
}: CategoriesFilterButtonProps) {
  return (
    <div className="relative z-50">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => onVisibilityChange(!isFiltersVisible)}
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
            onClick={onClearFilters}
            className="text-sm text-muted-foreground"
          >
            Limpar Filtros
          </Button>
        )}
      </div>
      {isFiltersVisible && children}
    </div>
  )
}