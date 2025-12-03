import { getBrandLabel } from "@/lib/lookuptables/lookuptables-transactions";
import { TransactionsGroupedReport } from "../serverActions/transaction";
import {
    SummaryTableItem,
    TransactionSummaryTable,
} from "./transaction-summary-table";

interface BrandSummaryTableProps {
    transactions: TransactionsGroupedReport[];
}

// Lista de todas as bandeiras possíveis que devem aparecer mesmo que não tenham valores
const allBrands = ["VISA", "MASTERCARD", "ELO", "HIPERCARD", "AMEX", "CABAL"];

export function BrandSummaryPrePaidTable({ transactions }: BrandSummaryTableProps) {
    const productTypes = [
        { label: "Débito Pré-pago por Bandeira", value: "PREPAID_DEBIT" },
        { label: "Crédito Pré-pago por Bandeira", value: "PREPAID_CREDIT" },
    ];

    return (
        <div className="grid grid-cols-2 gap-4">
            {productTypes.map(({ label, value }) => {
                // Filtrar por tipo de produto
                const filteredTransactions = transactions.filter(
                    (t) => t.product_type === value
                );

                // Inicializa o objeto com todas as bandeiras com valor 0
                const transactionsByBrand = allBrands.reduce((acc, brand) => {
                    acc[brand] = {
                        brand,
                        count: 0,
                        totalAmount: 0,
                    };
                    return acc;
                }, {} as Record<string, { brand: string; count: number; totalAmount: number }>);

                // Adiciona os valores reais (somente com brand válida)
                filteredTransactions.forEach((curr) => {
                    if (
                        (curr.transaction_status === "AUTHORIZED" || curr.transaction_status === "PENDING") &&
                        curr.brand && curr.brand.trim()
                    ) {
                        const brand = curr.brand;
                        if (!transactionsByBrand[brand]) {
                            transactionsByBrand[brand] = {
                                brand,
                                count: 0,
                                totalAmount: 0,
                            };
                        }
                        transactionsByBrand[brand].count += Number(curr.count);
                        transactionsByBrand[brand].totalAmount += Number(curr.total_amount);
                    }
                });

                const totalGeral = Object.values(transactionsByBrand).reduce(
                    (acc, curr) => ({
                        quantidade: acc.quantidade + curr.count,
                        valorTotal: acc.valorTotal + curr.totalAmount,
                    }),
                    { quantidade: 0, valorTotal: 0 }
                );

                // Monta os itens da tabela, ignorando brands nulas/vazias ou sem label válida
                const items: SummaryTableItem[] = Object.values(transactionsByBrand)
                    .filter(
                        (item) =>
                            item.brand &&
                            item.brand.trim() &&
                            getBrandLabel(item.brand)
                    )
                    .map((item) => ({
                        id: `brand-${value}-${item.brand}`,
                        label: getBrandLabel(item.brand) || item.brand,
                        count: item.count,
                        totalAmount: item.totalAmount,
                    }));

                return (
                    <TransactionSummaryTable
                        key={value}
                        items={items}
                        total={totalGeral}
                        labelHeader={label}
                        headerbg="bg-zinc-800 text-white"
                    />
                );
            })}
        </div>
    );
}

