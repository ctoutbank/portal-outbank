import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { requireAdmin } from "@/lib/permissions/require-admin";
import { getAllProfiles, getAvailableCustomers } from "@/features/users/server/admin-users";
import { AdminUserPermissionsForm } from "@/features/users/_components/admin-user-permissions-form";
import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function NewUserPage() {
  await requireAdmin();

  const currentUserInfo = await getCurrentUserInfo();
  const isSuperAdmin = currentUserInfo?.isSuperAdmin || false;

  const [profiles, customers] = await Promise.all([
    getAllProfiles(),
    getAvailableCustomers(),
  ]);

  return (
    <>
      <BaseHeader
        breadcrumbItems={[
          { title: "Configurações", subtitle: "Usuários", url: "/config/users" },
          { title: "Novo Usuário", subtitle: "", url: "/config/users/new" },
        ]}
      />
      <BaseBody title="Novo Usuário" subtitle="Criar novo usuário no sistema">
        <AdminUserPermissionsForm
          profiles={profiles}
          customers={customers}
          isSuperAdmin={isSuperAdmin}
        />
      </BaseBody>
    </>
  );
}
