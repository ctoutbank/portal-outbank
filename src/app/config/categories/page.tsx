import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { requireSuperAdmin } from "@/lib/permissions/require-super-admin";
import { getAllCategories } from "@/features/categories/server/categories";
import { UserCategoriesList } from "@/features/categories/_components/user-categories-list";
import { UserCategoriesFilter } from "@/features/categories/_components/user-categories-filter";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type CategoriesPageProps = {
  name?: string;
  active?: boolean | string;
};

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<CategoriesPageProps>;
}) {
  // Verificar se usuário é Super Admin
  await requireSuperAdmin();

  const params = await searchParams;

  // Parsear filtros
  const filters = {
    name: typeof params.name === 'string' ? params.name.trim() || undefined : undefined,
    active: params.active !== undefined 
      ? (typeof params.active === 'boolean' 
          ? params.active 
          : typeof params.active === 'string' && params.active === "true")
      : undefined,
  };

  // Buscar categorias com filtros
  const categories = await getAllCategories(filters);

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
          <div className="mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/config">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Configurações
              </Link>
            </Button>
          </div>
          <div className="mb-1 flex items-center justify-between">
            <div className="flex-1">
              <UserCategoriesFilter
                nameIn={filters.name || ""}
                activeIn={filters.active}
              />
            </div>
            <Button asChild className="ml-2">
              <Link href="/config/categories/new">
                <Plus className="h-4 w-4 mr-1" />
                Nova Categoria
              </Link>
            </Button>
          </div>

          <div className="mt-4">
            <UserCategoriesList categories={categories} />
          </div>
        </div>
      </BaseBody>
    </>
  );
}

