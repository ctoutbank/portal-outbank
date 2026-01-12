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
import { maskEstablishment, maskPhone, maskEmail, maskAddress } from "@/utils/mask-sensitive-data";

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
  shouldMaskData = false,
}: { 
  list: MerchantsListResult;
  columnsConfig?: Column[];
  visibleColumns?: string[];
  onToggleColumn?: (columnId: string) => void;
  shouldMaskData?: boolean;
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
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden mt-2">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow className="bg-[#1f1f1f] border-b border-[#2a2a2a] hover:bg-[#1f1f1f]">
              {currentColumns
                .filter((column) => currentVisibleColumns.includes(column.id))
                .map((column) => (
                  <TableHead key={column.id} className="p-4 text-white text-xs font-medium uppercase tracking-wider text-center">
                    {column.name}
                  </TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.merchants.map((merchant) => (
              <TableRow key={merchant.merchantid} className="border-b border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors">
                {currentVisibleColumns.includes("iso") && (
                  <TableCell className="text-center p-4 text-[#b0b0b0] text-[13px]">
                    {merchant.customerName ? (
                      <div className="flex justify-center">
                        <Badge variant="outline" className="text-[11px]">
                          {merchant.customerName}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-[#808080]">--</span>
                    )}
                  </TableCell>
                )}
                {currentVisibleColumns.includes("name") && (
                  <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                    <Link
                      href={`/merchants/${merchant.merchantid}`}
                      className="font-medium hover:underline text-white"
                    >
                      {shouldMaskData 
                        ? maskEstablishment(merchant.name)?.toUpperCase() 
                        : (merchant.name?.toUpperCase() || "-")}
                    </Link>
                  </TableCell>
                )}
                {currentVisibleColumns.includes("localidade") && (
                  <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                    <div className="flex items-center gap-2">
                      <span className="text-white">
                        {shouldMaskData ? maskAddress(merchant.addressname) : (merchant.addressname || "-")}
                      </span>
                      {merchant.state && (
                        <span className="text-[11px] text-[#606060]">
                          ({merchant.state})
                        </span>
                      )}
                    </div>
                  </TableCell>
                )}
                {currentVisibleColumns.includes("statusKyc") && (
                  <TableCell className="text-center p-4 text-[#b0b0b0] text-[13px]">
                    <div className="flex justify-center">
                      <Badge
                        variant={
                          merchant.kic_status === "APPROVED"
                            ? "success"
                            : merchant.kic_status === "PENDING"
                              ? "warning"
                              : "destructive"
                        }
                        className="text-[11px]"
                      >
                        {translateStatus(merchant.kic_status || "")}
                      </Badge>
                    </div>
                  </TableCell>
                )}
                {currentVisibleColumns.includes("phone") && (
                  <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                    {merchant.areaCode && merchant.number
                      ? (shouldMaskData 
                          ? maskPhone(`${merchant.areaCode}${merchant.number}`)
                          : `(${merchant.areaCode}) ${merchant.number}`)
                      : "-"}
                  </TableCell>
                )}
                {currentVisibleColumns.includes("email") && (
                  <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                    <span className="truncate max-w-[200px] block">
                      {shouldMaskData ? maskEmail(merchant.email) : (merchant.email || "-")}
                    </span>
                  </TableCell>
                )}
                {currentVisibleColumns.includes("antCp") && (
                  <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                    <Badge
                      variant={
                        merchant.lockCpAnticipationOrder
                          ? "destructive"
                          : "success"
                      }
                      className="text-[11px]"
                    >
                      {merchant.lockCpAnticipationOrder ? "Inativo" : "Ativo"}
                    </Badge>
                  </TableCell>
                )}
                {currentVisibleColumns.includes("antCnp") && (
                  <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                    <Badge
                      variant={
                        merchant.lockCnpAnticipationOrder
                          ? "destructive"
                          : "success"
                      }
                      className="text-[11px]"
                    >
                      {merchant.lockCnpAnticipationOrder
                        ? "Bloqueado"
                        : "Ativo"}
                    </Badge>
                  </TableCell>
                )}
                {currentVisibleColumns.includes("dtinsert") && (
                  <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                    <div className="flex flex-col whitespace-nowrap gap-0.5">
                      <span className="text-white font-medium">
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
                        <span className="text-[11px] text-[#606060] truncate max-w-[150px]">
                          {merchant.Inclusion}
                        </span>
                      )}
                    </div>
                  </TableCell>
                )}
                {currentVisibleColumns.includes("consultor") && (
                  <TableCell className="p-4 text-[#b0b0b0] text-[13px]">{merchant.sales_agent || "-"}</TableCell>
                )}
                {currentVisibleColumns.includes("ativo") && (
                  <TableCell className="text-center p-4 text-[#b0b0b0] text-[13px]">
                    <div className="flex justify-center">
                      <Badge
                        variant={merchant.active ? "success" : "inactive"}
                        className="text-[11px]"
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
    </div>
  );
}

