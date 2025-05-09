import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import CustomersForm from "@/features/customers/_componentes/customers-form";
import { getCustomerById } from "@/features/customers/server/customers";

// Definir explicitamente os params
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetail({ params }: PageProps) {
    // Aguardar a resolução dos parâmetros
    const { id } = await params;
    
    // Buscar o cliente usando o ID
    const Customer = await getCustomerById(parseInt(id));

    return (
    <>
    <BaseHeader
        breadcrumbItems={[{ title: "Clientes", url: "/customers" }]}
      />
      <BaseBody title="Cliente" subtitle={`Visualização do cliente`}>
        <CustomersForm customer={Customer && {
          slug: Customer.slug,
          name: Customer.name || "",
          customerId: Customer.customerId || undefined,
          settlementManagementType: Customer.settlementManagementType || undefined,
          id: Customer.id,
          idParent: Customer.idParent || undefined
        }} />
      </BaseBody>
    </>
    )
}
