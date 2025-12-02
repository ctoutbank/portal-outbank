import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsFilters } from "@/features/transactions/_components/analytics/analytics-filters";
import { AnalyticsKPICards } from "@/features/transactions/_components/analytics/analytics-kpi-cards";
import { AnalyticsTimeSeriesChart } from "@/features/transactions/_components/analytics/analytics-time-series-chart";
import { AnalyticsBreakdownByBrand } from "@/features/transactions/_components/analytics/analytics-breakdown-by-brand";
import { AnalyticsBreakdownByProduct } from "@/features/transactions/_components/analytics/analytics-breakdown-by-product";
import { AnalyticsBreakdownByStatus } from "@/features/transactions/_components/analytics/analytics-breakdown-by-status";
import { AnalyticsCustomerComparison } from "@/features/transactions/_components/analytics/analytics-customer-comparison";
import {
  getAnalyticsKPIs,
  getAnalyticsTimeSeries,
  getAnalyticsByDimension,
  getAnalyticsByCustomer,
  type AnalyticsKPIs,
  type TimeSeriesDataPoint,
  type DimensionData,
  type CustomerComparison,
} from "@/features/transactions/serverActions/analytics";
import { getAvailableCustomersForTransactions } from "@/features/transactions/serverActions/transaction";
import { checkPagePermission } from "@/lib/auth/check-permissions";
import { getEndOfDay, getStartOfDay } from "@/lib/datetime-utils";
import { Suspense } from "react";

type AnalyticsProps = {
  dateFrom?: string;
  dateTo?: string;
  customerIds?: string; // Comma-separated customer IDs
  groupBy?: "day" | "week" | "month";
};

async function AnalyticsContent({
  searchParams,
  availableCustomers,
}: {
  searchParams: AnalyticsProps;
  availableCustomers: Array<{ id: number; name: string | null }>;
}) {
  const dateFrom = searchParams.dateFrom || getStartOfDay();
  const dateTo = searchParams.dateTo || getEndOfDay();
  const groupBy = searchParams.groupBy || "day";
  
  const customerIds = searchParams.customerIds
    ? searchParams.customerIds.split(",").map((id) => parseInt(id.trim())).filter((id) => !isNaN(id))
    : undefined;

  // Fetch all analytics data in parallel
  let kpis: AnalyticsKPIs;
  let timeSeries: TimeSeriesDataPoint[];
  let brandData: DimensionData[];
  let productData: DimensionData[];
  let statusData: DimensionData[];
  let customerComparison: CustomerComparison[];
  
  try {
    [
      kpis,
      timeSeries,
      brandData,
      productData,
      statusData,
      customerComparison,
    ] = await Promise.all([
      getAnalyticsKPIs(dateFrom, dateTo, customerIds),
      getAnalyticsTimeSeries(dateFrom, dateTo, groupBy, customerIds),
      getAnalyticsByDimension("brand", dateFrom, dateTo, customerIds),
      getAnalyticsByDimension("productType", dateFrom, dateTo, customerIds),
      getAnalyticsByDimension("transactionStatus", dateFrom, dateTo, customerIds),
      getAnalyticsByCustomer(dateFrom, dateTo, customerIds),
    ]);
  } catch (error) {
    console.error("Erro ao buscar dados de analytics:", error);
    // Valores padrão em caso de erro
    kpis = {
      totalTransacoes: 0,
      totalValor: 0,
      valorMedio: 0,
      taxaAprovacao: 0,
      taxaNegacao: 0,
    };
    timeSeries = [];
    brandData = [];
    productData = [];
    statusData = [];
    customerComparison = [];
  }

  return (
    <>
      <div className="flex flex-col space-y-6 max-w-[1600px] mx-auto">
        <AnalyticsFilters
          dateFromIn={dateFrom}
          dateToIn={dateTo}
          customerIdsIn={searchParams.customerIds}
          availableCustomers={availableCustomers}
        />

        <AnalyticsKPICards kpis={kpis} />

        <AnalyticsTimeSeriesChart data={timeSeries} groupBy={groupBy} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AnalyticsBreakdownByBrand data={brandData} />
          <AnalyticsBreakdownByProduct data={productData} />
          <AnalyticsBreakdownByStatus data={statusData} />
        </div>

        {customerComparison.length > 1 && (
          <AnalyticsCustomerComparison data={customerComparison} />
        )}
      </div>
    </>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<AnalyticsProps>;
}) {
  await checkPagePermission("Lançamentos Financeiros");

  // Buscar customers disponíveis baseado em permissões
  const availableCustomers = await getAvailableCustomersForTransactions();

  const resolvedSearchParams = await searchParams;

  return (
    <>
      <BaseHeader
        breadcrumbItems={[
          { title: "Analytics", subtitle: "", url: "/analytics" },
        ]}
      />
      <BaseBody
        title=""
        subtitle=""
        className="bg-[#1a1a1a]"
      >
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold text-white mb-2">
            Analytics de Transações
          </h1>
          <p className="text-sm text-[#808080]">
            Análise completa de métricas e comparação entre ISOs
          </p>
        </div>
        <Suspense
          fallback={
            <div className="flex flex-col space-y-4">
              <Skeleton className="h-20 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
              <Skeleton className="h-[400px] w-full" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-[300px]" />
                <Skeleton className="h-[300px]" />
                <Skeleton className="h-[300px]" />
              </div>
            </div>
          }
        >
          <AnalyticsContent
            searchParams={resolvedSearchParams}
            availableCustomers={availableCustomers}
          />
        </Suspense>
      </BaseBody>
    </>
  );
}

