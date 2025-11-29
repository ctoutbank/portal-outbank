"use client";

import MerchantsList from "./merchants-list";
import { useMerchantsTable } from "./merchants-page-client";
import type { MerchantsListResult } from "../server/merchants";

interface MerchantsListWithContextProps {
  list: MerchantsListResult;
}

export function MerchantsListWithContext({ list }: MerchantsListWithContextProps) {
  const { visibleColumns, toggleColumn, columns } = useMerchantsTable();

  return (
    <MerchantsList
      list={list}
      columnsConfig={columns}
      visibleColumns={visibleColumns}
      onToggleColumn={toggleColumn}
    />
  );
}


