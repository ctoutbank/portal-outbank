import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import CategoriesTabs from "@/features/categories/_components/categories-tabs";
import { getCategories } from "@/features/categories/server/category";
import { getMccs } from "@/features/mcc/server/mcc";

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
        mccPage?: string;
        mccPerPage?: string;
        mccSearch?: string;
        mccSortField?: string;
        mccSortOrder?: "asc" | "desc";
        tab?: string;
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
    const activeTab = typeof params.tab === "string" ? params.tab : "categories";
    
    // Parâmetros para MCCs
    const mccPage = typeof params.mccPage === "string" ? parseInt(params.mccPage, 10) : 1;
    const mccPerPage = typeof params.mccPerPage === "string" ? parseInt(params.mccPerPage, 10) : 10;
    const mccSearch = typeof params.mccSearch === "string" ? params.mccSearch : "";
    const mccSortField = typeof params.mccSortField === "string" ? params.mccSortField : "code";
    const mccSortOrder = params.mccSortOrder === "desc" ? "desc" : "asc";

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

    // Buscar MCCs da Dock
    const mccsData = await getMccs(
        mccPage,
        mccPerPage,
        mccSearch || undefined,
        undefined
    );

    return (
        <>
            <BaseHeader
                breadcrumbItems={[{ title: "CNAE/MCC", subtitle: "", url: "/categories" }]}
            />

            <BaseBody
                title="CNAE/MCC"
                subtitle="Visualização de CNAEs e MCCs cadastrados"
                className="overflow-x-hidden bg-[#161616] [&_h1]:text-[#FFFFFF] [&_h1]:text-[22px] [&_h1]:font-semibold [&_p]:text-[#5C5C5C] [&_p]:text-sm [&_p]:font-normal"
            >
                <CategoriesTabs
                    categories={categories}
                    mccs={mccsData.data}
                    mccTotalCount={mccsData.totalCount}
                    categorySortField={sortField}
                    categorySortOrder={sortOrder}
                    mccSortField={mccSortField}
                    mccSortOrder={mccSortOrder}
                    categoryPage={page}
                    categoryPerPage={perPage}
                    mccPage={mccPage}
                    mccPerPage={mccPerPage}
                />
            </BaseBody>
        </>
    );
}
