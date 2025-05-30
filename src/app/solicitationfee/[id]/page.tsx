import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import SolicitationFeeCard from "@/features/solicitationfee/_componentes/solicitationfee-card";
import { TaxEditForm1 } from "@/features/solicitationfee/_componentes/tax-form";
import { getSolicitationFeeById, getSolicitationFeeWithTaxes } from "@/features/solicitationfee/server/solicitationfee";
import { brandList, SolicitationFeeProductTypeList } from "@/lib/lookuptables/lookuptables-tax";
import { TaxEditForm, TaXEditFormSchema, SolicitationFeeBrand, SolicitationBrandProductType, FormSolicitationFee } from "@/features/solicitationfee/types/types";
import DownloadDocumentsButton from "@/features/solicitationfee/_componentes/dowload-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Função para converter o formato retornado pela API para o formato do formulário
async function convertToTaxEditFormSchema(Data: unknown): Promise<TaXEditFormSchema> {
  const data = Data as TaxEditForm | null;
  
  if (!data) {
    const emptyFormData: FormSolicitationFee = {
      id: 0,
      slug: null,
      cnae: null,
      idCustomers: 0,
      mcc: null,
      cnpjQuantity: 0,
      monthlyPosFee: 0,
      averageTicket: 0,
      description: null,
      cnaeInUse: undefined,
      status: "",
      solicitationFeeBrands: [],
      compulsoryAnticipationConfig: 0,
      // PIX Online (nonCard)
      nonCardPixMdr: null,
      nonCardPixMdrAdmin: null,
      nonCardPixMdrDock: null,
      nonCardPixCeilingFee: null,
      nonCardPixCeilingFeeAdmin: null,
      nonCardPixCeilingFeeDock: null,
      nonCardPixMinimumCostFee: null,
      nonCardPixMinimumCostFeeAdmin: null,
      nonCardPixMinimumCostFeeDock: null,
      // PIX Pos (card)
      cardPixMdr: null,
      cardPixMdrAdmin: null,
      cardPixMdrDock: null,
      cardPixCeilingFee: null,
      cardPixCeilingFeeAdmin: null,
      cardPixCeilingFeeDock: null,
      cardPixMinimumCostFee: null,
      cardPixMinimumCostFeeAdmin: null,
      cardPixMinimumCostFeeDock: null,
      // Antecipação
      eventualAnticipationFee: null,
      eventualAnticipationFeeAdmin: null,
      eventualAnticipationFeeDock: null,
      nonCardEventualAnticipationFee: null,
      nonCardEventualAnticipationFeeAdmin: null,
      nonCardEventualAnticipationFeeDock: null
    };
    
    return { solicitationFee: emptyFormData };
  }

  const allBrands: SolicitationFeeBrand[] = brandList.map(brandItem => {
    const existingBrand = data.solicitationFee.solicitationFeeBrands?.find(
      (b) => b.brand === brandItem.value
    );

    const allProductTypes: SolicitationBrandProductType[] = SolicitationFeeProductTypeList.map(productTypeItem => {
      const cleanProductTypeValue = productTypeItem.value.trim();
      
      const existingProductType = existingBrand?.solicitationBrandProductTypes?.find(
        (p) => {
          const dbProductType = p?.productType?.trim();
          return dbProductType === cleanProductTypeValue && 
                 String(p.transactionFeeStart) === productTypeItem.transactionFeeStart && 
                 String(p.transactionFeeEnd) === productTypeItem.transactionFeeEnd;
        }
      );

      if (existingProductType) {
        return {
          ...existingProductType,
          fee: existingProductType.fee || null,
          feeAdmin: existingProductType.feeAdmin || null,
          feeDock: existingProductType.feeDock || null,
          transactionFeeStart: String(existingProductType.transactionFeeStart || productTypeItem.transactionFeeStart),
          transactionFeeEnd: String(existingProductType.transactionFeeEnd || productTypeItem.transactionFeeEnd)
        };
      }

      return {
        id: 0,
        slug: null,
        productType: cleanProductTypeValue,
        fee: null,
        feeAdmin: null,
        feeDock: null,
        transactionFeeStart: String(productTypeItem.transactionFeeStart),
        transactionFeeEnd: String(productTypeItem.transactionFeeEnd),
        pixMinimumCostFee: null,
        pixCeilingFee: null,
        transactionAnticipationMdr: null,
        noCardFee: null,
        noCardFeeAdmin: null,
        noCardFeeDock: null,
        noCardTransactionAnticipationMdr: null,
        dtinsert: null,
        dtupdate: null
      };
    });

    return {
      id: existingBrand?.id || 0,
      slug: existingBrand?.slug || null,
      brand: brandItem.value,
      solicitationFeeId: data.solicitationFee.id,
      dtinsert: existingBrand?.dtinsert || null,
      dtupdate: existingBrand?.dtupdate || null,
      solicitationBrandProductTypes: allProductTypes
    };
  });

  // Extrair todos os campos do data.solicitationFee
  const {
    id,
    slug,
    cnae,
    idCustomers,
    mcc,
    cnpjQuantity,
    monthlyPosFee,
    averageTicket,
    description,
    status,
    dtinsert,
    dtupdate,
    compulsoryAnticipationConfig,
    // PIX Online (nonCard)
    nonCardPixMdr,
    nonCardPixMdrAdmin,
    nonCardPixMdrDock,
    nonCardPixCeilingFee,
    nonCardPixCeilingFeeAdmin,
    nonCardPixCeilingFeeDock,
    nonCardPixMinimumCostFee,
    nonCardPixMinimumCostFeeAdmin,
    nonCardPixMinimumCostFeeDock,
    // PIX Pos (card)
    cardPixMdr,
    cardPixMdrAdmin,
    cardPixMdrDock,
    cardPixCeilingFee,
    cardPixCeilingFeeAdmin,
    cardPixCeilingFeeDock,
    cardPixMinimumCostFee,
    cardPixMinimumCostFeeAdmin,
    cardPixMinimumCostFeeDock,
    // Antecipação
    eventualAnticipationFee,
    eventualAnticipationFeeAdmin,
    eventualAnticipationFeeDock,
    nonCardEventualAnticipationFee,
    nonCardEventualAnticipationFeeAdmin,
    nonCardEventualAnticipationFeeDock,
  } = data.solicitationFee;

  const formData: FormSolicitationFee = {
    id,
    slug,
    cnae,
    idCustomers,
    mcc,
    cnpjQuantity,
    monthlyPosFee,
    averageTicket,
    description,
    status,
    dtinsert,
    dtupdate,
    compulsoryAnticipationConfig,
    // PIX Online (nonCard)
    nonCardPixMdr: nonCardPixMdr || null,
    nonCardPixMdrAdmin: nonCardPixMdrAdmin || null,
    nonCardPixMdrDock: nonCardPixMdrDock || null,
    nonCardPixCeilingFee: nonCardPixCeilingFee || null,
    nonCardPixCeilingFeeAdmin: nonCardPixCeilingFeeAdmin || null,
    nonCardPixCeilingFeeDock: nonCardPixCeilingFeeDock || null,
    nonCardPixMinimumCostFee: nonCardPixMinimumCostFee || null,
    nonCardPixMinimumCostFeeAdmin: nonCardPixMinimumCostFeeAdmin || null,
    nonCardPixMinimumCostFeeDock: nonCardPixMinimumCostFeeDock || null,
    // PIX Pos (card)
    cardPixMdr: cardPixMdr || null,
    cardPixMdrAdmin: cardPixMdrAdmin || null,
    cardPixMdrDock: cardPixMdrDock || null,
    cardPixCeilingFee: cardPixCeilingFee || null,
    cardPixCeilingFeeAdmin: cardPixCeilingFeeAdmin || null,
    cardPixCeilingFeeDock: cardPixCeilingFeeDock || null,
    cardPixMinimumCostFee: cardPixMinimumCostFee || null,
    cardPixMinimumCostFeeAdmin: cardPixMinimumCostFeeAdmin || null,
    cardPixMinimumCostFeeDock: cardPixMinimumCostFeeDock || null,
    // Antecipação
    eventualAnticipationFee: eventualAnticipationFee || null,
    eventualAnticipationFeeAdmin: eventualAnticipationFeeAdmin || null,
    eventualAnticipationFeeDock: eventualAnticipationFeeDock || null,
    nonCardEventualAnticipationFee: nonCardEventualAnticipationFee || null,
    nonCardEventualAnticipationFeeAdmin: nonCardEventualAnticipationFeeAdmin || null,
    nonCardEventualAnticipationFeeDock: nonCardEventualAnticipationFeeDock || null,
    // Outros campos
    cnaeInUse: data.solicitationFee.cnaeInUse === "true" || data.solicitationFee.cnaeInUse === "1",
    solicitationFeeBrands: allBrands
  };

  return {
    solicitationFee: formData
  };
}

export default async function SolicitationFeeDetail({ params }: PageProps) {
  const { id } = await params;
  const solicitationFee = await getSolicitationFeeById(parseInt(id));
  const solicitationFeeWithTaxes = await getSolicitationFeeWithTaxes(parseInt(id));
  const formattedData = await convertToTaxEditFormSchema(solicitationFeeWithTaxes);
  console.log("formattedData",formattedData)
  
  return (
    <>
      <BaseHeader
        breadcrumbItems={[{ title: "Solicitações de Taxas", url: "/solicitationfee" }]}
      />
      
      <BaseBody title="Solicitação de Taxa" subtitle="Visualização da solicitação de taxa">
        <div className="mt-8">
          <SolicitationFeeCard solicitationFee={solicitationFee ?? undefined} />
        </div>

        <div className="mt-4 flex">
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