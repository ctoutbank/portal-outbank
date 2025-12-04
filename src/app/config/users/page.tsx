import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import PageSizeSelector from "@/components/page-size-selector";
import PaginationRecords from "@/components/pagination-Records";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Building2, Users } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/permissions/require-admin";
import { getAllUsers, getAllProfiles, getAvailableCustomers } from "@/features/users/server/admin-users";
import { AdminUsersList } from "@/features/users/_components/admin-users-list";
import { AdminUsersFilter } from "@/features/users/_components/admin-users-filter";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

type UsersPageProps = {
  page?: number | string;
  perPage?: number | string;
  email?: string;
  name?: string;
  customerId?: number | string;
  profileId?: number | string;
  active?: boolean | string;
  tab?: string; // "portal" ou "iso"
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<UsersPageProps>;
}) {
  // Verificar se usuario e Admin ou Super Admin
  await requireAdmin();

  const params = await searchParams;

  // Validar e parsear parametros
  const page = Math.max(1, parseInt(params.page?.toString() || "1") || 1);
  const perPage = Math.max(1, Math.min(100, parseInt(params.perPage?.toString() || "10") || 10));
  const activeTab = params.tab === "iso" ? "iso" : "portal";

  // Parsear filtros
  const filters = {
    email: typeof params.email === 'string' ? params.email.trim() || undefined : undefined,
    name: typeof params.name === 'string' ? params.name.trim() || undefined : undefined,
    customerId: params.customerId ? Number(params.customerId) || undefined : undefined,
    profileId: params.profileId ? Number(params.profileId) || undefined : undefined,
    active: params.active !== undefined 
      ? (typeof params.active === 'boolean' 
          ? params.active 
          : typeof params.active === 'string' && params.active === "true")
      : undefined,
  };

  // Buscar dados com tratamento de erro
  // Buscar usuarios do portal e dos ISOs separadamente
  let portalUsersData: Awaited<ReturnType<typeof getAllUsers>>;
  let isoUsersData: Awaited<ReturnType<typeof getAllUsers>>;
  let profiles: Awaited<ReturnType<typeof getAllProfiles>>;
  let availableCustomers: Awaited<ReturnType<typeof getAvailableCustomers>>;
  
  try {
    [portalUsersData, isoUsersData, profiles, availableCustomers] = await Promise.all([
      getAllUsers(activeTab === "portal" ? page : 1, activeTab === "portal" ? perPage : 10, filters, "portal"),
      getAllUsers(activeTab === "iso" ? page : 1, activeTab === "iso" ? perPage : 10, filters, "iso"),
      getAllProfiles(),
      getAvailableCustomers(),
    ]);
  } catch (error) {
    console.error('Erro ao carregar dados da pagina de usuarios:', error);
    // Retornar dados vazios em caso de erro
    portalUsersData = { users: [], totalCount: 0 };
    isoUsersData = { users: [], totalCount: 0 };
    profiles = [];
    availableCustomers = [];
  }

  // Selecionar dados da aba ativa
  const usersData = activeTab === "portal" ? portalUsersData : isoUsersData;
  const totalCount = usersData?.totalCount || 0;
  const portalCount = portalUsersData?.totalCount || 0;
  const isoCount = isoUsersData?.totalCount || 0;

  return (
    <>
      <BaseHeader breadcrumbItems={[{ title: "Configurações", subtitle: "Usuários", url: "/config/users" }]} />

      <BaseBody title="Usuários" subtitle="Gerenciamento de usuários do sistema">
        <div className="flex flex-col space-y-4">
          <div className="mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/config">
                Voltar
              </Link>
            </Button>
          </div>

          <Tabs defaultValue={activeTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="portal" asChild>
                  <Link href="/config/users?tab=portal">
                    <Users className="h-4 w-4 mr-2" />
                    Usuários do Portal ({portalCount})
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="iso" asChild>
                  <Link href="/config/users?tab=iso">
                    <Building2 className="h-4 w-4 mr-2" />
                    Usuários dos ISOs ({isoCount})
                  </Link>
                </TabsTrigger>
              </TabsList>
              <Button asChild className="ml-2">
                <Link href="/config/users/new">
                  <Plus className="h-4 w-4 mr-1" />
                  Novo Usuário
                </Link>
              </Button>
            </div>

            <div className="mb-4">
              <AdminUsersFilter
                emailIn={filters.email || ""}
                nameIn={filters.name || ""}
                customerIdIn={filters.customerId}
                profileIdIn={filters.profileId}
                activeIn={filters.active}
                profiles={profiles || []}
                customers={availableCustomers || []}
              />
            </div>

            <TabsContent value="portal">
              <div className="rounded-md border p-4 bg-muted/20">
                <p className="text-sm text-muted-foreground mb-4">
                  Usuários administradores do portal que gerenciam os ISOs. Super Admins têm acesso a todos os ISOs automaticamente.
                </p>
                <AdminUsersList users={portalUsersData?.users || []} />
              </div>
            </TabsContent>

            <TabsContent value="iso">
              <div className="rounded-md border p-4 bg-muted/20">
                <p className="text-sm text-muted-foreground mb-4">
                  Usuários vinculados a ISOs específicos. Cada usuário pertence a um ISO e só tem acesso aos dados desse ISO.
                </p>
                <AdminUsersList users={isoUsersData?.users || []} />
              </div>
            </TabsContent>
          </Tabs>

          {totalCount > 0 && (
            <div className="flex items-center justify-between mt-4">
              <PageSizeSelector
                currentPageSize={perPage}
                pageName={`config/users?tab=${activeTab}`}
              />
              <PaginationRecords
                totalRecords={totalCount}
                currentPage={page}
                pageSize={perPage}
                pageName={`config/users?tab=${activeTab}`}
              />
            </div>
          )}
        </div>
      </BaseBody>
    </>
  );
}
