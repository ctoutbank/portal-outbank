import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import PageSizeSelector from "@/components/page-size-selector";
import PaginationRecords from "@/components/pagination-Records";
import Categorylist from "@/features/categories/_components/categories-list";
import { getCategories } from "@/features/categories/server/category";

export default async function CategoriesPage({
                                                 searchParams,
                                             }: {
    searchParams: Promise<{
        page?: string;
        perPage?: string;
        search?: string;
        mcc?: string;
        cnae?: string;
        status?: string;
        sortField?: string;
        sortOrder?: "asc" | "desc";
    }>;
}) {
    // Aguarda searchParams antes de acessar suas propriedades
    const params = await searchParams;
    
    const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
    const perPage = typeof params.perPage === "string" ? parseInt(params.perPage, 10) : 10;
    const search = typeof params.search === "string" ? params.search : "";
    const sortField = typeof params.sortField === "string" ? params.sortField : "name";
    const sortOrder = params.sortOrder === "desc" ? "desc" : "asc";
    const mcc = typeof params.mcc === "string" ? params.mcc : undefined;
    const cnae = typeof params.cnae === "string" ? params.cnae : undefined;
    const status = typeof params.status === "string" ? params.status : undefined;
//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
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
                breadcrumbItems={[{ title: "Categorias", subtitle: "", url: "/portal/categories" }]}
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
