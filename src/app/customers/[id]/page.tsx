import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import CustomerWizardForm from "@/features/customers/_componentes/customer-wizard-form";

import { getCustomerById } from "@/features/customers/server/customers";
import { getDDProfiles } from "@/features/customers/users/_actions/user-actions";
import CustomerActionButtons from "@/features/customers/_componentes/buttonIsActive";

// Definir explicitamente os params
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetail({ params }: PageProps) {
    // Aguardar a resolução dos parâmetros
    const { id } = await params;
    
    // Buscar o cliente usando o ID
    const Customer = await getCustomerById(parseInt(id));

    const profiles = await getDDProfiles();

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
            name: ''
          }} 
          profiles={profiles} 
        />
      </BaseBody>
    </>
    )
}
