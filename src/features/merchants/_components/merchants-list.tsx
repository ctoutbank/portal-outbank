"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { translateStatus } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";
import type { MerchantsListResult } from "../server/merchants";
import { MerchantsTableSettings } from "./merchants-table-settings";

type Column = {
  id: string;
  name: string;
  defaultVisible: boolean;
  alwaysVisible: boolean;
  sortable: boolean;
};

export default function MerchantsList({ 
  list,
  columnsConfig,
  visibleColumns,
  onToggleColumn,
}: { 
  list: MerchantsListResult;
  columnsConfig?: Column[];
  visibleColumns?: string[];
  onToggleColumn?: (columnId: string) => void;
}) {
  const columns: Column[] = [
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

  const [internalVisibleColumns, setInternalVisibleColumns] = useState(
    columns.filter((column) => column.defaultVisible).map((column) => column.id)
  );

  const currentVisibleColumns = visibleColumns || internalVisibleColumns;
  const currentColumns = columnsConfig || columns;

  const toggleColumn = (columnId: string) => {
    if (onToggleColumn) {
      onToggleColumn(columnId);
      return;
    }

    const column = columns.find((col) => col.id === columnId);
    if (column?.alwaysVisible) return;

    if (internalVisibleColumns.includes(columnId)) {
      setInternalVisibleColumns(internalVisibleColumns.filter((id) => id !== columnId));
    } else {
      setInternalVisibleColumns([...internalVisibleColumns, columnId]);
    }
  };

  return (
    <div>
      <div className="border rounded-lg mt-2">
        <Table>
          <TableHeader>
            <TableRow>
              {currentColumns
                .filter((column) => currentVisibleColumns.includes(column.id))
                .map((column) => (
                  <TableHead key={column.id} className="font-medium text-center">
                    {column.name}
                  </TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.merchants.map((merchant) => (
              <TableRow key={merchant.merchantid}>
                {currentVisibleColumns.includes("iso") && (
                  <TableCell className="text-center">
                    {merchant.customerName ? (
                      <div className="flex justify-center">
                        <Badge variant="outline" className="text-xs">
                          {merchant.customerName}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </TableCell>
                )}
                {currentVisibleColumns.includes("name") && (
                  <TableCell>
                    <Link
                      href={`/merchants/${merchant.merchantid}`}
                      className="font-medium hover:underline text-primary"
                    >
                      {merchant.name?.toUpperCase() || "-"}
                    </Link>
                  </TableCell>
                )}
                {currentVisibleColumns.includes("localidade") && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{merchant.addressname || "-"}</span>
                      {merchant.state && (
                        <span className="text-sm text-muted-foreground">
                          ({merchant.state})
                        </span>
                      )}
                    </div>
                  </TableCell>
                )}
                {currentVisibleColumns.includes("statusKyc") && (
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Badge
                        variant={
                          merchant.kic_status === "APPROVED"
                            ? "default"
                            : merchant.kic_status === "PENDING"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {translateStatus(merchant.kic_status || "")}
                      </Badge>
                    </div>
                  </TableCell>
                )}
                {currentVisibleColumns.includes("phone") && (
                  <TableCell className="text-muted-foreground">
                    {merchant.areaCode && merchant.number
                      ? `(${merchant.areaCode}) ${merchant.number}`
                      : "-"}
                  </TableCell>
                )}
                {currentVisibleColumns.includes("email") && (
                  <TableCell className="text-muted-foreground">
                    <span className="truncate max-w-[200px] block">
                      {merchant.email || "-"}
                    </span>
                  </TableCell>
                )}
                {currentVisibleColumns.includes("antCp") && (
                  <TableCell>
                    <Badge
                      variant={
                        merchant.lockCpAnticipationOrder
                          ? "destructive"
                          : "default"
                      }
                      className={
                        !merchant.lockCpAnticipationOrder
                          ? "bg-green-600 hover:bg-green-700"
                          : ""
                      }
                    >
                      {merchant.lockCpAnticipationOrder ? "Inativo" : "Ativo"}
                    </Badge>
                  </TableCell>
                )}
                {currentVisibleColumns.includes("antCnp") && (
                  <TableCell>
                    <Badge
                      variant={
                        merchant.lockCnpAnticipationOrder
                          ? "destructive"
                          : "default"
                      }
                      className={
                        !merchant.lockCnpAnticipationOrder
                          ? "bg-green-600 hover:bg-green-700"
                          : ""
                      }
                    >
                      {merchant.lockCnpAnticipationOrder
                        ? "Bloqueado"
                        : "Ativo"}
                    </Badge>
                  </TableCell>
                )}
                {currentVisibleColumns.includes("dtinsert") && (
                  <TableCell>
                    <div className="flex flex-col whitespace-nowrap">
                      <span>
                        {merchant.dtinsert
                          ? new Date(merchant.dtinsert).toLocaleDateString(
                              "pt-BR"
                            ) +
                            ", " +
                            new Date(merchant.dtinsert).toLocaleTimeString(
                              "pt-BR",
                              { hour: "2-digit", minute: "2-digit" }
                            )
                          : "-"}
                      </span>
                      {merchant.Inclusion && (
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {merchant.Inclusion}
                        </span>
                      )}
                    </div>
                  </TableCell>
                )}
                {currentVisibleColumns.includes("consultor") && (
                  <TableCell>{merchant.sales_agent || "-"}</TableCell>
                )}
                {currentVisibleColumns.includes("ativo") && (
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Badge
                        variant={merchant.active ? "default" : "destructive"}
                        className={
                          merchant.active
                            ? "bg-green-600 hover:bg-green-700"
                            : ""
                        }
                      >
                        {merchant.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

