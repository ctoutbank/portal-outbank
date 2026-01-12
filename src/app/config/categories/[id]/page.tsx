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

  // Buscar categoria e permissões
  const [category, categoryPermissions, allFunctions] = await Promise.all([
    getCategoryById(categoryId).catch(() => null),
    getCategoryPermissions(categoryId).catch(() => []),
    getAllFunctions(),
  ]);

  if (!category) {
    notFound();
  }

  // Mapear permissões atribuídas para array de IDs
  const assignedFunctionIds = categoryPermissions.map((pf) => Number(pf.idFunction));

  // Obter menus autorizados da categoria
  const assignedMenuIds = category.authorizedMenus || [];

  return (
    <>
      <BaseHeader
        breadcrumbItems={[
          { title: "Configurações", url: "/config" },
          { title: "Categorias", url: "/config/categories" },
          { title: category.name || "Editar Categoria" },
        ]}
        showBackButton={true}
        backHref="/config/categories"
      />

      <BaseBody
        title={`Editar Categoria: ${category.name || ""}`}
        subtitle="Editar categoria e gerenciar permissões"
      >
        <CategoryForm
          category={category}
          functions={allFunctions}
          assignedFunctionIds={assignedFunctionIds}
          assignedMenuIds={assignedMenuIds}
          isLocked={category.locked || false}
        />
      </BaseBody>
    </>
  );
}

