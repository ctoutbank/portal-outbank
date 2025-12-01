"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition} from "react";
import { FilterTransactionsButton } from "./transactions-filter-button";
import { FilterTransactionsContent } from "./transactions-filter-content";

type TransactionsFilterWrapperProps = {
  statusIn?: string;
  merchantIn?: string;
  dateFromIn?: string;
  dateToIn?: string;
  productTypeIn?: string;
  brandIn?: string;
  nsuIn?: string;
  methodIn?: string;
  salesChannelIn?: string;
  terminalIn?: string;
  valueMinIn?: string;
  valueMaxIn?: string;
};

export function TransactionsFilter(props: TransactionsFilterWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams?.toString() || "");
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [isPending, startTransition] = useTransition();


  const handleFilter = (filters: {
    status: string;
    merchant: string;
    dateFrom: string;
    dateTo: string;
    productType: string;
    brand: string;
    nsu: string;
    method: string;
    salesChannel: string;
    terminal: string;
    valueMin: string;
    valueMax: string;
  }) => {
    startTransition(() => {
      if (filters.status) {
        params.set("status", filters.status);
      } else {
        params.delete("status");
      }
      if (filters.merchant) {
        params.set("merchant", filters.merchant);
      } else {
        params.delete("merchant");
      }
      if (filters.dateFrom) {
        params.set("dateFrom", filters.dateFrom);
      } else {
        params.delete("dateFrom");
      }
      if (filters.dateTo) {
        params.set("dateTo", filters.dateTo);
      } else {
        params.delete("dateTo");
      }
      if (filters.productType) {
        params.set("productType", filters.productType);
      } else {
        params.delete("productType");
      }
      if (filters.brand) {
        params.set("brand", filters.brand);
      } else {
        params.delete("brand");
      }
      if (filters.nsu) {
        params.set("nsu", filters.nsu);
      } else {
        params.delete("nsu");
      }
      if (filters.method) {
        params.set("method", filters.method);
      } else {
        params.delete("method");
      }
      if (filters.salesChannel) {
        params.set("salesChannel", filters.salesChannel);
      } else {
        params.delete("salesChannel");
      }
      if (filters.terminal) {
        params.set("terminal", filters.terminal);
      } else {
        params.delete("terminal");
      }
      if (filters.valueMin) {
        params.set("valueMin", filters.valueMin);
      } else {
        params.delete("valueMin");
      }
      if (filters.valueMax) {
        params.set("valueMax", filters.valueMax);
      } else {
        params.delete("valueMax");
      }
      params.set("page", "1");
      router.push(`?${params.toString()}`);
    });
  };

  const handleClearFilters = () => {
    startTransition(() => {
      params.delete("status");
      params.delete("merchant");
      params.delete("dateFrom");
      params.delete("dateTo");
      params.delete("productType");
      params.delete("brand");
      params.delete("nsu");
      params.delete("method");
      params.delete("salesChannel");
      params.delete("terminal");
      params.delete("valueMin");
      params.delete("valueMax");
      params.set("page", "1");
      router.push(`?${params.toString()}`);
    });
  };

  // Contar os filtros ativos, considerando que agora podem ser listas separadas por vírgulas
  const getFilterCount = (filterValue?: string) => {
    if (!filterValue) return 0;
    // Se o filtro contiver vírgulas, é uma lista de valores
    return filterValue.includes(",") ? filterValue.split(",").length : 1;
  };

  const activeFiltersCount =
      getFilterCount(props.statusIn) +
      (props.merchantIn ? 1 : 0) +
      (props.dateFromIn ? 1 : 0) +
      (props.dateToIn ? 1 : 0) +
      getFilterCount(props.productTypeIn) +
      getFilterCount(props.brandIn) +
      (props.nsuIn ? 1 : 0) +
      getFilterCount(props.methodIn) +
      getFilterCount(props.salesChannelIn) +
      (props.terminalIn ? 1 : 0) +
      (props.valueMinIn ? 1 : 0) +
      (props.valueMaxIn ? 1 : 0);

  return (
      <FilterTransactionsButton
          activeFiltersCount={activeFiltersCount}
          onClearFilters={handleClearFilters}
          isFiltersVisible={isFiltersVisible}
          onVisibilityChange={setIsFiltersVisible}
          isPending={isPending}
      >

        <FilterTransactionsContent
            onClose={() => setIsFiltersVisible(false)}
            statusIn={props.statusIn}
            merchantIn={props.merchantIn}
            dateFromIn={props.dateFromIn}
            dateToIn={props.dateToIn}
            productTypeIn={props.productTypeIn}
            brandIn={props.brandIn}
            nsuIn={props.nsuIn}
            methodIn={props.methodIn}
            salesChannelIn={props.salesChannelIn}
            terminalIn={props.terminalIn}
            valueMinIn={props.valueMinIn}
            valueMaxIn={props.valueMaxIn}
            onFilter={handleFilter}
        />
      </FilterTransactionsButton>
  );
}

