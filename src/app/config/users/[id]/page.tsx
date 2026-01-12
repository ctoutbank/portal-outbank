import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { requireAdmin } from "@/lib/permissions/require-admin";
import { getAllProfiles, getAvailableCustomers, getAdminCustomers } from "@/features/users/server/admin-users";
import { AdminUserPermissionsForm } from "@/features/users/_components/admin-user-permissions-form";
import { getUserDetail, getUserIsoCommissionLinks } from "@/features/customers/users/_actions/user-actions";
import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  // Verificar se usuário é Admin ou Super Admin
  await requireAdmin();

  const { id } = await params;

  // Obter informações do usuário logado
  const currentUserInfo = await getCurrentUserInfo();
  const isSuperAdmin = currentUserInfo?.isSuperAdmin || false;

  // Tratar "new" e "0" como novo usuário
  if (id === "new" || id === "0") {
    // Criar novo usuário
    const [profiles, customers] = await Promise.all([
      getAllProfiles(),
      getAvailableCustomers(),
    ]);

    return (
      <>
        <BaseHeader
          breadcrumbItems={[
            { title: "Configurações", url: "/config" },
            { title: "Usuários", url: "/config/users" },
            { title: "Novo Usuário" },
          ]}
          showBackButton={true}
          backHref="/config/users"
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

  // Editar usuário existente - parsear ID
  const userId = parseInt(id);
  if (isNaN(userId) || userId <= 0) {
    // ID inválido
    return (
      <>
        <BaseHeader
          breadcrumbItems={[
            { title: "Configurações", url: "/config" },
            { title: "Usuários", url: "/config/users" },
          ]}
          showBackButton={true}
          backHref="/config/users"
        />
        <BaseBody title="Usuário não encontrado" subtitle="">
          <p className="text-muted-foreground">ID de usuário inválido.</p>
        </BaseBody>
      </>
    );
  }

  let user: Awaited<ReturnType<typeof getUserDetail>> | null;
  let profiles: Awaited<ReturnType<typeof getAllProfiles>>;
  let customers: Awaited<ReturnType<typeof getAvailableCustomers>>;
  let adminCustomers: Awaited<ReturnType<typeof getAdminCustomers>> = [];
  let isoCommissionLinks: Awaited<ReturnType<typeof getUserIsoCommissionLinks>> = [];
  
  try {
    [user, profiles, customers] = await Promise.all([
      getUserDetail(userId),
      getAllProfiles(),
      getAvailableCustomers(),
    ]);
    
    // Buscar ISOs autorizados separadamente com tratamento de erro robusto
    try {
      adminCustomers = await getAdminCustomers(userId);
    } catch (error) {
      console.warn('Erro ao buscar ISOs autorizados (tabela pode não existir):', error);
      adminCustomers = [];
    }

    // Buscar vínculos ISO com tipo de comissão
    try {
      isoCommissionLinks = await getUserIsoCommissionLinks(userId);
    } catch (error) {
      console.warn('Erro ao buscar vínculos de comissão:', error);
      isoCommissionLinks = [];
    }
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
    user = null;
    profiles = [];
    customers = [];
    return (
      <>
        <BaseHeader
          breadcrumbItems={[
            { title: "Configurações", url: "/config" },
            { title: "Usuários", url: "/config/users" },
          ]}
          showBackButton={true}
          backHref="/config/users"
        />
        <BaseBody title="Erro ao carregar usuário" subtitle="">
          <p className="text-muted-foreground">Ocorreu um erro ao carregar os dados do usuário. Por favor, tente novamente.</p>
        </BaseBody>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <BaseHeader
          breadcrumbItems={[
            { title: "Configurações", url: "/config" },
            { title: "Usuários", url: "/config/users" },
          ]}
          showBackButton={true}
          backHref="/config/users"
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
          { title: "Configurações", url: "/config" },
          { title: "Usuários", url: "/config/users" },
          { title: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || "Editar Usuário" },
        ]}
        showBackButton={true}
        backHref="/config/users"
      />
      <BaseBody title="Editar Usuário" subtitle={`Gerenciar permissões de ${user.email}`}>
        <AdminUserPermissionsForm
          user={user}
          profiles={profiles}
          customers={customers}
          adminCustomers={Array.isArray(adminCustomers) ? adminCustomers.map((ac) => ac.idCustomer).filter((id): id is number => id !== null) : []}
          isoCommissionLinks={isoCommissionLinks.map(l => ({
            customerId: l.customerId,
            customerName: l.customerName,
            commissionType: l.commissionType,
          }))}
          isSuperAdmin={isSuperAdmin}
        />
      </BaseBody>
    </>
  );
}
