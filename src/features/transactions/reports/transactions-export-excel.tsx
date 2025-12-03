"use client";
import { Button } from "@/components/ui/button";
import { exportToExcelTransactions } from "@/utils/export-to-excel-transactions";
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

      const res = await fetch(`/api/export-transactions?${params.toString()}`);
      
      if (!res.ok) {
        toast.error("Erro ao buscar dados para exportação.");
        return;
      }

      const data = await res.json();
      console.log("res.data:", data);
      console.log("transactions:", data.transactions);

      if (!data.transactions || data.transactions.length === 0) {
        toast.error("Nenhum dado encontrado para exportar.");
        return;
      }

      await exportToExcelTransactions({
        transactions: data.transactions, fileName
      });
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar transações.");
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
            className="flex items-center gap-2 bg-black text-white border-none rounded-md h-9 px-4 text-sm font-medium hover:bg-[#2a2a2a] transition-all"
        >
          <Download className="h-4 w-4" />
          {isLoading ? "Carregando..." : "Exportar"}
        </Button>
      </div>
  );
}

