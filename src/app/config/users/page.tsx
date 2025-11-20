import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import PageSizeSelector from "@/components/page-size-selector";
import PaginationRecords from "@/components/pagination-Records";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/permissions/require-admin";
import { getAllUsers, getAllProfiles, getAvailableCustomers } from "@/features/users/server/admin-users";
import { AdminUsersList } from "@/features/users/_components/admin-users-list";
import { AdminUsersFilter } from "@/features/users/_components/admin-users-filter";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

type UsersPageProps = {
  page?: number;
  perPage?: number;
  email?: string;
  name?: string;
  customerId?: number;
  profileId?: number;
  active?: boolean;
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<UsersPageProps>;
}) {
  // Verificar se usuário é Admin ou Super Admin
  await requireAdmin();

  const params = await searchParams;

  const page = parseInt(params.page?.toString() || "1");
  const perPage = parseInt(params.perPage?.toString() || "10");

  // Buscar dados
  const [usersData, profiles, availableCustomers] = await Promise.all([
    getAllUsers(page, perPage, {
      email: params.email,
      name: params.name,
      customerId: params.customerId ? Number(params.customerId) : undefined,
      profileId: params.profileId ? Number(params.profileId) : undefined,
      active: params.active,
    }),
    getAllProfiles(),
    getAvailableCustomers(),
  ]);

  const totalCount = usersData.totalCount;

  return (
    <>
      <BaseHeader breadcrumbItems={[{ title: "Configurações", subtitle: "Usuários", url: "/config/users" }]} />

      <BaseBody title="Usuários" subtitle="Gerenciamento de usuários do sistema">
        <div className="flex flex-col space-y-4">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex-1">
              <AdminUsersFilter
                emailIn={params.email || ""}
                nameIn={params.name || ""}
                customerIdIn={params.customerId}
                profileIdIn={params.profileId}
                activeIn={params.active}
                profiles={profiles}
                customers={availableCustomers}
              />
            </div>
            <Button asChild className="ml-2">
              <Link href="/config/users/new">
                <Plus className="h-4 w-4 mr-1" />
                Novo Usuário
              </Link>
            </Button>
          </div>

          <AdminUsersList users={usersData.users} />

          {totalCount > 0 && (
            <div className="flex items-center justify-between mt-4">
              <PageSizeSelector
                currentPageSize={perPage}
                pageName="config/users"
              />
              <PaginationRecords
                totalRecords={totalCount}
                currentPage={page}
                pageSize={perPage}
                pageName="config/users"
              />
            </div>
          )}
        </div>
      </BaseBody>
    </>
  );
}
