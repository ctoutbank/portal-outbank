import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import {getCategoryById, getFeeDetailById, type FeeDetail} from "@/features/categories/server/category";
import Categoriesform from "@/features/categories/_components/categories-form";

// Defina os mesmos campos que o schema espera (CategoriesSchema)
import { CategoriesSchema } from "@/features/categories/schema/schema";
import CategoriesFeeAdminForm from "@/features/categories/_components/categories-feeAdmin-form";
import { SolicitationFeeAdminForm } from "@/features/categories/server/solicitationfee";

interface PageProps {
    params: Promise<{ id: string }>;
}

// Função para converter FeeDetail para SolicitationFeeAdminForm
function convertFeeDetailToSolicitationFeeAdminForm(feeDetail: FeeDetail): SolicitationFeeAdminForm {
    return {
        id: feeDetail.id,
        cnae: "", // Será preenchido pela categoria
        mcc: "", // Será preenchido pela categoria
        cnpjQuantity: feeDetail.cnpjQuantity || 0,
        monthlyPosFee: feeDetail.monthlyPosFee?.toString() || null,
        averageTicket: feeDetail.averageTicket?.toString() || null,
        description: feeDetail.description || null,
        cnaeInUse: feeDetail.cnaeInUse || false,
        cardPixMdrAdmin: feeDetail.cardPixMdr?.toString() || null,
        cardPixCeilingFeeAdmin: feeDetail.cardPixCeilingFee?.toString() || null,
        cardPixMinimumCostFeeAdmin: feeDetail.cardPixMinimumCostFee?.toString() || null,
        nonCardPixMdrAdmin: feeDetail.nonCardPixMdr?.toString() || null,
        nonCardPixCeilingFeeAdmin: feeDetail.nonCardPixCeilingFee?.toString() || null,
        nonCardPixMinimumCostFeeAdmin: feeDetail.nonCardPixMinimumCostFee?.toString() || null,
        compulsoryAnticipationConfigAdmin: feeDetail.compulsoryAnticipationConfig || 0,
        eventualAnticipationFeeAdmin: feeDetail.eventualAnticipationFee?.toString() || null,
        nonCardEventualAnticipationFeeAdmin: feeDetail.nonCardEventualAnticipationFee?.toString() || null,
        brands: feeDetail.brands?.map((brand) => ({
            name: brand.brand || "",
            productTypes: brand.productTypes?.map((pt) => ({
                name: pt.name || "",
                feeAdmin: pt.cardTransactionFee?.toString() || "",
                noCardFeeAdmin: pt.nonCardTransactionFee?.toString() || "",
                transactionFeeStart: pt.installmentTransactionFeeStart?.toString() || "",
                transactionFeeEnd: pt.installmentTransactionFeeEnd?.toString() || "",
                transactionAnticipationMdr: pt.transactionAnticipationMdr?.toString() || "",
            })) || [],
        })) || [],
    };
}

export default async function CategoryDetailPage({ params }: PageProps) {
    const resolvedParams = await params;
    const categoryId = parseInt(resolvedParams.id, 10);

    const category = await getCategoryById(categoryId);
    console.log("category", category);
    if (!category) {
        return (
            <BaseBody title="Categoria não encontrada" subtitle="Verifique o ID.">
                <p>A categoria com ID {categoryId} não foi encontrada.</p>
            </BaseBody>
        );
    }

    // Verificar se a categoria já tem uma solicitação fee associada
    const solicitationFeeId = category.idSolicitationFee;
    console.log("solicitationFeeId", solicitationFeeId);
    const existingSolicitation = solicitationFeeId ? await getFeeDetailById(solicitationFeeId) : null;

    console.log("solicitationFeeId", solicitationFeeId);

    console.log("existingSolicitation", existingSolicitation);

    // Converter os dados para o formato esperado pelo componente
    const formattedSolicitationFee = existingSolicitation 
        ? convertFeeDetailToSolicitationFeeAdminForm(existingSolicitation)
        : null;

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
                    { title: "Categorias", subtitle: '', url: "/categories" },
                    {
                        title: `Categoria #${category.id}`,
                        subtitle: "",
                        url: `/categories/${category.id}`,
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
                    <CategoriesFeeAdminForm
                        pricingSolicitation={formattedSolicitationFee}
                        mcc={category.mcc}
                        cnae={category.cnae}
                        categoryId={categoryId}
                        idSolicitationFee={solicitationFeeId}
                    />
                </div>
            </BaseBody>
        </>
    );
}

