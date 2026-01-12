import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import CustomerWizardForm from "@/features/customers/_componentes/customer-wizard-form";

import { getCustomerById } from "@/features/customers/server/customers";
import { getDDProfiles } from "@/features/customers/users/_actions/user-actions";
import CustomerActionButtons from "@/features/customers/_componentes/buttonIsActive";
import { getCustomizationByCustomerId } from "@/utils/serverActions";
import { requireAdminOrCore, requireIsoAccess } from "@/lib/permissions/require-admin";
import { getCurrentUserInfo, isCoreProfile } from "@/lib/permissions/check-permissions";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Definir explicitamente os params
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetail({ params }: PageProps) {
    // Verificar se usuário é admin ou CORE antes de mostrar a página
    await requireAdminOrCore();
    
    // Obter informações do usuário atual para controle de permissões
    const userInfo = await getCurrentUserInfo();
    const isCore = await isCoreProfile();
    
    // Determinar permissões para os botões
    // - canDeactivate: SUPER_ADMIN, CORE, ISO_ADMIN (ISO_PORTAL_ADMIN)
    // - canDelete: apenas SUPER_ADMIN
    const canDeactivate = userInfo?.isSuperAdmin || userInfo?.isAdmin || isCore;
    const canDelete = userInfo?.isSuperAdmin || false;
    
    const { id } = await params;
    
    const customerId = parseInt(id);
    
    // Verificar se o usuário tem acesso ao ISO específico
    // customerId 0 = criação de novo ISO (permitido para todos com acesso à página)
    await requireIsoAccess(customerId || 0);
    
    if (isNaN(customerId)) {
      const profiles = await getDDProfiles();
      return (
        <>
          <BaseHeader
            breadcrumbItems={[
              { title: "ISOs", url: "/customers" },
              { title: "Novo ISO" }
            ]}
            showBackButton={true}
            backHref="/customers"
          />
          <BaseBody title="ISO" subtitle={`Criação de novo ISO`}>
            <CustomerWizardForm 
              customer={{
                name: '',
                id: undefined,
                slug: undefined,
                customerId: undefined,
                settlementManagementType: undefined,
                idParent: undefined
              }} 
              profiles={profiles}
              customizationInitial={null}
            />
          </BaseBody>
        </>
      );
    }
    
    // Buscar o cliente usando o ID
    const Customer = await getCustomerById(customerId);

    const profiles = await getDDProfiles();
    
    // Buscar a customização no servidor (se o cliente existir)
    let customizationInitial = null;
    if (Customer?.id) {
      try {
        const customization = await getCustomizationByCustomerId(Customer.id);
        if (customization) {
          customizationInitial = JSON.parse(
            JSON.stringify(customization, (_, value) =>
              typeof value === 'bigint' ? Number(value) : value
            )
          );
        }
      } catch (error) {
        console.error("Error fetching customization:", error);
      }
    }

    return (
    <>
    <BaseHeader
        breadcrumbItems={[
          { title: "ISOs", url: "/customers" },
          { title: Customer?.name || "Detalhes" }
        ]}
        showBackButton={true}
        backHref="/customers"
      />
      <BaseBody title="ISO" subtitle={`Visualização do ISO`} actions={
         Customer?.id && <CustomerActionButtons isActive={Customer.isActive ?? true} canDeactivate={canDeactivate} canDelete={canDelete} />
      }>
        <CustomerWizardForm 
          customer={Customer ? {
            name: Customer.name || '',
            id: Customer.id,
            slug: Customer.slug,
            customerId: Customer.customerId || undefined,
            settlementManagementType: Customer.settlementManagementType || undefined,
            idParent: Customer.idParent || undefined
          } : {
            name: '',
            id: undefined,
            slug: undefined,
            customerId: undefined,
            settlementManagementType: undefined,
            idParent: undefined
          }} 
          profiles={profiles}
          customizationInitial={customizationInitial}
        />
      </BaseBody>
    </>
    )
}
