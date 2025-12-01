import { TransactionsGroupedReport } from "../serverActions/transaction";
import { TransactionsDashboardCards } from "./transactions-dashboard-cards";

interface TransactionsDashboardTableProps {
  transactions: TransactionsGroupedReport[];
}

export function TransactionsDashboardTable({
  transactions,
}: TransactionsDashboardTableProps) {
  return <TransactionsDashboardCards transactions={transactions} />;
}

