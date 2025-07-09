import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import PageSizeSelector from "@/components/page-size-selector";
import PaginationRecords from "@/components/pagination-Records";
import Categorylist from "@/features/categories/_components/categories-list";
import { getCategories } from "@/features/categories/server/category";

export default async function CategoriesPage({
                                                 searchParams,
                                             }: {
    searchParams: {
        page?: string;
        perPage?: string;
        search?: string;
        mcc?: string;
        cnae?: string;
        status?: string;
        sortField?: string;
        sortOrder?: "asc" | "desc";
    };
}) {
    const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;
    const perPage = typeof searchParams.perPage === "string" ? parseInt(searchParams.perPage, 10) : 10;
    const search = typeof searchParams.search === "string" ? searchParams.search : "";
    const sortField = typeof searchParams.sortField === "string" ? searchParams.sortField : "name";
    const sortOrder = searchParams.sortOrder === "desc" ? "desc" : "asc";
    const mcc = typeof searchParams.mcc === "string" ? searchParams.mcc : undefined;
    const cnae = typeof searchParams.cnae === "string" ? searchParams.cnae : undefined;
    const status = typeof searchParams.status === "string" ? searchParams.status : undefined;

    const categories = await getCategories(
        search,
        page,
        perPage,
        sortField,
        sortOrder,
        undefined,
        status,
        mcc,
        cnae
    );

    const totalCount = categories.totalCount;

    return (
        <>
            <BaseHeader
                breadcrumbItems={[{ title: "Categorias", url: "/portal/categories" }]}
            />

            <BaseBody
                title="Categorias"
                subtitle="Visualização de todas as categorias cadastradas"
            >
                <div className="flex flex-col space-y-4">
                    <div className="mb-1 flex items-center justify-between">
                        <div className="flex-1">
                            {/* Filtros futuros podem ir aqui */}
                        </div>
                    </div>

                    <Categorylist
                        Categories={categories}
                        sortField={sortField}
                        sortOrder={sortOrder}
                    />

                    {totalCount > 0 && (
                        <div className="flex items-center justify-between mt-4">
                            <PageSizeSelector
                                currentPageSize={perPage}
                                pageName="categories"
                            />
                            <PaginationRecords
                                totalRecords={totalCount}
                                currentPage={page}
                                pageSize={perPage}
                                pageName="categories"
                            />
                        </div>
                    )}
                </div>
            </BaseBody>
        </>
    );
}
