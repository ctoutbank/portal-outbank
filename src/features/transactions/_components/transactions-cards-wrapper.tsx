"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { TransactionsDashboardTable } from "./transactions-dashboard-table";
import { TransactionsGroupedReport } from "../serverActions/transaction";

interface TransactionsCardsWrapperProps {
  transactions: TransactionsGroupedReport[];
}

export function TransactionsCardsWrapper({
  transactions,
}: TransactionsCardsWrapperProps) {
  const [showCards, setShowCards] = useState(true);

  return (
    <>
      {showCards && (
        <div>
          <TransactionsDashboardTable transactions={transactions} />
        </div>
      )}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Lista de Transações</h2>
          <Button
            onClick={() => setShowCards(!showCards)}
            variant="outline"
            className="bg-[#1f1f1f] border border-[#2a2a2a] rounded-md h-9 px-4 text-white text-sm hover:bg-[#252525] hover:border-[#3a3a3a] transition-all flex items-center gap-2"
          >
            {showCards ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Ocultar Cards
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Mostrar Cards
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

