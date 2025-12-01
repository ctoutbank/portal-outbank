"use client";

import { TransactionsGroupedReport } from "../serverActions/transaction";
import { BrandSummaryTable } from "./brand-summary-table";
import { NonProcessedSummaryTable } from "./non-processed-summary-table";
import {BrandSummaryPrePaidTable} from "./brand-summary-prepaid-table";

interface TransactionsDashboardCardsProps {
  transactions: TransactionsGroupedReport[];
}

export function TransactionsDashboardCards({
  transactions,
}: TransactionsDashboardCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">

      {/* Card 1: Vendas e Transações Não Processadas */}
      <NonProcessedSummaryTable transactions={transactions} />

      {/* Card 2: Transações por Bandeira */}
      <BrandSummaryTable transactions={transactions} />

      {/* Card 3: Transações por Bandeira com Crédito/Débito pré-pago */}
      <BrandSummaryPrePaidTable transactions={transactions} />
        

    </div>
  );
}

