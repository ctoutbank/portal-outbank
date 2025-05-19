import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { Button } from "@/components/ui/button";
import PaginationRecords from "@/components/ui/pagination-Records";
import SolicitationFeeList from "@/features/solicitationfee/_componentes/solicitationfee-list";
import { getSolicitationFees } from "@/features/solicitationfee/server/solicitationfee";
import { Plus } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

type SolicitationFeePageProps = {
  page?: number;
  perPage?: number;
  search?: string;
  cnae?: string;
  status?: string;
}

export default async function SolicitationFeePage({searchParams}: {searchParams: Promise<SolicitationFeePageProps>}) {
  // Aguarda searchParams antes de acessar suas propriedades
  const params = await searchParams;
  
  const page = parseInt(params.page?.toString() || "1");
  const perPage = parseInt(params.perPage?.toString() || "10");
 
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
        breadcrumbItems={[{ title: "Solicitações de Taxas", url: "/solicitationfee" }]}
      />

      <BaseBody title="Solicitações de Taxas" subtitle="Visualização de todas as solicitações de taxas">
        <div className="flex flex-col space-y-4">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex-1">
              {/* Filtros podem ser adicionados aqui, similar ao CustomersFilter */}
            </div>
            <Button asChild className="ml-2">
              <Link href="/solicitationfee/0">
                <Plus className="h-4 w-4 mr-1" />
                Nova Solicitação
              </Link>
            </Button>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="max-w-md">
              {/* Aqui você pode adicionar um componente de dashboard se necessário */}
            </div>
          </div>

          <SolicitationFeeList SolicitationFees={solicitationFees} />

          {totalCount > 0 && (
            <div>
              <PaginationRecords totalRecords={totalCount} currentPage={page} pageSize={perPage} pageName="solicitationfee" />
            </div>
          )}
        </div>
      </BaseBody>
    </>
  );
} 