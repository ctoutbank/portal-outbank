import {
    getTransactionProductTypeLabel,
    getTransactionStatusLabel,
    transactionProductTypeList,
} from "@/lib/lookuptables/lookuptables-transactions";
import { TransactionsGroupedReport } from "../serverActions/transaction";
import {
    SummaryTableItem,
    TransactionSummaryTable,
} from "./transaction-summary-table";

interface NonProcessedSummaryTableProps {
    transactions: TransactionsGroupedReport[];
}

export function NonProcessedSummaryTable({
                                             transactions,
                                         }: NonProcessedSummaryTableProps) {
    // Agrupamento por Tipo de Produto (vendas)
    const initialTransactionsByType = transactionProductTypeList.reduce(
        (acc, { value }) => {
            acc[value] = {
                productType: value,
                count: 0,
                totalAmount: 0,
            };
            return acc;
        },
        {} as Record<
            string,
            {
                productType: string;
                count: number;
                totalAmount: number;
            }
        >
    );

    const transactionsByType = transactions.reduce((acc, curr) => {
        if (
            curr.transaction_status === "AUTHORIZED" ||
            curr.transaction_status === "PENDING"
        ) {
            acc[curr.product_type].count += Number(curr.count);
            acc[curr.product_type].totalAmount += Number(curr.total_amount);
        }
        return acc;
    }, initialTransactionsByType);

    const totalGeralVendas = Object.values(transactionsByType).reduce(
        (acc, curr) => ({
            quantidade: acc.quantidade + curr.count,
            valorTotal: acc.valorTotal + curr.totalAmount,
        }),
        { quantidade: 0, valorTotal: 0 }
    );

    const itemsVendas: SummaryTableItem[] = Object.values(transactionsByType)
        .filter((item) => item.count > 0 || item.totalAmount > 0)
        .map((item) => ({
            id: `type-${item.productType}`,
            label: getTransactionProductTypeLabel(item.productType) || item.productType,
            count: item.count,
            totalAmount: item.totalAmount,
        }));

    // Agrupamento por Status Não Processado
    const nonProcessedStatuses = ["DENIED", "PENDING", "CANCELED"];
    const filteredTransactions = transactions.filter((t) =>
        nonProcessedStatuses.includes(t.transaction_status)
    );

    const transactionsByStatus = filteredTransactions.reduce(
        (acc, curr) => {
            if (!acc[curr.transaction_status]) {
                acc[curr.transaction_status] = {
                    status: curr.transaction_status,
                    count: 0,
                    totalAmount: 0,
                };
            }

            acc[curr.transaction_status].count += Number(curr.count);
            acc[curr.transaction_status].totalAmount += Number(curr.total_amount);

            return acc;
        },
        {} as Record<
            string,
            {
                status: string;
                count: number;
                totalAmount: number;
            }
        >
    );

    const totalGeralNaoProcessadas = Object.values(transactionsByStatus).reduce(
        (acc, curr) => ({
            quantidade: acc.quantidade + curr.count,
            valorTotal: acc.valorTotal + curr.totalAmount,
        }),
        { quantidade: 0, valorTotal: 0 }
    );

    const itemsNaoProcessadas: SummaryTableItem[] = Object.values(transactionsByStatus).map(
        (item) => ({
            id: `nonprocessed-${item.status}`,
            label: getTransactionStatusLabel(item.status) || item.status,
            count: item.count,
            totalAmount: item.totalAmount,
        })
    );

    return (
        <div className="grid grid-cols-2 gap-4">
            <TransactionSummaryTable
                items={itemsVendas}
                total={totalGeralVendas}
                labelHeader="Vendas"
                headerbg="bg-zinc-600 text-white"
                headersViews={[{ label: "Vendas", value: "SALES" }]}
            />

            <TransactionSummaryTable
                items={itemsNaoProcessadas}
                total={totalGeralNaoProcessadas}
                labelHeader="Não processadas"
                headerbg="bg-zinc-500 text-white"
                headersViews={[{ label: "Não processadas", value: "NON_PROCESSED" }]}
            />
        </div>
    );
}

