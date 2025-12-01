"use client";

import { Badge } from "@/components/ui/badge";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { convertUTCToSaoPaulo } from "@/lib/datetime-utils";
import { getTerminalTypeLabel } from "@/lib/lookuptables/lookuptables-terminals";
import {
  getCardPaymentMethodLabel,
  getProcessingTypeLabel,
} from "@/lib/lookuptables/lookuptables-transactions";
import { createSortHandler, formatCNPJ } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { TransactionsListRecord } from "../serverActions/transaction";

interface TransactionsListProps {
  transactions: TransactionsListRecord[];
  sorting?: {
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  };
}

export default function TransactionsList({
  transactions,
}: TransactionsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSort = createSortHandler(
    searchParams,
    router,
    "/transactions"
  );

  const getStatusBadgeVariant = (status: string | null) => {
    if (!status) return "secondary";

    if (status.includes("AUTHORIZED") || status.includes("APPROVED")) {
      return "success";
    } else if (status.includes("PENDING")) {
      return "pending";
    } else if (status.includes("DENIED") || status.includes("REJECTED")) {
      return "destructive";
    } else if (status.includes("CANCELED")) {
      return "outline";
    } else if (status.includes("EXPIRED")) {
      return "secondary";
    } else if (status.includes("PRE_AUTHORIZED")) {
      return "default";
    }
    return "secondary";
  };

  const translateStatus = (status: string | null) => {
    if (!status) return "N/A";

    const statusMap: Record<string, string> = {
      CANCELED: "Cancelada",
      EXPIRED: "Expirada",
      PENDING: "Pendente",
      DENIED: "Negada",
      PRE_AUTHORIZED: "Pré-autorizada",
      AUTHORIZED: "Autorizada",
      APPROVED: "Aprovada",
      REJECTED: "Rejeitada",
      ERROR: "Falhou",
    };

    for (const [key, value] of Object.entries(statusMap)) {
      if (status.includes(key)) {
        return value;
      }
    }

    return status;
  };

  const formatCurrency = (value: number | string | null) => {
    if (value === null) return "R$ 0,00";

    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue);
  };

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return "N/A";
    return convertUTCToSaoPaulo(dateStr as string, true);
  };

  const translateProductType = (productType: string | null) => {
    if (!productType) return "N/A";

    const productTypeMap: Record<string, string> = {
      DEBIT: "Débito",
      CREDIT: "Crédito",
      VOUCHER: "Voucher",
      PIX: "PIX",
      PREPAID_CREDIT: "Crédito Pré-pago",
      PREPAID_DEBIT: "Débito Pré-pago",
    };

    return productTypeMap[productType] || productType;
  };

  const formatCustomerName = (customerName: string | null) => {
    if (!customerName) return null;
    
    // Se contém "Prisma" (case-insensitive), retorna apenas "Prisma"
    if (customerName.toLowerCase().includes("prisma")) {
      return "Prisma";
    }
    
    return customerName;
  };

  const handleRowClick = (slug: string) => {
    router.push(`/transactions/${slug}`);
  };

  return (
    <div className="border rounded-lg mt-2">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead
              columnId="customerName"
              name="ISO"
              sortable={true}
              onSort={handleSort}
              searchParams={searchParams}
              className="text-center"
            />
            <SortableTableHead
              columnId="dtInsert"
              name="Data"
              sortable={true}
              onSort={handleSort}
              searchParams={searchParams}
            />
            <SortableTableHead
              columnId="merchantName"
              name="Estabelecimento"
              sortable={true}
              onSort={handleSort}
              searchParams={searchParams}
            />
            <SortableTableHead
              columnId="terminalType"
              name="Terminal"
              sortable={true}
              onSort={handleSort}
              searchParams={searchParams}
            />
            <SortableTableHead
              columnId="method"
              name="Processamento"
              sortable={true}
              onSort={handleSort}
              searchParams={searchParams}
            />
            <SortableTableHead
              columnId="productType"
              name="Tipo"
              sortable={true}
              onSort={handleSort}
              searchParams={searchParams}
            />
            <SortableTableHead
              columnId="brand"
              name="Bandeira"
              sortable={true}
              onSort={handleSort}
              searchParams={searchParams}
            />
            <SortableTableHead
              columnId="amount"
              name="Valor"
              sortable={true}
              onSort={handleSort}
              searchParams={searchParams}
            />
            <SortableTableHead
              columnId="transactionStatus"
              name="Status"
              sortable={true}
              onSort={handleSort}
              searchParams={searchParams}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow 
              key={transaction.slug}
              className="hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => handleRowClick(transaction.slug)}
            >
              <TableCell className="text-center">
                {formatCustomerName(transaction.customerName) ? (
                  <div className="flex justify-center">
                    <Badge variant="outline" className="text-xs">
                      {formatCustomerName(transaction.customerName)}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-muted-foreground">--</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  {formatDate(transaction.dtInsert).split(" ")[0]}
                  <span className="text-xs text-gray-500">
                    {formatDate(transaction.dtInsert).split(" ")[1]}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  {transaction.merchantName?.toUpperCase() || "N/A"}
                  <span className="text-xs text-gray-500">
                    {transaction.merchantCNPJ
                      ? formatCNPJ(transaction.merchantCNPJ)
                      : ""}
                  </span>
                </div>
              </TableCell>
              <TableCell className="">
                <div className="flex flex-col">
                  {getTerminalTypeLabel(transaction.terminalType || "") || "-"}
                  <span className="text-xs text-gray-500">
                    {transaction.terminalLogicalNumber || "-"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  {getCardPaymentMethodLabel(transaction.method || "") || "-"}
                  <span className="text-xs text-gray-500">
                    {getProcessingTypeLabel(transaction.salesChannel || "") ||
                      "-"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {translateProductType(transaction.productType)}
              </TableCell>
              <TableCell>{transaction.brand || "-"}</TableCell>
              <TableCell>{formatCurrency(transaction.amount)}</TableCell>
              <TableCell>
                <Badge
                  variant={getStatusBadgeVariant(transaction.transactionStatus)}
                >
                  {translateStatus(transaction.transactionStatus)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

