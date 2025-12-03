import CardValue from "@/components/dashboard/cardValue";
import { EmptyState } from "@/components/empty-state";
import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { Card, CardContent } from "@/components/ui/card";
import { LazyClosingChart } from "@/components/lazy/LazyClosingChart";
import DashboardFilters from "@/features/closing/components/dashboard-filters";
import TransactionsExport from "@/features/closing/components/export-excel";
import { TransactionsDashboardTable } from "@/features/transactions/_components/transactions-dashboard-table";
import { NonProcessedSummaryTable } from "@/features/transactions/_components/non-processed-summary-table";
import { BrandSummaryTable } from "@/features/transactions/_components/brand-summary-table";
import { BrandSummaryPrePaidTable } from "@/features/transactions/_components/brand-summary-prepaid-table";
import {
  getTotalMerchants,
  getTotalTransactions,
  getTotalTransactionsByMonth,
  getTransactionsGroupedReport,
  normalizeDateRange,
} from "@/features/transactions/serverActions/transaction";
import { gateDateByViewMode, getPreviousPeriodFromRange } from "@/lib/utils";
import { Search } from "lucide-react";
import { Suspense } from "react";
import { checkPagePermission } from "@/lib/auth/check-permissions";

type ClosingSearchParams = {
  viewMode?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  merchant?: string;
  productType?: string;
  brand?: string;
  method?: string;
  salesChannel?: string;
  terminal?: string;
  valueMin?: string;
  valueMax?: string;
};

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function SalesDashboard({
  searchParams,
}: {
  searchParams: Promise<ClosingSearchParams & {
    viewMode: string;
    dateFrom: string;
    dateTo: string;
  }>;
}) {
  await checkPagePermission("Lançamentos Financeiros");

  const resolvedSearchParams = await searchParams;
  const viewMode = resolvedSearchParams.viewMode || "month";

  const { period, previousPeriod } = gateDateByViewMode(viewMode);
  let previousRange: { from: string; to: string } = { from: "", to: "" };
  if (resolvedSearchParams.dateFrom || resolvedSearchParams.dateTo) {
    previousRange = getPreviousPeriodFromRange(
      resolvedSearchParams.dateFrom || period.from,
      resolvedSearchParams.dateTo || period.to
    );
  }

  const dateRange = await normalizeDateRange(
    resolvedSearchParams.dateFrom ? resolvedSearchParams.dateFrom : period.from,
    resolvedSearchParams.dateTo ? resolvedSearchParams.dateTo : period.to
  );
  const dateRangePrevious = await normalizeDateRange(
    resolvedSearchParams.dateFrom ? previousRange.from : previousPeriod.from!,
    resolvedSearchParams.dateTo ? previousRange.to : previousPeriod.to!
  );

  const totalTransactions = await getTotalTransactions(
    dateRange.start!,
    dateRange.end!
  );

  const totalTransactionsPreviousPeriod = await getTotalTransactions(
    dateRangePrevious.start!,
    dateRangePrevious.end!
  );

  const totalTransactionsByMonth = await getTotalTransactionsByMonth(
    dateRange.start!,
    dateRange.end!,
    viewMode
  );

  const totalMerchants = await getTotalMerchants();

  const transactionsGroupedReport = await getTransactionsGroupedReport(
    dateRange.start!,
    dateRange.end!,
    resolvedSearchParams.status,
    resolvedSearchParams.productType,
    resolvedSearchParams.brand,
    resolvedSearchParams.method,
    resolvedSearchParams.salesChannel,
    resolvedSearchParams.terminal,
    resolvedSearchParams.valueMin,
    resolvedSearchParams.valueMax,
    resolvedSearchParams.merchant
  );

  // Função para exibir exportação apenas se o mês acabou ou hoje é o último dia do mês atual
  function canShowExport(dateToStr: string) {
    const dateTo = new Date(dateToStr);
    const today = new Date();

    // Mês já acabou
    if (dateTo < today) return true;

    // Hoje é o último dia do mês atual
    const isTodayLastDay =
      today.getDate() ===
      new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    const isSameMonthAndYear =
      dateTo.getFullYear() === today.getFullYear() &&
      dateTo.getMonth() === today.getMonth();

    if (isTodayLastDay && isSameMonthAndYear) return true;

    return false;
  }

  const showExport = canShowExport(
    resolvedSearchParams.dateTo || period.to
  );

  return (
    <>
      <BaseHeader
        breadcrumbItems={[{ title: "Fechamento", subtitle: "", url: "/portal/closing" }]}
      />
      <BaseBody title="Fechamento" subtitle={``} className="bg-[#1a1a1a]">
        <div className="mb-4 ml-1 flex items-center justify-between">
          <DashboardFilters
            dateRange={{
              from: dateRange.start ?? period.from,
              to: dateRange.end ?? period.to,
            }}
          />
          <div>{showExport && <TransactionsExport />}</div>
        </div>

        <Suspense fallback={<div className="text-white">Carregando...</div>}>
          {totalTransactions[0]?.count === 0 ? (
            <EmptyState
              icon={Search}
              title="Nenhum resultado encontrado"
              description=""
            />
          ) : (
            <>
              {/* Primeira linha: 4 cards */}
              <Card className="w-full border-l-8 border-black bg-transparent border-[#2a2a2a]">
                <CardContent className="p-6">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      <CardValue
                        title="Bruto total"
                        description="Total bruto das transações"
                        value={totalTransactions[0]?.sum || 0}
                        percentage={
                          totalTransactions[0]?.sum &&
                          totalTransactionsPreviousPeriod[0]?.sum
                            ? (
                                ((totalTransactions[0]?.sum -
                                  totalTransactionsPreviousPeriod[0]?.sum) /
                                  totalTransactionsPreviousPeriod[0]?.sum) *
                                100
                              ).toFixed(2)
                            : "0"
                        }
                        previousValue={totalTransactionsPreviousPeriod[0]?.sum}
                        valueType="currency"
                      />
                      <CardValue
                        title="Lucro total"
                        description="Total de lucro realizado"
                        value={totalTransactions[0]?.revenue || 0}
                        percentage={
                          totalTransactions[0]?.revenue &&
                          totalTransactionsPreviousPeriod[0]?.revenue
                            ? (
                                ((totalTransactions[0]?.revenue -
                                  totalTransactionsPreviousPeriod[0]?.revenue) /
                                  totalTransactionsPreviousPeriod[0]?.revenue) *
                                100
                              ).toFixed(2)
                            : "0"
                        }
                        previousValue={
                          totalTransactionsPreviousPeriod[0]?.revenue
                        }
                        valueType="currency"
                      />
                      <CardValue
                        title="Transações realizadas"
                        description="Total de transações realizadas"
                        value={totalTransactions[0]?.count || 0}
                        percentage={
                          totalTransactionsPreviousPeriod[0]?.count &&
                          totalTransactions[0]?.count
                            ? (
                                ((totalTransactions[0]?.count -
                                  totalTransactionsPreviousPeriod[0]?.count) /
                                  totalTransactionsPreviousPeriod[0]?.count) *
                                100
                              ).toFixed(2)
                            : "0"
                        }
                        previousValue={totalTransactionsPreviousPeriod[0]?.count}
                        valueType="number"
                      />
                      <CardValue
                        title="Estabelecimentos cadastrados"
                        description="Total de estabelecimentos cadastrados"
                        value={
                          Array.isArray(totalMerchants)
                            ? totalMerchants[0]?.total || 0
                            : 0
                        }
                        percentage={"0"}
                        previousValue={
                          Array.isArray(totalMerchants)
                            ? totalMerchants[0]?.total || 0
                            : 0
                        }
                        valueType="number"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Segunda linha: gráfico inteiro */}
              <div className="mt-4">
                <LazyClosingChart
                  chartData={totalTransactionsByMonth}
                  viewMode={viewMode}
                />
              </div>

              {/* Terceira linha: 2 cards - Transações Vendas e Não processadas */}
              <div className="mt-4">
                <NonProcessedSummaryTable transactions={transactionsGroupedReport} />
              </div>

              {/* Quarta linha: 2 cards - Transações Débito por Bandeira e Crédito por Bandeira */}
              <div className="mt-4">
                <BrandSummaryTable transactions={transactionsGroupedReport} />
              </div>

              {/* Quinta linha: 2 cards - Débito Pré-pago por Bandeira e Crédito Pré-pago por Bandeira */}
              <div className="mt-4">
                <BrandSummaryPrePaidTable transactions={transactionsGroupedReport} />
              </div>
            </>
          )}
          <div>
            <TransactionsDashboardTable
              transactions={transactionsGroupedReport}
            />
          </div>
        </Suspense>
      </BaseBody>
    </>
  );
}

