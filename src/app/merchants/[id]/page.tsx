import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { requireMerchantsAccess } from "@/lib/permissions/require-merchants-access";
import { checkPagePermission, isSuperAdmin } from "@/lib/permissions/check-permissions";
import { getMerchantById, getUserMerchantsAccess } from "@/features/merchants/server/merchants";
import { getCnaeMccForDropdown, getEstablishmentFormatForDropdown, getLegalNaturesForDropdown, getSalesAgentForDropdown } from "@/features/merchants/server/merchant-helpers";
import { getContactByMerchantId } from "@/features/merchants/server/merchant-contact";
import { getConfigurationsByMerchantId } from "@/features/merchants/server/merchant-configurations";
import { getMerchantBankAccountById } from "@/features/merchants/server/merchant-bank";
import { getAccountTypeForDropdown, getBankForDropdown, getMerchantPixAccountByMerchantId } from "@/features/merchants/server/merchant-pix-account";
import { getMerchantPriceGroupsBymerchantPricetId } from "@/features/merchants/server/merchant-price-group";
import { getFilesByEntity } from "@/features/categories/server/upload";
import MerchantDisplay from "@/features/merchants/_components/merchant-display";
import MerchantTabs from "@/features/merchants/_components/merchant-tabs";

import { getFeesAction } from "@/features/merchants/server/fee-actions";

