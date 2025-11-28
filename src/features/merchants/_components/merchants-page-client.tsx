"use client";

import { useState, createContext, useContext } from "react";
import { MerchantsDashboardWrapper } from "./merchants-dashboard-wrapper";
import { MerchantsTableSettings } from "./merchants-table-settings";
import { merchantsColumns } from "./merchants-list-wrapper";
import type { MerchantsListResult } from "../server/merchants";

type MerchantsPageClientProps = {
  data: MerchantsListResult;
  children: React.ReactNode;
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
  children,
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
      <MerchantsDashboardWrapper data={data} tableSettingsButton={tableSettingsButton}>
        {children}
      </MerchantsDashboardWrapper>
    </MerchantsTableContext.Provider>
  );
}

