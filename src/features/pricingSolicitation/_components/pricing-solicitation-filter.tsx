"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FilterPricingSolicitationButton } from "./filter-button";
import { FilterPricingSolicitationContent } from "./filter-content";

type PricingSolicitationFilterProps = {
  cnae?: string;
  status?: string;
  hasPermission?: boolean;
  permissions?: string[];
};

export function PricingSolicitationFilter(
  props: PricingSolicitationFilterProps
) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams?.toString() || "");
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  const handleFilter = (filters: { cnae: string; status: string }) => {
    if (filters.cnae) {
      params.set("cnae", filters.cnae);
    } else {
      params.delete("cnae");
    }
    if (filters.status) {
      params.set("status", filters.status);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleClearFilters = () => {
    params.delete("cnae");
    params.delete("status");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const activeFiltersCount = (props.cnae ? 1 : 0) + (props.status ? 1 : 0);

  return (
    <div className="flex items-center justify-between">
      <FilterPricingSolicitationButton
        activeFiltersCount={activeFiltersCount}
        onClearFilters={handleClearFilters}
        isFiltersVisible={isFiltersVisible}
        onVisibilityChange={setIsFiltersVisible}
      >
        <FilterPricingSolicitationContent
          onClose={() => setIsFiltersVisible(false)}
          cnaeIn={props.cnae}
          statusIn={props.status}
          onFilter={handleFilter}
        />
      </FilterPricingSolicitationButton>
      {props.permissions?.includes("Inserir") && (
        <Button asChild className="shrink-0">
          <Link href="/portal/pricingSolicitation/0">
            <Plus className="h-4 w-4" />
            Nova Solicitação de Taxas
          </Link>
        </Button>
      )}
    </div>
  );
}
