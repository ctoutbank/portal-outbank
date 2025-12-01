"use client";
import { Button } from "@/components/ui/button";
import { exportToExcelTransactions } from "@/utils/export-to-excel-transactions";
import axios from "axios";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TransactionsExcelExportButtonProps {
  filters: Record<string, string | undefined>;
  globalStyles?: any;
  sheetName: string;
  fileName: string;
}

export function TransactionsExport({
                                                filters,
                                                fileName,
                                              }: TransactionsExcelExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleExport() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await axios.get(`/api/export-transactions?${params.toString()}`);
        console.log("res.data:", res.data);
        console.log("transactions:", res.data.transactions);

      if (!res.data.transactions || res.data.transactions.length === 0) {
        toast.error("Nenhum dado encontrado para exportar.");
        return;
      }

      await exportToExcelTransactions({
        transactions: res.data.transactions, fileName
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
      <div className="flex items-center">
        <Button
            onClick={handleExport}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isLoading ? "Carregando..." : "Exportar"}
        </Button>
      </div>
  );
}