export default async function MerchantDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const permissions = await checkPagePermission(
    "Estabelecimentos",
    "Atualizar"
  );

  const merchantId = parseInt(resolvedParams.id);
  const userAccess = await getUserMerchantsAccess();

  const cnaeMccList = await getCnaeMccForDropdown();
  const establishmentFormatList = await getEstablishmentFormatForDropdown();
  const merchant = await getMerchantById(merchantId, userAccess);
  const DDAccountType = await getAccountTypeForDropdown();
  const DDBank = await getBankForDropdown();
  const merchantBankAccount = await getMerchantBankAccountById(
    merchant?.merchants.idMerchantBankAccount || 0
  );
  const DDSalesAgent = await getSalesAgentForDropdown(userAccess);

  // Buscar fees disponíveis para quando não há merchantPriceId
  const feesResult = await getFeesAction(1, 100);
  const availableFees = feesResult?.fees || [];

  // Buscar arquivos do merchant
  const merchantFiles =
    merchantId > 0 ? await getFilesByEntity("merchant", merchantId) : [];

  const legalNatures = await getLegalNaturesForDropdown();

  const contact = await getContactByMerchantId(merchant?.merchants.id || 0);
  const merchantPriceGroups = await getMerchantPriceGroupsBymerchantPricetId(
    merchant?.merchants.idMerchantPrice || 0
  );
  const configurations = await getConfigurationsByMerchantId(
    merchant?.merchants.id || 0
  );

  const pixaccount = await getMerchantPixAccountByMerchantId(
    merchant?.merchants.id || 0
  );

  const formattedMerchantPriceGroups = {
    merchantPrice: {
      id: merchantPriceGroups?.[0]?.merchantPrice?.id || 0,
      name: merchantPriceGroups?.[0]?.merchantPrice?.name || "",
      active: merchantPriceGroups?.[0]?.merchantPrice?.active || false,
      dtinsert: merchantPriceGroups?.[0]?.merchantPrice?.dtinsert || "",
      dtupdate: merchantPriceGroups?.[0]?.merchantPrice?.dtupdate || "",
      tableType: merchantPriceGroups?.[0]?.merchantPrice?.tableType || "",
      slugMerchant: merchantPriceGroups?.[0]?.merchantPrice?.slugMerchant || "",
      compulsoryAnticipationConfig:
        merchantPriceGroups?.[0]?.merchantPrice?.compulsoryAnticipationConfig ||
        0,
      eventualAnticipationFee:
        Number(
          merchantPriceGroups?.[0]?.merchantPrice?.eventualAnticipationFee
        ) || 0,
      nonCardPixMinimumCostFee:
        Number(
          merchantPriceGroups?.[0]?.merchantPrice?.nonCardPixMinimumCostFee
        ) || 0,
      anticipationType:
        merchantPriceGroups?.[0]?.merchantPrice?.anticipationType || "",
      cardPixMdr:
        Number(merchantPriceGroups?.[0]?.merchantPrice?.cardPixMdr) || 0,
      cardPixCeilingFee:
        Number(merchantPriceGroups?.[0]?.merchantPrice?.cardPixCeilingFee) || 0,
      cardPixMinimumCostFee:
        Number(
          merchantPriceGroups?.[0]?.merchantPrice?.cardPixMinimumCostFee
        ) || 0,
      nonCardPixMdr:
        Number(merchantPriceGroups?.[0]?.merchantPrice?.nonCardPixMdr) || 0,
      nonCardPixCeilingFee:
        Number(merchantPriceGroups?.[0]?.merchantPrice?.nonCardPixCeilingFee) ||
        0,
    },
    merchantpricegroup:
      merchantPriceGroups?.map((group) => ({
        id: group.priceGroup?.id || 0,
        name: group.priceGroup?.brand || "",
        active: group.priceGroup?.active || false,
        dtinsert: group.priceGroup?.dtinsert || "",
        dtupdate: group.priceGroup?.dtupdate || "",
        idMerchantPrice: group.merchantPrice?.id || 0,
        listMerchantTransactionPrice:
          typeof group.transactionPrices === "string"
            ? JSON.parse(group.transactionPrices)
            : group.transactionPrices || [],
      })) || [],
  };

  if (!merchant) {
    return (
      <>
        <BaseHeader
          breadcrumbItems={[
            { title: "Estabelecimentos", subtitle: "", url: "/merchants" },
          ]}
        />
        <BaseBody title="Estabelecimento" subtitle="Estabelecimento não encontrado">
          <div className="p-4 text-center">
            <p className="text-muted-foreground">Estabelecimento não encontrado ou você não tem acesso a ele.</p>
          </div>
        </BaseBody>
      </>
    );
  }

  // Verificar se é criação (id = 0) ou edição
  const isCreating = merchant.merchants.id === 0 || !merchant.merchants.idMerchantPrice;

  // Verificar se o usuário pode editar:
  // 1. Super Admin sempre pode editar
  // 2. Usuário com permissão "Atualizar" pode editar
  // 3. O acesso ao estabelecimento específico já foi verificado pelo getMerchantById
  //    (getMerchantById verifica se o estabelecimento pertence a um ISO que o usuário tem acesso)
  const isSuper = await isSuperAdmin();
  const canEdit = isSuper || permissions?.includes("Atualizar") || permissions?.includes("Inserir");

  return (
    <>
      <BaseHeader
        breadcrumbItems={[
          { title: "Estabelecimentos", subtitle: "", url: "/merchants" },
          { title: merchant.merchants.name || "Estabelecimento", subtitle: "", url: `/merchants/${merchantId}` },
        ]}
      />

      <BaseBody
        title="Estabelecimento"
        subtitle={
          isCreating
            ? "Adicionar Estabelecimento"
            : "Editar Estabelecimento"
        }
      >
        {(isCreating || canEdit) ? (
          <MerchantTabs
            merchant={{
              id: merchant.merchants.id,
              slug: merchant.merchants.slug,
              active: merchant.merchants.active ?? false,
              dtinsert: merchant.merchants.dtinsert || "",
              dtupdate: merchant.merchants.dtupdate || "",
              idMerchant: merchant.merchants.idMerchant || "",
              name: merchant.merchants.name || "",
              idDocument: merchant.merchants.idDocument || "",
              corporateName: merchant.merchants.corporateName || "",
              email: merchant.merchants.email || "",
              areaCode: merchant.merchants.areaCode || "",
              number: merchant.merchants.number || "",
              phoneType: merchant.merchants.phoneType || "",
              language: merchant.merchants.language || "",
              timezone: merchant.merchants.timezone || "",
              slugCustomer: merchant.merchants.slugCustomer || "",
              riskAnalysisStatus: merchant.merchants.riskAnalysisStatus || "",
              riskAnalysisStatusJustification: merchant.merchants.riskAnalysisStatusJustification || "",
              legalPerson: merchant.merchants.legalPerson || "",
              openingDate: merchant.merchants.openingDate || "",
              inclusion: merchant.merchants.inclusion || "",
              openingDays: merchant.merchants.openingDays || "",
              openingHour: merchant.merchants.openingHour || "",
              closingHour: merchant.merchants.closingHour || "",
              municipalRegistration: merchant.merchants.municipalRegistration || "",
              stateSubcription: merchant.merchants.stateSubcription || "",
              hasTef: merchant.merchants.hasTef ?? false,
              hasPix: merchant.merchants.hasPix ?? false,
              hasTop: merchant.merchants.hasTop ?? false,
              establishmentFormat: merchant.merchants.establishmentFormat || "",
              revenue: merchant.merchants.revenue ? Number(merchant.merchants.revenue) : null,
              idCategory: merchant.merchants.idCategory ? Number(merchant.merchants.idCategory) : null,
              slugCategory: merchant.merchants.slugCategory || "",
              idLegalNature: merchant.merchants.idLegalNature ? Number(merchant.merchants.idLegalNature) : null,
              slugLegalNature: merchant.merchants.slugLegalNature || "",
              idSalesAgent: merchant.merchants.idSalesAgent ? Number(merchant.merchants.idSalesAgent) : null,
              slugSalesAgent: merchant.merchants.slugSalesAgent || "",
              idConfiguration: merchant.merchants.idConfiguration ? Number(merchant.merchants.idConfiguration) : null,
              slugConfiguration: merchant.merchants.slugConfiguration || "",
              idAddress: merchant.merchants.idAddress ? Number(merchant.merchants.idAddress) : null,
              idMerchantPrice: merchant.merchants.idMerchantPrice ? Number(merchant.merchants.idMerchantPrice) : null,
              idCustomer: merchant.merchants.idCustomer ? Number(merchant.merchants.idCustomer) : null,
              idMerchantBankAccount: merchant.merchants.idMerchantBankAccount ? Number(merchant.merchants.idMerchantBankAccount) : null,
              cnae: merchant.categories?.cnae || "",
              mcc: merchant.categories?.mcc || "",
              customer: merchant.merchants.slugCustomer || "",
              registration: merchant.merchants.municipalRegistration || "",
            }}
            address={{
              id: merchant.addresses?.id || 0,
              streetAddress: merchant.addresses?.streetAddress || "",
              streetNumber: merchant.addresses?.streetNumber || "",
              complement: merchant.addresses?.complement || "",
              neighborhood: merchant.addresses?.neighborhood || "",
              city: merchant.addresses?.city || "",
              state: merchant.addresses?.state || "",
              country: merchant.addresses?.country || "",
              zipCode: merchant.addresses?.zipCode || "",
            }}
            Contacts={{
              contacts: contact?.[0]?.contacts || ({} as any),
              addresses: contact?.[0]?.addresses || ({} as any),
            }}
            addresses={{
              id: contact?.[0]?.addresses?.id || 0,
              streetAddress: contact?.[0]?.addresses?.streetAddress || "",
              streetNumber: contact?.[0]?.addresses?.streetNumber || "",
              complement: contact?.[0]?.addresses?.complement || "",
              neighborhood: contact?.[0]?.addresses?.neighborhood || "",
              city: contact?.[0]?.addresses?.city || "",
              state: contact?.[0]?.addresses?.state || "",
              country: contact?.[0]?.addresses?.country || "",
              zipCode: contact?.[0]?.addresses?.zipCode || "",
            }}
            configurations={{
              configurations: configurations || ({} as any),
            }}
            merchantBankAccount={{
              merchantBankAccount: merchantBankAccount?.merchantBankAccount || ({} as any),
            }}
            merchantPixAccount={{
              pixaccounts: pixaccount,
              merchantcorporateName: merchant.merchants.corporateName || "",
              merchantdocumentId: merchant.merchants.idDocument || "",
              legalPerson: merchant.merchants.legalPerson || "",
            }}
            merchantPriceGroupProps={{
              merchantPrice: {
                id: formattedMerchantPriceGroups.merchantPrice.id,
                name: formattedMerchantPriceGroups.merchantPrice.name,
                active: formattedMerchantPriceGroups.merchantPrice.active,
                dtinsert: formattedMerchantPriceGroups.merchantPrice.dtinsert,
                dtupdate: formattedMerchantPriceGroups.merchantPrice.dtupdate,
                tableType: formattedMerchantPriceGroups.merchantPrice.tableType,
                slugMerchant: formattedMerchantPriceGroups.merchantPrice.slugMerchant,
                compulsoryAnticipationConfig: formattedMerchantPriceGroups.merchantPrice.compulsoryAnticipationConfig,
                anticipationType: formattedMerchantPriceGroups.merchantPrice.anticipationType,
                eventualAnticipationFee: formattedMerchantPriceGroups.merchantPrice.eventualAnticipationFee,
                cardPixMdr: formattedMerchantPriceGroups.merchantPrice.cardPixMdr,
                cardPixCeilingFee: formattedMerchantPriceGroups.merchantPrice.cardPixCeilingFee,
                cardPixMinimumCostFee: formattedMerchantPriceGroups.merchantPrice.cardPixMinimumCostFee,
                nonCardPixMdr: formattedMerchantPriceGroups.merchantPrice.nonCardPixMdr,
                nonCardPixCeilingFee: formattedMerchantPriceGroups.merchantPrice.nonCardPixCeilingFee,
                nonCardPixMinimumCostFee: formattedMerchantPriceGroups.merchantPrice.nonCardPixMinimumCostFee,
                merchantpricegroup: formattedMerchantPriceGroups.merchantpricegroup,
              },
              merchantpricegroup: formattedMerchantPriceGroups.merchantpricegroup,
              availableFees: availableFees,
            }}
            cnaeMccList={cnaeMccList}
            legalNatures={legalNatures}
            establishmentFormatList={establishmentFormatList}
            DDAccountType={DDAccountType}
            DDBank={DDBank}
            permissions={permissions}
            merchantFiles={merchantFiles}
            DDSalesAgent={DDSalesAgent}
            isSuperAdmin={isSuper}
          />
        ) : (
          <MerchantDisplay
            merchant={{
              id: merchant.merchants.id,
              slug: merchant.merchants.slug,
              active: merchant.merchants.active ?? false,
              dtinsert: merchant.merchants.dtinsert || "",
              dtupdate: merchant.merchants.dtupdate || "",
              idMerchant: merchant.merchants.idMerchant || "",
              name: merchant.merchants.name || "",
              idDocument: merchant.merchants.idDocument || "",
              corporateName: merchant.merchants.corporateName || "",
              email: merchant.merchants.email || "",
              areaCode: merchant.merchants.areaCode || "",
              number: merchant.merchants.number || "",
              phoneType: merchant.merchants.phoneType || "",
              language: merchant.merchants.language || "",
              timezone: merchant.merchants.timezone || "",
              slugCustomer: merchant.merchants.slugCustomer || "",
              riskAnalysisStatus: merchant.merchants.riskAnalysisStatus || "",
              riskAnalysisStatusJustification: merchant.merchants.riskAnalysisStatusJustification || "",
              legalPerson: merchant.merchants.legalPerson || "",
              openingDate: merchant.merchants.openingDate || "",
              inclusion: merchant.merchants.inclusion || "",
              openingDays: merchant.merchants.openingDays || "",
              openingHour: merchant.merchants.openingHour || "",
              closingHour: merchant.merchants.closingHour || "",
              municipalRegistration: merchant.merchants.municipalRegistration || "",
              stateSubcription: merchant.merchants.stateSubcription || "",
              hasTef: merchant.merchants.hasTef ?? false,
              hasPix: merchant.merchants.hasPix ?? false,
              hasTop: merchant.merchants.hasTop ?? false,
              establishmentFormat: merchant.merchants.establishmentFormat || "",
              revenue: merchant.merchants.revenue ? Number(merchant.merchants.revenue) : null,
              idCategory: merchant.merchants.idCategory ? Number(merchant.merchants.idCategory) : null,
              slugCategory: merchant.merchants.slugCategory || "",
              idLegalNature: merchant.merchants.idLegalNature ? Number(merchant.merchants.idLegalNature) : null,
              slugLegalNature: merchant.merchants.slugLegalNature || "",
              idSalesAgent: merchant.merchants.idSalesAgent ? Number(merchant.merchants.idSalesAgent) : null,
              slugSalesAgent: merchant.merchants.slugSalesAgent || "",
              idConfiguration: merchant.merchants.idConfiguration ? Number(merchant.merchants.idConfiguration) : null,
              slugConfiguration: merchant.merchants.slugConfiguration || "",
              idAddress: merchant.merchants.idAddress ? Number(merchant.merchants.idAddress) : null,
              idMerchantPrice: merchant.merchants.idMerchantPrice ? Number(merchant.merchants.idMerchantPrice) : null,
              idCustomer: merchant.merchants.idCustomer ? Number(merchant.merchants.idCustomer) : null,
              idMerchantBankAccount: merchant.merchants.idMerchantBankAccount ? Number(merchant.merchants.idMerchantBankAccount) : null,
              cnae: merchant.categories?.cnae || "",
              mcc: merchant.categories?.mcc || "",
              customer: merchant.merchants.slugCustomer || "",
              registration: merchant.merchants.municipalRegistration || "",
            }}
            address={{
              id: merchant.addresses?.id || 0,
              streetAddress: merchant.addresses?.streetAddress || "",
              streetNumber: merchant.addresses?.streetNumber || "",
              complement: merchant.addresses?.complement || "",
              neighborhood: merchant.addresses?.neighborhood || "",
              city: merchant.addresses?.city || "",
              state: merchant.addresses?.state || "",
              country: merchant.addresses?.country || "",
              zipCode: merchant.addresses?.zipCode || "",
            }}
            Contacts={{
              contacts: contact?.[0]?.contacts || ({} as any),
              addresses: contact?.[0]?.addresses || ({} as any),
            }}
            addresses={{
              id: contact?.[0]?.addresses?.id || 0,
              streetAddress: contact?.[0]?.addresses?.streetAddress || "",
              streetNumber: contact?.[0]?.addresses?.streetNumber || "",
              complement: contact?.[0]?.addresses?.complement || "",
              neighborhood: contact?.[0]?.addresses?.neighborhood || "",
              city: contact?.[0]?.addresses?.city || "",
              state: contact?.[0]?.addresses?.state || "",
              country: contact?.[0]?.addresses?.country || "",
              zipCode: contact?.[0]?.addresses?.zipCode || "",
            }}
            configurations={{
              configurations: configurations || ({} as any),
            }}
            merchantBankAccount={{
              merchantBankAccount: merchantBankAccount?.merchantBankAccount || ({} as any),
            }}
            merchantPixAccount={{
              pixaccounts: pixaccount,
              merchantcorporateName: merchant.merchants.corporateName || "",
              merchantdocumentId: merchant.merchants.idDocument || "",
              legalPerson: merchant.merchants.legalPerson || "",
            }}
            merchantPriceGroupProps={{
              merchantPrice: {
                id: formattedMerchantPriceGroups.merchantPrice.id,
                name: formattedMerchantPriceGroups.merchantPrice.name,
                active: formattedMerchantPriceGroups.merchantPrice.active,
                dtinsert: formattedMerchantPriceGroups.merchantPrice.dtinsert,
                dtupdate: formattedMerchantPriceGroups.merchantPrice.dtupdate,
                tableType: formattedMerchantPriceGroups.merchantPrice.tableType,
                slugMerchant: formattedMerchantPriceGroups.merchantPrice.slugMerchant,
                compulsoryAnticipationConfig: formattedMerchantPriceGroups.merchantPrice.compulsoryAnticipationConfig,
                anticipationType: formattedMerchantPriceGroups.merchantPrice.anticipationType,
                eventualAnticipationFee: formattedMerchantPriceGroups.merchantPrice.eventualAnticipationFee,
                cardPixMdr: formattedMerchantPriceGroups.merchantPrice.cardPixMdr,
                cardPixCeilingFee: formattedMerchantPriceGroups.merchantPrice.cardPixCeilingFee,
                cardPixMinimumCostFee: formattedMerchantPriceGroups.merchantPrice.cardPixMinimumCostFee,
                nonCardPixMdr: formattedMerchantPriceGroups.merchantPrice.nonCardPixMdr,
                nonCardPixCeilingFee: formattedMerchantPriceGroups.merchantPrice.nonCardPixCeilingFee,
                nonCardPixMinimumCostFee: formattedMerchantPriceGroups.merchantPrice.nonCardPixMinimumCostFee,
                merchantpricegroup: formattedMerchantPriceGroups.merchantpricegroup,
              },
              merchantpricegroup: formattedMerchantPriceGroups.merchantpricegroup,
              availableFees: availableFees,
            }}
            cnaeMccList={cnaeMccList}
            legalNatures={legalNatures}
            establishmentFormatList={establishmentFormatList}
            DDAccountType={DDAccountType}
            DDBank={DDBank}
            permissions={permissions}
            merchantFiles={merchantFiles}
            DDSalesAgent={DDSalesAgent}
          />
        )}
      </BaseBody>
    </>
  );
}

