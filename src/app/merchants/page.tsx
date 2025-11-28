import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import PageSizeSelector from "@/components/page-size-selector";
import PaginationRecords from "@/components/pagination-Records";
import { EmptyState } from "@/components/empty-state";
import { Search } from "lucide-react";
import { requireMerchantsAccess } from "@/lib/permissions/require-merchants-access";
import { getAllMerchants, getAvailableCustomersForFilter, getMerchantSuggestions } from "@/features/merchants/server/merchants";
import { MerchantsFilter } from "@/features/merchants/_components/merchants-filter";
import { MerchantsSearchInput } from "@/features/merchants/_components/merchants-search-input";
import MerchantsList from "@/features/merchants/_components/merchants-list";
import { MerchantsDashboardWrapper } from "@/features/merchants/_components/merchants-dashboard-wrapper";
import { MerchantsSyncButton } from "@/features/merchants/_components/merchants-sync-button";

export const revalidate = 300;

type MerchantsPageProps = {
  page?: string;
  pageSize?: string;
  search?: string;
  customerId?: string;
  establishment?: string;
  status?: string;
  state?: string;
  dateFrom?: string;
  email?: string;
  cnpj?: string;
  active?: string;
  salesAgent?: string;
};

export default async function MerchantsPage({
  searchParams,
}: {
  searchParams: Promise<MerchantsPageProps>;
}) {
  // Verificar acesso
  await requireMerchantsAccess();

  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || "1");
  const pageSize = parseInt(resolvedSearchParams.pageSize || "20");
  const search = resolvedSearchParams.search || "";

  // Buscar dados em paralelo
  const [merchantsData, availableCustomers, merchantSuggestions] = await Promise.all([
    getAllMerchants(
      page,
      pageSize,
      {
        search,
        customerId: resolvedSearchParams.customerId
          ? parseInt(resolvedSearchParams.customerId)
          : undefined,
        establishment: resolvedSearchParams.establishment,
        status: resolvedSearchParams.status,
        state: resolvedSearchParams.state,
        dateFrom: resolvedSearchParams.dateFrom,
        email: resolvedSearchParams.email,
        cnpj: resolvedSearchParams.cnpj,
        active: resolvedSearchParams.active,
        salesAgent: resolvedSearchParams.salesAgent,
      }
    ),
    getAvailableCustomersForFilter(),
    getMerchantSuggestions(),
  ]);

  const totalRecords = merchantsData.totalCount;

  return (
    <>
      <BaseHeader
        breadcrumbItems={[
          { title: "Estabelecimentos", subtitle: "", url: "/merchants" },
        ]}
      />

      <BaseBody
        title="Estabelecimentos"
        subtitle="Visualização de Todos os Estabelecimentos"
      >
        <div className="flex flex-col space-y-2">
          <MerchantsDashboardWrapper data={merchantsData}>
            <MerchantsFilter
              dateFromIn={resolvedSearchParams.dateFrom}
              establishmentIn={resolvedSearchParams.establishment}
              statusIn={resolvedSearchParams.status}
              stateIn={resolvedSearchParams.state}
              emailIn={resolvedSearchParams.email}
              cnpjIn={resolvedSearchParams.cnpj}
              activeIn={resolvedSearchParams.active}
              salesAgentIn={resolvedSearchParams.salesAgent}
              customerIdIn={resolvedSearchParams.customerId}
              availableCustomers={availableCustomers}
            />
            <MerchantsSearchInput suggestions={merchantSuggestions} />
            <MerchantsSyncButton />
          </MerchantsDashboardWrapper>

          <div className="mt-2">
            {merchantsData.merchants.length === 0 ? (
              <EmptyState
                icon={Search}
                title="Nenhum resultado encontrado"
                description="Tente ajustar os filtros para encontrar estabelecimentos"
              />
            ) : (
              <MerchantsList list={merchantsData} />
            )}
            {totalRecords > 0 && (
              <div className="flex items-center justify-between mt-4">
                <PageSizeSelector
                  currentPageSize={pageSize}
                  pageName="merchants"
                />
                <PaginationRecords
                  totalRecords={totalRecords}
                  currentPage={page}
                  pageSize={pageSize}
                  pageName="merchants"
                />
              </div>
            )}
          </div>
        </div>
      </BaseBody>
    </>
  );
}

