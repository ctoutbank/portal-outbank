import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import PageSizeSelector from "@/components/page-size-selector";
import PaginationRecords from "@/components/pagination-Records";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Building2, Users, UserCheck } from "lucide-react";
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
  tab?: string; // "portal", "iso_admin" ou "user_iso"
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
  const validTabs = ["portal", "iso_admin", "user_iso"];
  const activeTab = validTabs.includes(params.tab || "") ? params.tab! : "portal";

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
  // Buscar usuarios do portal, ISO Admins e equipe dos ISOs separadamente
  let portalUsersData: Awaited<ReturnType<typeof getAllUsers>>;
  let isoAdminUsersData: Awaited<ReturnType<typeof getAllUsers>>;
  let userIsoUsersData: Awaited<ReturnType<typeof getAllUsers>>;
  let profiles: Awaited<ReturnType<typeof getAllProfiles>>;
  let availableCustomers: Awaited<ReturnType<typeof getAvailableCustomers>>;
  
  try {
    [portalUsersData, isoAdminUsersData, userIsoUsersData, profiles, availableCustomers] = await Promise.all([
      getAllUsers(activeTab === "portal" ? page : 1, activeTab === "portal" ? perPage : 10, filters, "portal"),
      getAllUsers(activeTab === "iso_admin" ? page : 1, activeTab === "iso_admin" ? perPage : 10, filters, "iso_admin"),
      getAllUsers(activeTab === "user_iso" ? page : 1, activeTab === "user_iso" ? perPage : 10, filters, "user_iso"),
      getAllProfiles(),
      getAvailableCustomers(),
    ]);
  } catch (error) {
    console.error('Erro ao carregar dados da pagina de usuarios:', error);
    // Retornar dados vazios em caso de erro
    portalUsersData = { users: [], totalCount: 0 };
    isoAdminUsersData = { users: [], totalCount: 0 };
    userIsoUsersData = { users: [], totalCount: 0 };
    profiles = [];
    availableCustomers = [];
  }

  // Selecionar dados da aba ativa
  const usersData = activeTab === "portal" 
    ? portalUsersData 
    : activeTab === "iso_admin" 
      ? isoAdminUsersData 
      : userIsoUsersData;
  const totalCount = usersData?.totalCount || 0;
  const portalCount = portalUsersData?.totalCount || 0;
  const isoAdminCount = isoAdminUsersData?.totalCount || 0;
  const userIsoCount = userIsoUsersData?.totalCount || 0;

  return (
    <>
      <BaseHeader 
        breadcrumbItems={[
          { title: "Configurações", url: "/config" },
          { title: "Usuários" }
        ]}
        showBackButton={true}
        backHref="/config"
      />

      <BaseBody title="Usuários" subtitle="Gerenciamento de usuários do sistema">
        <div className="flex flex-col space-y-4">

          <Tabs defaultValue={activeTab} className="w-full">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
                <AdminUsersFilter
                  emailIn={filters.email || ""}
                  nameIn={filters.name || ""}
                  customerIdIn={filters.customerId}
                  profileIdIn={filters.profileId}
                  activeIn={filters.active}
                  profiles={profiles || []}
                  customers={availableCustomers || []}
                />
                <TabsList className="bg-[#212121] border border-[#2E2E2E]">
                  <TabsTrigger value="portal" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white" asChild>
                    <Link href="/config/users?tab=portal">
                      <Users className="h-4 w-4 mr-2" />
                      Portal ({portalCount})
                    </Link>
                  </TabsTrigger>
                  <TabsTrigger value="iso_admin" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white" asChild>
                    <Link href="/config/users?tab=iso_admin">
                      <Building2 className="h-4 w-4 mr-2" />
                      ISOs ({isoAdminCount})
                    </Link>
                  </TabsTrigger>
                  <TabsTrigger value="user_iso" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white" asChild>
                    <Link href="/config/users?tab=user_iso">
                      <UserCheck className="h-4 w-4 mr-2" />
                      User ISOs ({userIsoCount})
                    </Link>
                  </TabsTrigger>
                </TabsList>
              </div>
              <Button asChild>
                <Link href="/config/users/new">
                  <Plus className="h-4 w-4 mr-1" />
                  Novo Usuário
                </Link>
              </Button>
            </div>

            <TabsContent value="portal">
              <div className="rounded-md border p-4 bg-muted/20">
                <p className="text-sm text-muted-foreground mb-4">
                  Usuários administradores do portal que gerenciam os ISOs. Super Admins têm acesso a todos os ISOs automaticamente.
                </p>
                <AdminUsersList users={portalUsersData?.users || []} />
              </div>
            </TabsContent>

            <TabsContent value="iso_admin">
              <div className="rounded-md border p-4 bg-muted/20">
                <p className="text-sm text-muted-foreground mb-4">
                  ISO Admins são os administradores responsáveis por cada ISO. Eles gerenciam a equipe do ISO e têm acesso ao Tenant.
                </p>
                <AdminUsersList users={isoAdminUsersData?.users || []} showIsoBadge />
              </div>
            </TabsContent>

            <TabsContent value="user_iso">
              <div className="rounded-md border p-4 bg-muted/20">
                <p className="text-sm text-muted-foreground mb-4">
                  Usuários da equipe dos ISOs. São gerenciados pelos ISO Admins e têm acesso limitado ao Tenant do seu ISO.
                </p>
                <AdminUsersList users={userIsoUsersData?.users || []} showIsoBadge />
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
