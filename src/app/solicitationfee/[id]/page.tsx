import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import SolicitationFeeCard from "@/features/solicitationfee/_componentes/solicitationfee-card";
import { TaxEditForm1 } from "@/features/solicitationfee/_componentes/tax-form";
import { getSolicitationFeeById, getSolicitationFeeWithTaxes, TaxEditForm } from "@/features/solicitationfee/server/solicitationfee";
import { TaXEditFormSchema } from "@/features/solicitationfee/schema/schema-tax";
import { brandList, SolicitationFeeProductTypeList } from "@/lib/lookuptables/lookuptables-tax";
import DownloadDocumentsButton from "@/features/solicitationfee/_componentes/dowload-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Função para converter o formato retornado pela API para o formato do formulário
async function convertToTaxEditFormSchema(data: any): Promise<TaXEditFormSchema> {
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
        fee: existingProductType.fee,
        feeAdmin: existingProductType.feeAdmin,
        feeDock: existingProductType.feeDock,
        transactionFeeStart: existingProductType.transactionFeeStart || productTypeItem.transactionFeeStart,
        transactionFeeEnd: existingProductType.transactionFeeEnd || productTypeItem.transactionFeeEnd,
        pixMinimumCostFee: existingProductType.pixMinimumCostFee,
        pixCeilingFee: existingProductType.pixCeilingFee,
        transactionAnticipationMdr: existingProductType.transactionAnticipationMdr,
        noCardFee: existingProductType.noCardFee,
        noCardFeeAdmin: existingProductType.noCardFeeAdmin,
        noCardFeeDock: existingProductType.noCardFeeDock,
        noCardTransactionAnticipationMdr: existingProductType.noCardTransactionAnticipationMdr,
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
        noCardFee: "",
        noCardFeeAdmin: "",
        noCardFeeDock: "",
        noCardTransactionAnticipationMdr: "",
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
      nonCardPixMdr: data.solicitationFee.nonCardPixMdr,
      nonCardPixCeilingFee: data.solicitationFee.nonCardPixCeilingFee,
      nonCardPixMinimumCostFee: data.solicitationFee.nonCardPixMinimumCostFee,
      cardPixMdr: data.solicitationFee.cardPixMdr,
      cardPixCeilingFee: data.solicitationFee.cardPixCeilingFee,
      cardPixMinimumCostFee: data.solicitationFee.cardPixMinimumCostFee,
      compulsoryAnticipationConfig: data.solicitationFee.compulsoryAnticipationConfig,
      eventualAnticipationFee: data.solicitationFee.eventualAnticipationFee,
      solicitationFeeBrands: allBrands
    }
  };
}

export default async function SolicitationFeeDetail({ params }: PageProps) {
  const { id } = await params;
  const solicitationFee = await getSolicitationFeeById(parseInt(id));
  console.log("Solicitação base:", solicitationFee);
  
  // Consultar taxas diretamente do banco de dados
  const solicitationFeeWithTaxes = await getSolicitationFeeWithTaxes(parseInt(id));
  
  console.log("Valores completos das taxas para debug:");
  console.log(JSON.stringify(solicitationFeeWithTaxes, null, 2));
  
  // Converter dados para o formato esperado pelo componente, preservando os valores originais
  const formattedData = await convertToTaxEditFormSchema(solicitationFeeWithTaxes);
  
  return (
    <>
      <BaseHeader
        breadcrumbItems={[{ title: "Solicitações de Taxas", url: "/solicitationfee" }]}
      />
      
      <BaseBody title="Solicitação de Taxa" subtitle="Visualização da solicitação de taxa">
        <div className="mt-8">
          <SolicitationFeeCard id={parseInt(id)} solicitationFee={solicitationFee ?? undefined} />
        </div>

        <div className="mt-4 flex justify-end">
          <DownloadDocumentsButton solicitationFeeId={parseInt(id)} />
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