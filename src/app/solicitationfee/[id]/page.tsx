import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import SolicitationFeeCard from "@/features/solicitationfee/_componentes/solicitationfee-card";
import { TaxEditForm1 } from "@/features/solicitationfee/_componentes/tax-form";
import { getSolicitationFeeById, getSolicitationFeeWithTaxes } from "@/features/solicitationfee/server/solicitationfee";
import { TaXEditFormSchema } from "@/features/solicitationfee/schema/schema-tax";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Função para converter o formato retornado pela API para o formato do formulário
function convertToTaxEditFormSchema(data: any): TaXEditFormSchema {
  if (!data) return {} as TaXEditFormSchema;
  
  return {
    solicitationFee: {
      id: data.solicitationFee.id,
      slug: data.solicitationFee.slug,
      cnae: data.solicitationFee.cnae,
      idCustomers: data.solicitationFee.idCustomers,
      mcc: data.solicitationFee.mcc,
      cnpjQuantity: data.solicitationFee.cnpjQuantity,
      monthlyPosFee: data.solicitationFee.monthlyPosFee,
      averageTicket: data.solicitationFee.averageTicket,
      description: data.solicitationFee.description,
      cnaeInUse: data.solicitationFee.cnaeInUse,
      status: data.solicitationFee.status,
      dtinsert: data.solicitationFee.dtinsert ? new Date(data.solicitationFee.dtinsert) : undefined,
      dtupdate: data.solicitationFee.dtupdate ? new Date(data.solicitationFee.dtupdate) : undefined,
      solicitationFeeBrands: Array.isArray(data.solicitationFee.solicitationFeeBrands) 
        ? data.solicitationFee.solicitationFeeBrands.map((brand: any) => ({
            id: brand.id,
            slug: brand.slug,
            brand: brand.brand,
            solicitationFeeId: brand.solicitationFeeId,
            dtinsert: brand.dtinsert ? new Date(brand.dtinsert) : undefined,
            dtupdate: brand.dtupdate ? new Date(brand.dtupdate) : undefined,
            solicitationBrandProductTypes: Array.isArray(brand.solicitationBrandProductTypes)
              ? brand.solicitationBrandProductTypes.map((type: any) => ({
                  id: type.id,
                  slug: type.slug,
                  productType: type.productType,
                  fee: String(type.fee || ""),
                  feeAdmin: String(type.feeAdmin || ""),
                  feeDock: String(type.feeDock || ""),
                  transactionFeeStart: String(type.transactionFeeStart || ""),
                  transactionFeeEnd: String(type.transactionFeeEnd || ""),
                  pixMinimumCostFee: String(type.pixMinimumCostFee || ""),
                  pixCeilingFee: String(type.pixCeilingFee || ""),
                  transactionAnticipationMdr: String(type.transactionAnticipationMdr || ""),
                  dtinsert: type.dtinsert ? new Date(type.dtinsert) : undefined,
                  dtupdate: type.dtupdate ? new Date(type.dtupdate) : undefined,
                }))
              : []
          }))
        : []
    }
  };
}

export default async function SolicitationFeeDetail({ params }: PageProps) {
  const { id } = await params;
  const solicitationFee = await getSolicitationFeeById(parseInt(id));
  const solicitationFeeWithTaxes = await getSolicitationFeeWithTaxes(parseInt(id));
  
  // Converter dados para o formato esperado pelo componente
  const formattedData = convertToTaxEditFormSchema(solicitationFeeWithTaxes);

  return (
    <>
      <BaseHeader
        breadcrumbItems={[{ title: "Solicitações de Taxas", url: "/solicitationfee" }]}
      />
      
      <BaseBody title="Solicitação de Taxa" subtitle="Visualização da solicitação de taxa">
        <div className="mt-8">
          <SolicitationFeeCard id={parseInt(id)} solicitationFee={solicitationFee ?? undefined} />
        </div>

        <div className="mt-8">
          {solicitationFeeWithTaxes ? (
            <TaxEditForm1 
              solicitationFeetax={formattedData} 
              idsolicitationFee={parseInt(id)} 
            />
          ) : (
            <p>Carregando dados de taxas...</p>
          )}
        </div>
      </BaseBody>
    </>
  );
} 