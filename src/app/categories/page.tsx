import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import CategoriesTabs from "@/features/categories/_components/categories-tabs";
import { getCategories } from "@/features/categories/server/category";
import { getMccs, getCategorias } from "@/features/mcc/server/mcc";
import type { NivelRisco, TipoLiquidacao } from "@/features/mcc/server/types";
import { isSuperAdmin } from "@/lib/permissions/check-permissions";

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
        mccCategoria?: string;
        mccNivelRisco?: string;
        mccTipoLiquidacao?: string;
        mccStatus?: string;
        tab?: string;
    }>;
}) {
    const params = await searchParams;
    
    const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
    const perPage = typeof params.perPage === "string" ? parseInt(params.perPage, 10) : 10;
    const search = typeof params.search === "string" ? params.search : "";
    const sortField = typeof params.sortField === "string" ? params.sortField : "name";
    const sortOrder = params.sortOrder === "desc" ? "desc" : "asc";
    const mcc = typeof params.mcc === "string" ? params.mcc : undefined;
    const cnae = typeof params.cnae === "string" ? params.cnae : undefined;
    const status = typeof params.status === "string" ? params.status : undefined;
    
    const mccPage = typeof params.mccPage === "string" ? parseInt(params.mccPage, 10) : 1;
    const mccPerPage = typeof params.mccPerPage === "string" ? parseInt(params.mccPerPage, 10) : 10;
    const mccSearch = typeof params.mccSearch === "string" ? params.mccSearch : "";
    const mccSortField = typeof params.mccSortField === "string" ? params.mccSortField : "code";
    const mccSortOrder = params.mccSortOrder === "desc" ? "desc" : "asc";
    const mccCategoria = typeof params.mccCategoria === "string" ? params.mccCategoria : undefined;
    const mccNivelRisco = typeof params.mccNivelRisco === "string" ? params.mccNivelRisco as NivelRisco : undefined;
    const mccTipoLiquidacao = typeof params.mccTipoLiquidacao === "string" ? params.mccTipoLiquidacao as TipoLiquidacao : undefined;
    const mccStatusFilter = params.mccStatus === "active" ? true : params.mccStatus === "inactive" ? false : undefined;

    const [categories, mccsData, mccCategorias, userIsSuperAdmin] = await Promise.all([
        getCategories(
            search,
            page,
            perPage,
            sortField,
            sortOrder,
            undefined,
            status,
            mcc,
            cnae
        ),
        getMccs(
            mccPage,
            mccPerPage,
            mccSearch || undefined,
            mccCategoria,
            mccNivelRisco,
            mccTipoLiquidacao,
            mccStatusFilter,
            mccSortField,
            mccSortOrder
        ),
        getCategorias(),
        isSuperAdmin(),
    ]);

    return (
        <>
            <BaseHeader
                breadcrumbItems={[{ title: "CNAE/MCC" }]}
                showBackButton={true}
                backHref="/"
            />

            <BaseBody
                title="Catálogo MCC"
                subtitle="Gestão de códigos de categoria de estabelecimentos comerciais (ISO 18245)"
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
                    mccCategorias={mccCategorias}
                    isSuperAdmin={userIsSuperAdmin}
                />
            </BaseBody>
        </>
    );
}
