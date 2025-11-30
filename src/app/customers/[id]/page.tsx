import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import CustomerWizardForm from "@/features/customers/_componentes/customer-wizard-form";

import { getCustomerById } from "@/features/customers/server/customers";
import { getDDProfiles } from "@/features/customers/users/_actions/user-actions";
import CustomerActionButtons from "@/features/customers/_componentes/buttonIsActive";
import { getCustomizationByCustomerId } from "@/utils/serverActions";
import { requireAdmin } from "@/lib/permissions/require-admin";

// Definir explicitamente os params
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetail({ params }: PageProps) {
    try {
      // Verificar se usuário é admin antes de mostrar a página
      await requireAdmin();
    } catch (error) {
      // Se requireAdmin redirecionar, isso será tratado pelo middleware
      throw error;
    }
    
    const { id } = await params;
    
    const customerId = parseInt(id);
    if (isNaN(customerId)) {
      const profiles = await getDDProfiles();
      return (
        <>
          <BaseHeader
            breadcrumbItems={[{ title: "ISOS", subtitle: "", url: "/customers" }]}
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
    let Customer;
    try {
      Customer = await getCustomerById(customerId);
      
      // Se customer não existe e ID é válido, retornar página de erro
      if (!Customer && !isNaN(customerId)) {
        return (
          <>
            <BaseHeader
              breadcrumbItems={[{ title: "ISOS", subtitle: "", url: "/customers" }]}
            />
            <BaseBody title="ISO não encontrado" subtitle={`O ISO com ID ${customerId} não foi encontrado.`}>
              <div className="p-4 text-center">
                <p className="text-muted-foreground">O ISO solicitado não existe ou foi removido.</p>
              </div>
            </BaseBody>
          </>
        );
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      return (
        <>
          <BaseHeader
            breadcrumbItems={[{ title: "ISOS", subtitle: "", url: "/customers" }]}
          />
          <BaseBody title="Erro" subtitle={`Ocorreu um erro ao carregar o ISO.`}>
            <div className="p-4 text-center">
              <p className="text-muted-foreground">Não foi possível carregar as informações do ISO.</p>
            </div>
          </BaseBody>
        </>
      );
    }

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
        breadcrumbItems={[{ title: "ISOS",subtitle: "",url: "/customers" }]}
      />
      <BaseBody title="ISO" subtitle={`Visualização do ISO`} actions={
         Customer?.id && <CustomerActionButtons isActive={Customer.isActive ?? true} />
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
