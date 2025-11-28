"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FilterMerchantsButton } from "./merchants-filter-button";
import { FilterMerchantsContent } from "./merchants-filter-content";

type MerchantFilterWrapperProps = {
  dateFromIn?: string;
  establishmentIn?: string;
  statusIn?: string;
  stateIn?: string;
  emailIn?: string;
  cnpjIn?: string;
  activeIn?: string;
  salesAgentIn?: string;
  customerIdIn?: string;
  availableCustomers?: Array<{ id: number; name: string | null }>;
};

export function MerchantsFilter(props: MerchantFilterWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams?.toString() || "");
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsFiltersVisible(false);
      }
    }

    if (isFiltersVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFiltersVisible]);

  const handleFilter = (filters: {
    dateFrom?: Date;
    establishment: string;
    status: string;
    state: string;
    email: string;
    cnpj: string;
    active: string;
    salesAgent: string;
    customerId?: number;
  }) => {
    if (filters.dateFrom) {
      params.set("dateFrom", filters.dateFrom.toISOString());
    } else {
      params.delete("dateFrom");
    }
    if (filters.establishment) {
      params.set("establishment", filters.establishment);
    } else {
      params.delete("establishment");
    }
    if (filters.status) {
      params.set("status", filters.status);
    } else {
      params.delete("status");
    }
    if (filters.state) {
      params.set("state", filters.state);
    } else {
      params.delete("state");
    }
    if (filters.email) {
      params.set("email", filters.email);
    } else {
      params.delete("email");
    }
    if (filters.cnpj) {
      params.set("cnpj", filters.cnpj);
    } else {
      params.delete("cnpj");
    }
    if (filters.active) {
      params.set("active", filters.active);
    } else {
      params.delete("active");
    }
    if (filters.salesAgent) {
      params.set("salesAgent", filters.salesAgent);
    } else {
      params.delete("salesAgent");
    }
    if (filters.customerId) {
      params.set("customerId", filters.customerId.toString());
    } else {
      params.delete("customerId");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleClearFilters = () => {
    params.delete("dateFrom");
    params.delete("establishment");
    params.delete("status");
    params.delete("state");
    params.delete("email");
    params.delete("cnpj");
    params.delete("active");
    params.delete("salesAgent");
    params.delete("customerId");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const activeFiltersCount =
    (props.dateFromIn ? 1 : 0) +
    (props.establishmentIn ? 1 : 0) +
    (props.statusIn ? 1 : 0) +
    (props.stateIn ? 1 : 0) +
    (props.emailIn ? 1 : 0) +
    (props.cnpjIn ? 1 : 0) +
    (props.activeIn ? 1 : 0) +
    (props.salesAgentIn ? 1 : 0) +
    (props.customerIdIn ? 1 : 0);

  return (
    <div ref={filterRef}>
      <FilterMerchantsButton
        activeFiltersCount={activeFiltersCount}
        onClearFilters={handleClearFilters}
        isFiltersVisible={isFiltersVisible}
        onVisibilityChange={setIsFiltersVisible}
      >
        <FilterMerchantsContent
          onClose={() => setIsFiltersVisible(false)}
          dateFromIn={props.dateFromIn ? new Date(props.dateFromIn) : undefined}
          establishmentIn={props.establishmentIn}
          statusIn={props.statusIn}
          stateIn={props.stateIn}
          emailIn={props.emailIn}
          cnpjIn={props.cnpjIn}
          activeIn={props.activeIn}
          salesAgentIn={props.salesAgentIn}
          customerIdIn={props.customerIdIn}
          availableCustomers={props.availableCustomers}
          onFilter={handleFilter}
        />
      </FilterMerchantsButton>
    </div>
  );
}

