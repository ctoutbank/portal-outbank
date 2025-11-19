import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { requireAdmin } from "@/lib/permissions/require-admin";
import { getAllProfiles, getAvailableCustomers, getAdminCustomers } from "@/features/users/server/admin-users";
import { AdminUserPermissionsForm } from "@/features/users/_components/admin-user-permissions-form";
import { getUserDetailWithClerk } from "@/features/customers/users/_actions/user-actions";
import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  // Verificar se usuário é Admin ou Super Admin
  await requireAdmin();

  const { id } = await params;
  const userId = parseInt(id);

  // Obter informações do usuário logado
  const currentUserInfo = await getCurrentUserInfo();
  const isSuperAdmin = currentUserInfo?.isSuperAdmin || false;

  if (isNaN(userId)) {
    // Criar novo usuário
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

  // Editar usuário existente
  const [user, profiles, customers, adminCustomers] = await Promise.all([
    getUserDetailWithClerk(userId),
    getAllProfiles(),
    getAvailableCustomers(),
    getAdminCustomers(userId),
  ]);

  if (!user) {
    return (
      <>
        <BaseHeader
          breadcrumbItems={[
            { title: "Configurações", subtitle: "Usuários", url: "/config/users" },
          ]}
        />
        <BaseBody title="Usuário não encontrado" subtitle="">
          <p className="text-muted-foreground">O usuário solicitado não foi encontrado.</p>
        </BaseBody>
      </>
    );
  }

  return (
    <>
      <BaseHeader
        breadcrumbItems={[
          { title: "Configurações", subtitle: "Usuários", url: "/config/users" },
          { title: "Editar Usuário", subtitle: user.email || "", url: `/config/users/${userId}` },
        ]}
      />
      <BaseBody title="Editar Usuário" subtitle={`Gerenciar permissões de ${user.email}`}>
        <AdminUserPermissionsForm
          user={user}
          profiles={profiles}
          customers={customers}
          adminCustomers={adminCustomers.map((ac) => ac.idCustomer)}
          isSuperAdmin={isSuperAdmin}
        />
      </BaseBody>
    </>
  );
}
