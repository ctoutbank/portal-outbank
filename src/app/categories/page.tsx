import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";

import PageSizeSelector from "@/components/page-size-selector";
import PaginationRecords from "@/components/pagination-Records";
import { Button } from "@/components/ui/button";
import { CategoriesDashboardContent } from "@/features/categories/_components/categories-dashboard-content";
import { CategoriesFilter } from "@/features/categories/_components/categories-filter";
import { getCategories } from "@/features/categories/server/category";
import { Plus } from "lucide-react";
import Link from "next/link";
import Categorylist from "@/features/categories/_components/categories-list";

export const revalidate = 0;

type CategoryProps = {
  page?: string;
  pageSize?: string;
  search?: string;
  sortField?: string;
  sortOrder?: string;
  name?: string;
  status?: string;
  mcc?: string;
  cnae?: string;
};

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<CategoryProps>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const pageSize = parseInt(params.pageSize || "10");
  const search = params.search || "";
  const sortField = params.sortField || "id";
  const sortOrder = (params.sortOrder || "desc") as "asc" | "desc";

  const categories = await getCategories(
    search,
    page,
    pageSize,
    sortField,
    sortOrder,
    params.name,
    params.status,
    params.mcc,
    params.cnae
  );
  const totalRecords = categories.totalCount;

  return (
    <>
      <BaseHeader
        breadcrumbItems={[{ title: "CNAE", url: "/portal/categories" }]}
      />

      <BaseBody title="CNAE" subtitle={`Visualização de Todos os CNAE`}>
        <div className="flex flex-col space-y-4">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex-1">
              <CategoriesFilter
                nameIn={params.name}
                statusIn={params.status}
                mccIn={params.mcc}
                cnaeIn={params.cnae}
              />
            </div>
            <Button asChild className="ml-2">
              <Link href="/portal/categories/0">
                <Plus className="h-4 w-4 mr-1" />
                Novo CNAE
              </Link>
            </Button>
          </div>

          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-grow">
              <CategoriesDashboardContent
                totalCategories={totalRecords}
                activeCategories={categories.activeCount}
                inactiveCategories={categories.inactiveCount}
                avgWaitingPeriodCp={categories.avgWaitingPeriodCp}
                avgWaitingPeriodCnp={categories.avgWaitingPeriodCnp}
                avgAnticipationRiskFactorCp={
                  categories.avgAnticipationRiskFactorCp
                }
                avgAnticipationRiskFactorCnp={
                  categories.avgAnticipationRiskFactorCnp
                }
              />
            </div>
          </div>

          <Categorylist
            Categories={categories}
            sortField={sortField}
            sortOrder={sortOrder}
          />

          {totalRecords > 0 && (
            <div className="flex items-center justify-between mt-4">
              <PageSizeSelector
                currentPageSize={pageSize}
                pageName="categories"
              />
              <PaginationRecords
                totalRecords={totalRecords}
                currentPage={page}
                pageSize={pageSize}
                pageName="categories"
              />
            </div>
          )}
        </div>
      </BaseBody>
    </>
  );
}
