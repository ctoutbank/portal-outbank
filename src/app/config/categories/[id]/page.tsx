import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { requireSuperAdmin } from "@/lib/permissions/require-super-admin";
import { CategoryForm } from "@/features/categories/_components/category-form";
import {
  getCategoryById,
} from "@/features/categories/server/categories";
import {
  getAllFunctions,
  getCategoryPermissions,
} from "@/features/categories/server/permissions";
import {
  getCategoryCustomers,
} from "@/features/categories/server/category-customers";
import { getAvailableCustomers } from "@/features/users/server/admin-users";
import { notFound } from "next/navigation";

export const revalidate = 0;
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: PageProps) {
  // Verificar se usuário é Super Admin
  await requireSuperAdmin();

  const { id } = await params;
  const categoryId = parseInt(id);

  if (isNaN(categoryId)) {
    notFound();
  }

  // Buscar categoria, permissões, ISOs e todos os ISOs disponíveis
  const [category, categoryPermissions, allFunctions, categoryCustomers, availableCustomers] = await Promise.all([
    getCategoryById(categoryId).catch(() => null),
    getCategoryPermissions(categoryId).catch(() => []),
    getAllFunctions(),
    getCategoryCustomers(categoryId).catch(() => []),
    getAvailableCustomers().catch(() => []),
  ]);

  if (!category) {
    notFound();
  }

  // Mapear permissões atribuídas para array de IDs
  const assignedFunctionIds = categoryPermissions.map((pf) => Number(pf.idFunction));
  
  // Mapear ISOs atribuídos para array de IDs
  const assignedCustomerIds = categoryCustomers.map((pc) => Number(pc.idCustomer)).filter((id): id is number => id !== null && !isNaN(id));

  return (
    <>
      <BaseHeader
        breadcrumbItems={[
          { title: "Configurações", subtitle: "Categorias", url: "/config/categories" },
          {
            title: category.name || "Editar Categoria",
            subtitle: "",
            url: `/config/categories/${categoryId}`,
          },
        ]}
      />

      <BaseBody
        title={`Editar Categoria: ${category.name || ""}`}
        subtitle="Editar categoria e gerenciar permissões"
      >
        <CategoryForm
          category={category}
          functions={allFunctions}
          assignedFunctionIds={assignedFunctionIds}
          customers={availableCustomers}
          assignedCustomerIds={assignedCustomerIds}
        />
      </BaseBody>
    </>
  );
}

