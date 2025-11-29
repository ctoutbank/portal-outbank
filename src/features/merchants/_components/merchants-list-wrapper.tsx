"use client";

import { useState } from "react";
import MerchantsList from "./merchants-list";
import { MerchantsTableSettings } from "./merchants-table-settings";
import type { MerchantsListResult } from "../server/merchants";

const columns = [
  {
    id: "iso",
    name: "ISO",
    defaultVisible: true,
    alwaysVisible: true,
    sortable: false,
  },
  {
    id: "name",
    name: "Nome Fantasia",
    defaultVisible: true,
    alwaysVisible: true,
    sortable: false,
  },
  {
    id: "localidade",
    name: "Localidade",
    defaultVisible: true,
    alwaysVisible: false,
    sortable: false,
  },
  {
    id: "statusKyc",
    name: "Status KYC",
    defaultVisible: true,
    alwaysVisible: false,
    sortable: false,
  },
  {
    id: "phone",
    name: "Telefone",
    defaultVisible: false,
    alwaysVisible: false,
    sortable: false,
  },
  {
    id: "email",
    name: "Email",
    defaultVisible: false,
    alwaysVisible: false,
    sortable: false,
  },
  {
    id: "antCp",
    name: "Ant. CP",
    defaultVisible: false,
    alwaysVisible: false,
    sortable: false,
  },
  {
    id: "antCnp",
    name: "Ant. CNP",
    defaultVisible: false,
    alwaysVisible: false,
    sortable: false,
  },
  {
    id: "dtinsert",
    name: "Cadastro",
    defaultVisible: false,
    alwaysVisible: false,
    sortable: false,
  },
  {
    id: "consultor",
    name: "Consultor",
    defaultVisible: false,
    alwaysVisible: false,
    sortable: false,
  },
  {
    id: "ativo",
    name: "Status",
    defaultVisible: true,
    alwaysVisible: false,
    sortable: false,
  },
];

interface MerchantsListWrapperProps {
  list: MerchantsListResult;
}

export function MerchantsListWrapper({ list }: MerchantsListWrapperProps) {
  const [visibleColumns, setVisibleColumns] = useState(
    columns.filter((column) => column.defaultVisible).map((column) => column.id)
  );

  const toggleColumn = (columnId: string) => {
    const column = columns.find((col) => col.id === columnId);
    if (column?.alwaysVisible) return;

    if (visibleColumns.includes(columnId)) {
      setVisibleColumns(visibleColumns.filter((id) => id !== columnId));
    } else {
      setVisibleColumns([...visibleColumns, columnId]);
    }
  };

  return (
    <>
      <MerchantsList
        list={list}
        columnsConfig={columns}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
      />
      <MerchantsTableSettings
        columns={columns}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
      />
    </>
  );
}

export { columns as merchantsColumns };


