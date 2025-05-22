import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import SolicitationFeeCard from "@/features/solicitationfee/_componentes/solicitationfee-card";
import { TaxEditForm1 } from "@/features/solicitationfee/_componentes/tax-form";
import { getSolicitationFeeById, getSolicitationFeeWithTaxes } from "@/features/solicitationfee/server/solicitationfee";
import { TaXEditFormSchema } from "@/features/solicitationfee/schema/schema-tax";
import { brandList, SolicitationFeeProductTypeList } from "@/lib/lookuptables/lookuptables-tax";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Função para converter o formato retornado pela API para o formato do formulário
function convertToTaxEditFormSchema(data: any): TaXEditFormSchema {
  if (!data) return {} as TaXEditFormSchema;
  
  // Criar uma estrutura completa para todas as marcas e tipos de produtos
  const allBrands = brandList.map(brandItem => {
    // Encontrar a marca correspondente nos dados recebidos
    const existingBrand = data.solicitationFee.solicitationFeeBrands?.find(
      (b: any) => b.brand === brandItem.value
    );
    
    // Se a marca existir, usar seus dados, senão criar nova
    const brand = existingBrand || {
      id: 0,
      slug: "",
      brand: brandItem.value,
      solicitationFeeId: data.solicitationFee.id,
      dtinsert: undefined,
      dtupdate: undefined,
      solicitationBrandProductTypes: []
    };
    
    // Garantir que todos os tipos de produtos existam para cada marca
    const allProductTypes = SolicitationFeeProductTypeList.map(productTypeItem => {
      // Remover espaços extras para melhorar a comparação
      const cleanProductTypeValue = productTypeItem.value.trim();
      
      // Encontrar o tipo de produto correspondente nos dados da marca
      const existingProductType = brand.solicitationBrandProductTypes?.find(
        (p: any) => {
          // Limpar espaços também do valor do banco
          const dbProductType = p?.productType?.trim();
          // Verificar tipo e intervalo
          return dbProductType === cleanProductTypeValue && 
                 String(p.transactionFeeStart) === productTypeItem.transactionFeeStart && 
                 String(p.transactionFeeEnd) === productTypeItem.transactionFeeEnd;
        }
      );
      
      // Se o tipo de produto existir, usar seus dados, senão criar novo
      return existingProductType ? {
        id: existingProductType.id,
        slug: existingProductType.slug,
        productType: cleanProductTypeValue,
        fee: String(existingProductType.fee || ""),
        feeAdmin: String(existingProductType.feeAdmin || ""),
        feeDock: String(existingProductType.feeDock || ""),
        transactionFeeStart: String(existingProductType.transactionFeeStart || productTypeItem.transactionFeeStart),
        transactionFeeEnd: String(existingProductType.transactionFeeEnd || productTypeItem.transactionFeeEnd),
        pixMinimumCostFee: String(existingProductType.pixMinimumCostFee || ""),
        pixCeilingFee: String(existingProductType.pixCeilingFee || ""),
        transactionAnticipationMdr: String(existingProductType.transactionAnticipationMdr || ""),
        dtinsert: existingProductType.dtinsert ? new Date(existingProductType.dtinsert) : undefined,
        dtupdate: existingProductType.dtupdate ? new Date(existingProductType.dtupdate) : undefined
      } : {
        id: 0,
        slug: "",
        productType: cleanProductTypeValue,
        fee: "",
        feeAdmin: "",
        feeDock: "",
        transactionFeeStart: productTypeItem.transactionFeeStart,
        transactionFeeEnd: productTypeItem.transactionFeeEnd,
        pixMinimumCostFee: "",
        pixCeilingFee: "",
        transactionAnticipationMdr: "",
        dtinsert: undefined,
        dtupdate: undefined
      };
    });
    
    // Retornar a marca com todos os tipos de produtos
    return {
      ...brand,
      solicitationBrandProductTypes: allProductTypes
    };
  });
  
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
      solicitationFeeBrands: allBrands
    }
  };
}

export default async function SolicitationFeeDetail({ params }: PageProps) {
  const { id } = await params;
  const solicitationFee = await getSolicitationFeeById(parseInt(id));
  console.log(solicitationFee);
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