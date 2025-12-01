import { EmptyState } from "@/components/empty-state";
import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import PageSizeSelector from "@/components/page-size-selector";
import PaginationRecords from "@/components/pagination-Records";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionsDashboardTable } from "@/features/transactions/_components/transactions-dashboard-table";
import { TransactionsFilter } from "@/features/transactions/_components/transactions-filter";
import TransactionsList from "@/features/transactions/_components/transactions-list";
import {
  getTransactions,
  getTransactionsGroupedReport,
  getAvailableCustomersForTransactions,
} from "@/features/transactions/serverActions/transaction";
import { checkPagePermission } from "@/lib/auth/check-permissions";
import { getEndOfDay } from "@/lib/datetime-utils";
import { Search } from "lucide-react";
import { Suspense } from "react";
import { TransactionsExport } from "@/features/transactions/reports/transactions-export-excel";
import { syncTransactions } from "@/features/pricingSolicitation/server/integrations/dock/sync-transactions/main";

type TransactionsProps = {
  page?: string;
  pageSize?: string;
  perPage?: string;
  search?: string;
  status?: string;
  merchant?: string;
  dateFrom?: string;
  dateTo?: string;
  productType?: string;
  brand?: string;
  nsu?: string;
  method?: string;
  salesChannel?: string;
  terminal?: string;
  valueMin?: string;
  valueMax?: string;
  customer?: string;
  sortBy?: string;
  sortOrder?: string;
};

async function TransactionsContent({
                                     searchParams,
                                     availableCustomers,
                                   }: {
  searchParams: TransactionsProps;
  availableCustomers: Array<{ id: number; name: string | null }>;
}) {
  const page = parseInt(searchParams.page || "1");
  const pageSize = parseInt(searchParams.perPage || searchParams.pageSize || "10");

  const dateFrom = searchParams.dateFrom || "2024-09-01T00:00";
  const dateTo = searchParams.dateTo || getEndOfDay();

  const sortBy = searchParams.sortBy || "dtInsert";
  const sortOrder = searchParams.sortOrder as "asc" | "desc" | undefined;

  // 🚀 Aqui montamos os filtros para passar pro botão
  const filters = {
    search: searchParams.search,
    status: searchParams.status,
    merchant: searchParams.merchant,
    dateFrom,
    dateTo,
    productType: searchParams.productType,
    brand: searchParams.brand,
    nsu: searchParams.nsu,
    method: searchParams.method,
    salesChannel: searchParams.salesChannel,
    terminal: searchParams.terminal,
    valueMin: searchParams.valueMin,
    valueMax: searchParams.valueMax,
    customer: searchParams.customer,
  };

  const [transactionList, transactionsGroupedReport] = await Promise.all([
    syncTransactions().then(() => 
    getTransactions(
      page,
      pageSize,
      searchParams.status,
      searchParams.merchant,
      dateFrom,
      dateTo,
      searchParams.productType,
      searchParams.brand,
      searchParams.nsu,
      searchParams.method,
      searchParams.salesChannel,
      searchParams.terminal,
      searchParams.valueMin,
      searchParams.valueMax,
      searchParams.customer,
      {
        sortBy,
        sortOrder,
      }
    )),
    getTransactionsGroupedReport(
      dateFrom,
      dateTo,
      searchParams.status,
      searchParams.productType,
      searchParams.brand,
      searchParams.method,
      searchParams.salesChannel,
      searchParams.terminal,
      searchParams.valueMin,
      searchParams.valueMax,
      searchParams.merchant,
      searchParams.customer
    )
  ]);

  return (
      <>
        <div className="flex flex-col space-y-4 max-w-[1600px] mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <TransactionsFilter
                  statusIn={searchParams.status}
                  merchantIn={searchParams.merchant}
                  dateFromIn={dateFrom}
                  dateToIn={dateTo}
                  productTypeIn={searchParams.productType}
                  brandIn={searchParams.brand}
                  nsuIn={searchParams.nsu}
                  methodIn={searchParams.method}
                  salesChannelIn={searchParams.salesChannel}
                  terminalIn={searchParams.terminal}
                  valueMinIn={searchParams.valueMin}
                  valueMaxIn={searchParams.valueMax}
                  customerIn={searchParams.customer}
                  availableCustomers={availableCustomers}
              />
            </div>
            <TransactionsExport
                filters={filters}
                sheetName="Transações"
                fileName="transacoes.xlsx"
            />
          </div>

          <div>
            <TransactionsDashboardTable
                transactions={transactionsGroupedReport}
            />
          </div>

          <div className="mt-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Lista de Transações</h2>
            </div>
            {transactionList.transactions.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="Nenhum resultado encontrado"
                    description=""
                />
            ) : (
                <>
                  <TransactionsList transactions={transactionList.transactions} />
                  {transactionList.totalCount > 0 && (
                      <div className="flex items-center justify-between py-5 px-6 bg-[#1a1a1a] border-t border-[#2a2a2a]">
                        <div className="flex items-center gap-3 text-[#808080] text-sm">
                          <span>Itens por página:</span>
                          <PageSizeSelector
                              currentPageSize={pageSize}
                              pageName="transactions"
                          />
                        </div>
                        <PaginationRecords
                            totalRecords={transactionList.totalCount}
                            currentPage={page}
                            pageSize={pageSize}
                            pageName="transactions"
                        />
                        <div className="text-[#808080] text-sm">
                          Total de Registros: <strong className="text-white font-semibold">{transactionList.totalCount.toLocaleString('pt-BR')}</strong>
                        </div>
                      </div>
                  )}
                </>
            )}
          </div>
        </div>
      </>
  );
}

export default async function TransactionsPage({
                                                 searchParams,
                                               }: {
  searchParams: Promise<TransactionsProps>;
}) {
  await checkPagePermission("Lançamentos Financeiros");

  // Buscar customers disponíveis baseado em permissões
  const availableCustomers = await getAvailableCustomersForTransactions();

  return (
      <>
        <BaseHeader
            breadcrumbItems={[{ title: "Vendas", subtitle: "", url: "/transactions" }]}
        />
        <BaseBody
            title=""
            subtitle=""
            className="bg-[#1a1a1a]"
        >
          <div className="mb-8">
            <h1 className="text-[28px] font-semibold text-white mb-2">Vendas</h1>
            <p className="text-sm text-[#808080]">Visualização de Todas as Vendas</p>
          </div>
          <Suspense
              fallback={
                <div className="flex flex-col space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <Skeleton className="h-10 w-[120px]" />
                      <Skeleton className="h-10 w-[150px]" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-10 w-[120px]" />
                      <Skeleton className="h-10 w-[120px]" />
                    </div>
                  </div>
                  <div className="rounded-md border">
                    <div className="p-4">
                      <div className="flex items-center gap-4 mb-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-4 w-[100px]" />
                        ))}
                      </div>
                      {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-4 mb-4">
                            {Array.from({ length: 6 }).map((_, j) => (
                                <Skeleton key={j} className="h-4 w-[100px]" />
                            ))}
                          </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <Skeleton className="h-8 w-[100px]" />
                    <Skeleton className="h-8 w-[300px]" />
                  </div>
                </div>
              }
          >
            <TransactionsContent 
              searchParams={await searchParams}
              availableCustomers={availableCustomers}
            />
          </Suspense>
        </BaseBody>
      </>
  );
}

