import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import Categoriesform from "@/features/categories/_components/categories-form";
import { getCategoryById } from "@/features/categories/server/category";

export const revalidate = 0;

export default async function CategoryDetail({
  searchParams,
}: {
  searchParams: Promise<{ id: string }>;
}) {
  const params = await searchParams;
  const category = await getCategoryById(parseInt(params.id));

  return (
    <>
      <BaseHeader
        breadcrumbItems={[{ title: "Categorias", url: "/portal/categories" }]}
      />
      <BaseBody
        title="Categorias"
        subtitle={category?.id ? "Editar Categoria" : "Adicionar Categoria"}
      >
        <Categoriesform
          categories={{
            id: category?.id,
            name: category?.name || "",

            slug: category?.slug || "",
            active: category?.active ?? true,
            dtinsert: category?.dtinsert
              ? new Date(category.dtinsert)
              : new Date(),
            dtupdate: category?.dtupdate
              ? new Date(category.dtupdate)
              : new Date(),
            mcc: category?.mcc || "",
            cnae: category?.cnae || "",
            anticipation_risk_factor_cp:
              category?.anticipationRiskFactorCp?.toString() || undefined,
            anticipation_risk_factor_cnp:
              category?.anticipationRiskFactorCnp?.toString() || undefined,
            waiting_period_cp: category?.waitingPeriodCp?.toString(),
            waiting_period_cnp:
              category?.waitingPeriodCnp?.toString() || undefined,
          }}
        />
      </BaseBody>
    </>
  );
}
