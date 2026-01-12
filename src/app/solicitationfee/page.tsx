import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import PageSizeSelector from "@/components/page-size-selector";
import PaginationRecords from "@/components/pagination-Records";
import SolicitationFeeList from "@/features/solicitationfee/_componentes/solicitationfee-list";
import { getSolicitationFees } from "@/features/solicitationfee/server/solicitationfee";

export default async function SolicitationFeePage({
                                                    searchParams,
                                                  }: {
  searchParams: Promise<{ page?: string; perPage?: string; search?: string; cnae?: string; status?: string }>;
}) {
  // Aguarda searchParams antes de acessar suas propriedades
  const params = await searchParams;
  
  const page = parseInt(params.page || "1", 10);
  const perPage = parseInt(params.perPage || "10", 10);

  const solicitationFees = await getSolicitationFees(
      params.search || "",
      page,
      perPage,
      params.cnae || "",
      params.status || ""
  );

  const totalCount = solicitationFees.totalCount;



  return (
    <>
      <BaseHeader
        breadcrumbItems={[
          { title: "Solicitações de Taxas" },
        ]}
        showBackButton={true}
        backHref="/"
      />

      <BaseBody
        title="Solicitações de Taxas"
        subtitle="Visualização de todas as solicitações de taxas"
        className="overflow-x-hidden"
      >
        <div className="flex flex-col space-y-4 w-full max-w-full overflow-x-hidden">
          <SolicitationFeeList SolicitationFees={solicitationFees} />

          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 w-full">
              <PageSizeSelector
                currentPageSize={perPage}
                pageName="solicitationfee"
              />
              <PaginationRecords
                totalRecords={totalCount}
                currentPage={page}
                pageSize={perPage}
                pageName="solicitationfee"
              />
            </div>
          )}
        </div>
      </BaseBody>
    </>
  );
}
