import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { requireSuperAdmin } from "@/lib/permissions/require-super-admin";
import { CategoryForm } from "@/features/categories/_components/category-form";
import { getAllFunctions } from "@/features/categories/server/permissions";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  // Verificar se usuário é Super Admin
  await requireSuperAdmin();

  // Buscar todas as funções (permissões) disponíveis
  const functions = await getAllFunctions();

  return (
    <>
      <BaseHeader
        breadcrumbItems={[
          { title: "Configurações", subtitle: "Categorias", url: "/config/categories" },
          { title: "Nova Categoria", subtitle: "", url: "/config/categories/new" },
        ]}
      />

      <BaseBody
        title="Nova Categoria"
        subtitle="Criar nova categoria de usuários com permissões personalizadas"
      >
        <CategoryForm functions={functions} />
      </BaseBody>
    </>
  );
}

