"use client";

import { useState, createContext, useContext } from "react";
import { MerchantsDashboardWrapper } from "./merchants-dashboard-wrapper";
import { MerchantsTableSettings } from "./merchants-table-settings";
import { MerchantsFilter } from "./merchants-filter";
import { MerchantsSearchInput } from "./merchants-search-input";
import { MerchantsSyncButton } from "./merchants-sync-button";
import { MerchantsListWithContext } from "./merchants-list-with-context";
import { merchantsColumns } from "./merchants-list-wrapper";
import { EmptyState } from "@/components/empty-state";
import { Search } from "lucide-react";
import PageSizeSelector from "@/components/page-size-selector";
import PaginationRecords from "@/components/pagination-Records";
import type { MerchantsListResult } from "../server/merchants";

type MerchantsPageClientProps = {
  data: MerchantsListResult;
  availableCustomers: Array<{ id: number; name: string | null }>;
  merchantSuggestions: Array<{ id: number | bigint; name: string | null; corporateName: string | null; slug: string | null; idDocument: string | null; }>;
  emailSuggestions: string[];
  documentSuggestions: string[];
  salesAgentSuggestions: string[];
  stateSuggestions: string[];
  resolvedSearchParams: {
    dateFrom?: string;
    establishment?: string;
    status?: string;
    state?: string;
    email?: string;
    cnpj?: string;
    active?: string;
    salesAgent?: string;
    customerId?: string;
  };
  totalRecords: number;
  page: number;
  pageSize: number;
};

const MerchantsTableContext = createContext<{
  visibleColumns: string[];
  toggleColumn: (columnId: string) => void;
  columns: typeof merchantsColumns;
} | null>(null);

export function useMerchantsTable() {
  const context = useContext(MerchantsTableContext);
  if (!context) {
    throw new Error("useMerchantsTable must be used within MerchantsPageClient");
  }
  return context;
}

export function MerchantsPageClient({
  data,
  availableCustomers,
  merchantSuggestions,
  emailSuggestions,
  documentSuggestions,
  salesAgentSuggestions,
  stateSuggestions,
  resolvedSearchParams,
  totalRecords,
  page,
  pageSize,
}: MerchantsPageClientProps) {
  const [visibleColumns, setVisibleColumns] = useState(
    merchantsColumns.filter((column) => column.defaultVisible).map((column) => column.id)
  );

  const toggleColumn = (columnId: string) => {
    const column = merchantsColumns.find((col) => col.id === columnId);
    if (column?.alwaysVisible) return;

    if (visibleColumns.includes(columnId)) {
      setVisibleColumns(visibleColumns.filter((id) => id !== columnId));
    } else {
      setVisibleColumns([...visibleColumns, columnId]);
    }
  };

  const tableSettingsButton = (
    <MerchantsTableSettings
      columns={merchantsColumns}
      visibleColumns={visibleColumns}
      onToggleColumn={toggleColumn}
    />
  );

  return (
    <MerchantsTableContext.Provider value={{ visibleColumns, toggleColumn, columns: merchantsColumns }}>
      <div className="flex flex-col space-y-2">
        <MerchantsDashboardWrapper data={data} tableSettingsButton={tableSettingsButton}>
          <MerchantsFilter
            dateFromIn={resolvedSearchParams.dateFrom}
            establishmentIn={resolvedSearchParams.establishment}
            statusIn={resolvedSearchParams.status}
            stateIn={resolvedSearchParams.state}
            emailIn={resolvedSearchParams.email}
            cnpjIn={resolvedSearchParams.cnpj}
            activeIn={resolvedSearchParams.active}
            salesAgentIn={resolvedSearchParams.salesAgent}
            customerIdIn={resolvedSearchParams.customerId}
            availableCustomers={availableCustomers}
            emailSuggestions={emailSuggestions}
            documentSuggestions={documentSuggestions}
            salesAgentSuggestions={salesAgentSuggestions}
            stateSuggestions={stateSuggestions}
          />
          <MerchantsSearchInput suggestions={merchantSuggestions} />
          <MerchantsSyncButton />
        </MerchantsDashboardWrapper>

        <div className="mt-2">
          {data.merchants.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nenhum resultado encontrado"
              description="Tente ajustar os filtros para encontrar estabelecimentos"
            />
          ) : (
            <MerchantsListWithContext list={data} />
          )}
          {totalRecords > 0 && (
            <div className="flex items-center justify-between mt-4">
              <PageSizeSelector
                currentPageSize={pageSize}
                pageName="merchants"
              />
              <PaginationRecords
                totalRecords={totalRecords}
                currentPage={page}
                pageSize={pageSize}
                pageName="merchants"
              />
            </div>
          )}
        </div>
      </div>
    </MerchantsTableContext.Provider>
  );
}

