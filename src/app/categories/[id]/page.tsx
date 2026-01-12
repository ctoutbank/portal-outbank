import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { getCategoryById } from "@/features/categories/server/category";
import Categoriesform from "@/features/categories/_components/categories-form";
import { CategoriesSchema } from "@/features/categories/schema/schema";

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
        idSolicitationFee: category.idSolicitationFee,
        dtinsert: category.dtinsert ?? "",
        dtupdate: category.dtupdate ?? "",
    };

    return (
        <>
            <BaseHeader
                breadcrumbItems={[
                    { title: "CNAE/MCC", url: "/categories" },
                    { title: category.name || `Categoria #${category.id}` },
                ]}
                showBackButton={true}
                backHref="/categories"
            />

            <BaseBody
                title={`Categoria: ${category.name}`}
                subtitle="Detalhes e edição da categoria"
            >
                <div className="flex flex-col space-y-4">
                    <Categoriesform categories={formattedCategory} />
                </div>
            </BaseBody>
        </>
    );
}

