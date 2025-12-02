"use client";

import { Button } from "@/components/ui/button";
import { getEndOfDay, getStartOfDay } from "@/lib/datetime-utils";
import { FileText } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function TransactionsExport() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const onGetExportTransactions = async () => {
    setIsLoading(true);

    try {
      const page = 1;
      const pageSize = 1000;
      const search = searchParams?.get("search") || "";
      const status = searchParams?.get("status") || undefined;
      const merchant = searchParams?.get("merchant") || undefined;
      const dateFrom = searchParams?.get("dateFrom") || getStartOfDay();
      const dateTo = searchParams?.get("dateTo") || getEndOfDay();
      const productType = searchParams?.get("productType") || undefined;
      const brand = searchParams?.get("brand") || undefined;
      const nsu = searchParams?.get("nsu") || undefined;
      const method = searchParams?.get("method") || undefined;
      const salesChannel = searchParams?.get("salesChannel") || undefined;
      const terminal = searchParams?.get("terminal") || undefined;
      const valueMin = searchParams?.get("valueMin") || undefined;
      const valueMax = searchParams?.get("valueMax") || undefined;

      console.log("Exportando transações para Excel...");

      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (status) queryParams.append("status", status);
      if (merchant) queryParams.append("merchant", merchant);
      if (dateFrom) queryParams.append("dateFrom", dateFrom);
      if (dateTo) queryParams.append("dateTo", dateTo);
      if (productType) queryParams.append("productType", productType);
      if (brand) queryParams.append("brand", brand);
      if (nsu) queryParams.append("nsu", nsu);
      if (method) queryParams.append("method", method);
      if (salesChannel) queryParams.append("salesChannel", salesChannel);
      if (terminal) queryParams.append("terminal", terminal);
      if (valueMin) queryParams.append("valueMin", valueMin);
      if (valueMax) queryParams.append("valueMax", valueMax);
      queryParams.append("page", page.toString());
      queryParams.append("pageSize", pageSize.toString());

      const response = await fetch(
        `/api/export-transactions?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Erro na resposta: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transacoes.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao gerar Excel:", error);
      alert("Erro ao gerar o Excel. Verifique o console para mais detalhes.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={onGetExportTransactions}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <FileText className="w-4 h-4 mr-2" />
        {isLoading ? "Gerando..." : "Gerar Relatório"}
      </Button>
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-[#1f1f1f] border border-[#2a2a2a] p-4 rounded-md shadow-lg">
            <span className="text-sm font-medium text-white">
              Exportando Excel...
            </span>
          </div>
        </div>
      )}
    </>
  );
}

