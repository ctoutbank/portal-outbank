"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCNPJ, translateStatus } from "@/lib/utils";
import { Settings } from "lucide-react";
import { useState } from "react";
import type { MerchantsListResult } from "../server/merchants";

export default function MerchantsList({ list }: { list: MerchantsListResult }) {
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
    <div>
      <div className="flex justify-end mb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {columns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={visibleColumns.includes(column.id)}
                onCheckedChange={() => toggleColumn(column.id)}
                disabled={column.alwaysVisible}
              >
                {column.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="border rounded-lg mt-2">
        <Table>
          <TableHeader>
            <TableRow>
              {columns
                .filter((column) => visibleColumns.includes(column.id))
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
                {visibleColumns.includes("iso") && (
                  <TableCell>
                    {merchant.customerName ? (
                      <Badge variant="outline" className="text-xs">
                        {merchant.customerName}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </TableCell>
                )}
                {visibleColumns.includes("name") && (
                  <TableCell>
                    <span className="font-medium">
                      {merchant.name?.toUpperCase() || "-"}
                    </span>
                  </TableCell>
                )}
                {visibleColumns.includes("localidade") && (
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
                {visibleColumns.includes("statusKyc") && (
                  <TableCell>
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
                  </TableCell>
                )}
                {visibleColumns.includes("phone") && (
                  <TableCell className="text-muted-foreground">
                    {merchant.areaCode && merchant.number
                      ? `(${merchant.areaCode}) ${merchant.number}`
                      : "-"}
                  </TableCell>
                )}
                {visibleColumns.includes("email") && (
                  <TableCell className="text-muted-foreground">
                    <span className="truncate max-w-[200px] block">
                      {merchant.email || "-"}
                    </span>
                  </TableCell>
                )}
                {visibleColumns.includes("antCp") && (
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
                {visibleColumns.includes("antCnp") && (
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
                {visibleColumns.includes("dtinsert") && (
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
                {visibleColumns.includes("consultor") && (
                  <TableCell>{merchant.sales_agent || "-"}</TableCell>
                )}
                {visibleColumns.includes("ativo") && (
                  <TableCell>
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

