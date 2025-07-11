import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import {ensureSolicitationFeeForCategory, getCategoryById} from "@/features/categories/server/category";
import Categoriesform from "@/features/categories/_components/categories-form";

// Defina os mesmos campos que o schema espera (CategoriesSchema)
import { CategoriesSchema } from "@/features/categories/schema/schema";
import {getPricingSolicitationById} from "@/features/pricingSolicitation/server/pricing-solicitation";
import PricingSolicitationForm from "@/features/pricingSolicitation/_components/pricing-solicitation-form";
import {getSolicitationFeeWithTaxes} from "@/features/solicitationfee/server/solicitationfee";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CategoryDetailPage({ params }: PageProps) {
    const resolvedParams = await params;
    const categoryId = parseInt(resolvedParams.id, 10);

    const category = await getCategoryById(categoryId);

    if (!category) {
        return (
            <BaseBody title="Categoria não encontrada" subtitle="Verifique o ID.">
                <p>A categoria com ID {categoryId} não foi encontrada.</p>
            </BaseBody>
        );
    }

    const solicitationFeeId = await ensureSolicitationFeeForCategory(categoryId);
    const solicitationFeeWithTaxes = await getSolicitationFeeWithTaxes(solicitationFeeId);
    const pricingSolicitationById = await getPricingSolicitationById(solicitationFeeId);

    console.log("pricingSolicitationById", pricingSolicitationById);

    const formattedCategory: CategoriesSchema = {
        id: category.id,
        name: category.name ?? "",
        slug: category.slug ?? "",
        active: category.active ?? false,
        mcc: category.mcc ?? "",
        cnae: category.cnae ?? "",
        anticipation_risk_factor_cp: category.anticipationRiskFactorCp ?? 0,
        anticipation_risk_factor_cnp: category.anticipationRiskFactorCnp ?? 0,
        waiting_period_cp: category.waitingPeriodCp ?? 0,
        waiting_period_cnp: category.waitingPeriodCnp ?? 0,
        idSolicitationFee: solicitationFeeId,
        dtinsert: category.dtinsert ?? "",
        dtupdate: category.dtupdate ?? "",
    };

    return (
        <>
            <BaseHeader
                breadcrumbItems={[
                    { title: "Categorias", url: "/portal/categories" },
                    {
                        title: `Categoria #${category.id}`,
                        url: `/portal/categories/${category.id}`,
                    },
                ]}
            />

            <BaseBody
                title={`Categoria: ${category.name}`}
                subtitle="Detalhes e edição da categoria"
            >
                <Categoriesform categories={formattedCategory} />
                <div className="mt-8">
                    <h1>Taxas da Solicitação</h1>
                    {solicitationFeeWithTaxes ? (
                        <PricingSolicitationForm
                            pricingSolicitation={pricingSolicitationById}
                            mcc={category.mcc}
                            cnae={category.cnae}
                        />
                    ) : (
                        <p>Carregando dados de taxas...</p>
                    )}
                </div>
            </BaseBody>
        </>
    );
}

