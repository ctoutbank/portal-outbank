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
import Image from "next/image";

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

  const renderBrand = (brand: string | null) => {
    if (!brand) return "-";
    
    // Se for Visa, exibe o ícone
    if (brand.toUpperCase().includes("VISA")) {
      return (
        <Image
          src="/visa-trasso-dourado.svg"
          alt="Visa"
          width={40}
          height={25}
          className="inline-block"
        />
      );
    }
    
    // Caso contrário, exibe o texto
    return brand;
  };

  const handleRowClick = (slug: string) => {
    router.push(`/transactions/${slug}`);
  };

  const getStatusBadgeClass = (status: string | null) => {
    if (!status) return "bg-[#2a2a2a] text-[#808080]";
    
    if (status.includes("AUTHORIZED") || status.includes("APPROVED")) {
      return "bg-[#1a3a2a] text-[#4ade80]";
    } else if (status.includes("DENIED") || status.includes("REJECTED")) {
      return "bg-[#3a1a1a] text-[#f87171]";
    }
    return "bg-[#2a2a2a] text-[#808080]";
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
        <TableHeader>
          <TableRow className="bg-[#1f1f1f] border-b border-[#2a2a2a] hover:bg-[#1f1f1f]">
            <SortableTableHead
              columnId="customerName"
              name="ISO"
              sortable={true}
              onSort={handleSort}
              searchParams={searchParams}
              className="text-center p-4 text-white text-xs font-medium uppercase tracking-wider"
            />
            <SortableTableHead
              columnId="dtInsert"
              name="Data"
              sortable={true}
              onSort={handleSort}
              searchParams={searchParams}
              className="p-4 text-white text-xs font-medium uppercase tracking-wider"
            />
            <SortableTableHead
              columnId="merchantName"
              name="Estabelecimento"
              sortable={true}
              onSort={handleSort}
              searchParams={searchParams}
              className="p-4 text-white text-xs font-medium uppercase tracking-wider"
            />
            <SortableTableHead
              columnId="terminalType"
              name="Terminal"
              sortable={true}
              onSort={handleSort}
              searchParams={searchParams}
              className="p-4 text-white text-xs font-medium uppercase tracking-wider"
            />
            <SortableTableHead
              columnId="method"
              name="Processamento"
              sortable={true}
              onSort={handleSort}
              searchParams={searchParams}
              className="p-4 text-white text-xs font-medium uppercase tracking-wider"
            />
            <SortableTableHead
              columnId="productType"
              name="Tipo"
              sortable={true}
              onSort={handleSort}
              searchParams={searchParams}
              className="p-4 text-white text-xs font-medium uppercase tracking-wider"
            />
            <SortableTableHead
              columnId="brand"
              name="Bandeira"
              sortable={true}
              onSort={handleSort}
              searchParams={searchParams}
              className="p-4 text-white text-xs font-medium uppercase tracking-wider"
            />
            <SortableTableHead
              columnId="amount"
              name="Valor"
              sortable={true}
              onSort={handleSort}
              searchParams={searchParams}
              className="p-4 text-white text-xs font-medium uppercase tracking-wider"
            />
            <SortableTableHead
              columnId="transactionStatus"
              name="Status"
              sortable={true}
              onSort={handleSort}
              searchParams={searchParams}
              className="p-4 text-white text-xs font-medium uppercase tracking-wider"
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow 
              key={transaction.slug}
              className="border-b border-[#2a2a2a] hover:bg-[#1f1f1f] cursor-pointer transition-colors"
              onClick={() => handleRowClick(transaction.slug)}
            >
              <TableCell className="text-center p-4 text-[#b0b0b0] text-sm">
                {formatCustomerName(transaction.customerName) ? (
                  <div className="flex justify-center">
                    <Badge variant="outline" className="text-xs">
                      {formatCustomerName(transaction.customerName)}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-[#808080]">--</span>
                )}
              </TableCell>
              <TableCell className="p-4 text-[#b0b0b0] text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-white font-medium">
                    {formatDate(transaction.dtInsert).split(" ")[0]}
                  </span>
                  <span className="text-[11px] text-[#606060]">
                    {formatDate(transaction.dtInsert).split(" ")[1]}
                  </span>
                </div>
              </TableCell>
              <TableCell className="p-4 text-[#b0b0b0] text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-white font-medium">
                    {transaction.merchantName?.toUpperCase() || "N/A"}
                  </span>
                  <span className="text-[11px] text-[#606060] font-mono">
                    {transaction.merchantCNPJ
                      ? formatCNPJ(transaction.merchantCNPJ)
                      : ""}
                  </span>
                </div>
              </TableCell>
              <TableCell className="p-4 text-[#b0b0b0] text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-white">
                    {getTerminalTypeLabel(transaction.terminalType || "") || "-"}
                  </span>
                  <span className="text-[11px] text-[#606060] font-mono">
                    {transaction.terminalLogicalNumber || "-"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="p-4 text-[#b0b0b0] text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-white">
                    {getCardPaymentMethodLabel(transaction.method || "") || "-"}
                  </span>
                  <span className="text-[11px] text-[#606060]">
                    {getProcessingTypeLabel(transaction.salesChannel || "") ||
                      "-"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="p-4 text-[#b0b0b0] text-sm">
                {translateProductType(transaction.productType)}
              </TableCell>
              <TableCell className="p-4 text-[#b0b0b0] text-sm">
                {renderBrand(transaction.brand)}
              </TableCell>
              <TableCell className="p-4 text-white font-semibold text-sm">
                {formatCurrency(transaction.amount)}
              </TableCell>
              <TableCell className="p-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-medium ${getStatusBadgeClass(transaction.transactionStatus)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${transaction.transactionStatus?.includes("AUTHORIZED") || transaction.transactionStatus?.includes("APPROVED") ? "bg-[#4ade80]" : transaction.transactionStatus?.includes("DENIED") || transaction.transactionStatus?.includes("REJECTED") ? "bg-[#f87171]" : "bg-[#808080]"}`}></span>
                  {translateStatus(transaction.transactionStatus)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>
    </div>
  );
}

