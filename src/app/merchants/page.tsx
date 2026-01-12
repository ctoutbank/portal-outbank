import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { requireMerchantsAccess } from "@/lib/permissions/require-merchants-access";
import { getAllMerchants, getAvailableCustomersForFilter, getMerchantSuggestions, getMerchantEmailSuggestions, getMerchantDocumentSuggestions, getSalesAgentSuggestions, getStateSuggestions } from "@/features/merchants/server/merchants";
import { MerchantsPageClient } from "@/features/merchants/_components/merchants-page-client";
import { shouldMaskSensitiveData } from "@/lib/permissions/check-permissions";

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
  const [merchantsData, availableCustomers, merchantSuggestions, emailSuggestions, documentSuggestions, salesAgentSuggestions, stateSuggestions, shouldMask] = await Promise.all([
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
    getMerchantEmailSuggestions(),
    getMerchantDocumentSuggestions(),
    getSalesAgentSuggestions(),
    getStateSuggestions(),
    shouldMaskSensitiveData(),
  ]);

  const totalRecords = merchantsData.totalCount;

  return (
    <>
      <BaseHeader
        breadcrumbItems={[
          { title: "Estabelecimentos" },
        ]}
        showBackButton={true}
        backHref="/"
      />

      <BaseBody
        title="Estabelecimentos"
        subtitle="Visualização de Todos os Estabelecimentos"
      >
        <MerchantsPageClient 
          data={merchantsData}
          availableCustomers={availableCustomers}
          merchantSuggestions={merchantSuggestions}
          emailSuggestions={emailSuggestions}
          documentSuggestions={documentSuggestions}
          salesAgentSuggestions={salesAgentSuggestions}
          stateSuggestions={stateSuggestions}
          resolvedSearchParams={resolvedSearchParams}
          totalRecords={totalRecords}
          page={page}
          pageSize={pageSize}
          shouldMaskData={shouldMask}
        />
      </BaseBody>
    </>
  );
}

