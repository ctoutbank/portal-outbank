import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { requireSuperAdmin } from "@/lib/permissions/require-super-admin";
import { getAllCategories } from "@/features/categories/server/categories";
import { UserCategoriesList } from "@/features/categories/_components/user-categories-list";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  // Verificar se usuário é Super Admin
  await requireSuperAdmin();

  // Buscar todas as categorias
  const categories = await getAllCategories();

  return (
    <>
      <BaseHeader
        breadcrumbItems={[
          { title: "Configurações", subtitle: "Categorias", url: "/config/categories" },
        ]}
      />

      <BaseBody
        title="Categorias de Usuários"
        subtitle="Gerenciamento de categorias e permissões do sistema"
      >
        <div className="flex flex-col space-y-4">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex-1"></div>
            <Button asChild className="ml-2">
              <Link href="/config/categories/new">
                <Plus className="h-4 w-4 mr-1" />
                Nova Categoria
              </Link>
            </Button>
          </div>

          <UserCategoriesList categories={categories} />
        </div>
      </BaseBody>
    </>
  );
}

