"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { MerchantTabsProps } from "@/features/merchants/server/types";
import { Skeleton } from "@/components/ui/skeleton";

// Componente de loading para as tabs
function TabSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Lazy loading dos formulários de cada tab
const MerchantFormCompany = dynamic(() => import("./merchant-form-company"), {
  loading: () => <TabSkeleton />,
  ssr: false
});

const MerchantFormcontact = dynamic(() => import("./merchant-form-contact"), {
  loading: () => <TabSkeleton />,
  ssr: false
});

const MerchantFormOperations = dynamic(() => import("./merchant-form-operation"), {
  loading: () => <TabSkeleton />,
  ssr: false
});

const MerchantFormBankAccount = dynamic(() => import("./merchant-form-bank-account"), {
  loading: () => <TabSkeleton />,
  ssr: false
});

const MerchantFormAuthorizers = dynamic(() => import("./merchant-form-authorizers"), {
  loading: () => <TabSkeleton />,
  ssr: false
});

const MerchantFormTax2 = dynamic(() => import("./merchant-form-tax2"), {
  loading: () => <TabSkeleton />,
  ssr: false
});

const MerchantFormDocuments = dynamic(() => import("./merchant-form-documents"), {
  loading: () => <TabSkeleton />,
  ssr: false
});

const listTabs = [
  "company",
  "contact",
  "operation",
  "bank",
  "authorizers",
  "rate",
  "documents",
];

export default function MerchantTabs({
  merchant,
  address,
  Contacts,
  configurations,
  cnaeMccList,
  merchantBankAccount,
  merchantPixAccount,
  legalNatures,
  establishmentFormatList,
  DDAccountType,
  DDBank,
  merchantPriceGroupProps,
  permissions,
  DDSalesAgent,
  isSuperAdmin = false,
}: MerchantTabsProps) {
  const [activeTab, setActiveTab] = useState("company");

  // Função para navegar entre as tabs
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
  };

  const searchParams = useSearchParams();
  useEffect(() => {
    const tab = searchParams?.get("tab") || "company";
    setActiveTab(tab);
  }, [searchParams]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="space-y-4 w-full"
    >
      <TabsList>
        <TabsTrigger value="company">
          Dados da Empresa
        </TabsTrigger>
        <TabsTrigger value="contact">
          Dados do Responsável
        </TabsTrigger>
        <TabsTrigger value="operation">
          Dados de Operação
        </TabsTrigger>
        <TabsTrigger value="bank">
          Dados Bancários
        </TabsTrigger>
        <TabsTrigger value="authorizers">
          Autorizados
        </TabsTrigger>
        <TabsTrigger value="rate">
          Taxas de Transação
        </TabsTrigger>
        <TabsTrigger value="documents">
          Documentos
        </TabsTrigger>
      </TabsList>

      <TabsContent value="company">
        <MerchantFormCompany
          merchant={{
            ...merchant,
            number: String(merchant.number || ""),
            revenue: String(merchant.revenue || ""),
            idMerchantPrice: merchant.idMerchantPrice || null,
            idMerchantBankAccount: merchant.idMerchantBankAccount || null,
            establishmentFormat: merchant.establishmentFormat || "",
            idCustomer: merchant.idCustomer || null,
            dtdelete: "",
          }}
          address={address}
          Cnae={merchant.cnae}
          Mcc={merchant.mcc}
          DDLegalNature={legalNatures}
          DDCnaeMcc={cnaeMccList}
          DDEstablishmentFormat={establishmentFormatList}
          activeTab={
            listTabs[listTabs.findIndex((tab) => tab === activeTab) + 1]
          }
          setActiveTab={handleTabChange}
          permissions={permissions}
          isSuperAdmin={isSuperAdmin}
        />
      </TabsContent>

      <TabsContent value="contact">
        <MerchantFormcontact
          Contact={
            Contacts?.contacts || {
              id: Contacts?.contacts?.id || 0,
              number: Contacts?.contacts?.number || null,
              name: Contacts?.contacts?.name || null,
              idMerchant: Contacts?.contacts?.idMerchant || null,
              idAddress: Contacts?.contacts?.idAddress || null,
              mothersName: Contacts?.contacts?.mothersName || null,
              isPartnerContact: Contacts?.contacts?.isPartnerContact || null,
              isPep: Contacts?.contacts?.isPep || null,
              idDocument: Contacts?.contacts?.idDocument || null,
              email: Contacts?.contacts?.email || null,
              areaCode: Contacts?.contacts?.areaCode || null,
              phoneType: Contacts?.contacts?.phoneType || null,
              birthDate: Contacts?.contacts?.birthDate || null,
              slugMerchant: Contacts?.contacts?.slugMerchant || null,
              icNumber: Contacts?.contacts?.icNumber || null,
              icDateIssuance: Contacts?.contacts?.icDateIssuance || null,
              icDispatcher: Contacts?.contacts?.icDispatcher || null,
              icFederativeUnit: Contacts?.contacts?.icFederativeUnit || null,
            }
          }
          permissions={permissions}
          Address={
            Contacts?.addresses || {
              id: Contacts?.addresses?.id || 0,
              streetAddress: Contacts?.addresses?.streetAddress || null,
              streetNumber: Contacts?.addresses?.streetNumber || null,
              complement: Contacts?.addresses?.complement || null,
              neighborhood: Contacts?.addresses?.neighborhood || null,
              city: Contacts?.addresses?.city || null,
              state: Contacts?.addresses?.state || null,
              country: Contacts?.addresses?.country || null,
              zipCode: Contacts?.addresses?.zipCode || null,
            }
          }
          idMerchant={merchant.id}
          activeTab={
            listTabs[listTabs.findIndex((tab) => tab === activeTab) + 1]
          }
          setActiveTab={handleTabChange}
          isSuperAdmin={isSuperAdmin}
        />
      </TabsContent>

      <TabsContent value="operation">
        <MerchantFormOperations
          Configuration={{
            id: configurations?.configurations?.id || 0,
            slug: configurations?.configurations?.slug || null,
            active: configurations?.configurations?.active || null,
            dtinsert: configurations?.configurations?.dtinsert || null,
            dtupdate: configurations?.configurations?.dtupdate || null,
            lockCpAnticipationOrder:
              configurations?.configurations?.lockCpAnticipationOrder || null,
            lockCnpAnticipationOrder:
              configurations?.configurations?.lockCnpAnticipationOrder || null,
            url: configurations?.configurations?.url || null,
            anticipationRiskFactorCnp: configurations?.configurations
              ?.anticipationRiskFactorCnp
              ? Number(
                  configurations?.configurations?.anticipationRiskFactorCnp
                )
              : null,
            waitingPeriodCnp: configurations?.configurations?.waitingPeriodCnp
              ? Number(configurations?.configurations?.waitingPeriodCnp)
              : null,
            anticipationRiskFactorCp: configurations?.configurations
              ?.anticipationRiskFactorCp
              ? Number(
                  configurations?.configurations?.anticipationRiskFactorCp
                )
              : null,
            waitingPeriodCp: configurations?.configurations?.waitingPeriodCp
              ? Number(configurations?.configurations?.waitingPeriodCp)
              : null,
          }}
          hasTaf={merchant.hasTef}
          hastop={merchant.hasTop}
          hasPix={merchant.hasPix}
          merhcnatSlug={merchant.slugCategory || ""}
          timezone={merchant.timezone || ""}
          idMerchant={merchant.id}
          setActiveTab={handleTabChange}
          activeTab={
            listTabs[listTabs.findIndex((tab) => tab === activeTab) + 1]
          }
          permissions={permissions}
          idConfiguration={merchant.idConfiguration || undefined}
          DDSalesAgent={DDSalesAgent}
          idSalesAgent={merchant.idSalesAgent || null}
          isSuperAdmin={isSuperAdmin}
        />
      </TabsContent>
      <TabsContent value="bank">
        <MerchantFormBankAccount
          merchantBankAccount={{
            id: merchantBankAccount?.merchantBankAccount?.id || 0,
            documentId:
              merchantBankAccount?.merchantBankAccount?.documentId || "",
            corporateName:
              merchantBankAccount?.merchantBankAccount?.corporateName || "",
            legalPerson:
              merchantBankAccount?.merchantBankAccount?.legalPerson ||
              "JURIDICAL",
            bankBranchNumber:
              merchantBankAccount?.merchantBankAccount?.bankBranchNumber ||
              "",
            bankBranchCheckDigit:
              merchantBankAccount?.merchantBankAccount
                ?.bankBranchCheckDigit || "",
            accountNumber:
              merchantBankAccount?.merchantBankAccount?.accountNumber || "",
            accountNumberCheckDigit:
              merchantBankAccount?.merchantBankAccount
                ?.accountNumberCheckDigit || "",
            accountType:
              merchantBankAccount?.merchantBankAccount?.accountType || "",
            compeCode:
              merchantBankAccount?.merchantBankAccount?.compeCode || "",
            dtinsert:
              merchantBankAccount?.merchantBankAccount?.dtinsert || "",
            dtupdate:
              merchantBankAccount?.merchantBankAccount?.dtupdate || "",
            active: merchantBankAccount?.merchantBankAccount?.active || null,
            slug: merchantBankAccount?.merchantBankAccount?.slug || null,
          }}
          DDBank={DDBank}
          idMerchant={merchant.id}
          setActiveTab={handleTabChange}
          activeTab={
            listTabs[listTabs.findIndex((tab) => tab === activeTab) + 1]
          }
          accountTypeDD={DDAccountType}
          permissions={permissions}
          merchantcorporateName={merchant.corporateName || ""}
          merchantdocumentId={merchant.idDocument || ""}
          hasPix={merchant.hasPix || false}
          merchantpixaccount={merchantPixAccount?.pixaccounts}
          isSuperAdmin={isSuperAdmin}
        />
      </TabsContent>

      <TabsContent value="authorizers">
        <MerchantFormAuthorizers
          activeTab={
            listTabs[listTabs.findIndex((tab) => tab === activeTab) + 1]
          }
          setActiveTab={handleTabChange}
          idMerchant={merchant.id}
          permissions={permissions}
          isSuperAdmin={isSuperAdmin}
        />
      </TabsContent>
      <TabsContent value="rate">
        <MerchantFormTax2
          merchantprice={[
            {
              id: merchantPriceGroupProps?.merchantPrice?.id || 0,
              name: merchantPriceGroupProps?.merchantPrice?.name || "",
              active: merchantPriceGroupProps?.merchantPrice?.active || false,
              dtinsert:
                merchantPriceGroupProps?.merchantPrice?.dtinsert || "",
              dtupdate:
                merchantPriceGroupProps?.merchantPrice?.dtupdate || "",
              tableType:
                merchantPriceGroupProps?.merchantPrice?.tableType || "",
              slugMerchant:
                merchantPriceGroupProps?.merchantPrice?.slugMerchant || "",
              compulsoryAnticipationConfig:
                merchantPriceGroupProps?.merchantPrice
                  ?.compulsoryAnticipationConfig || 0,
              anticipationType:
                merchantPriceGroupProps?.merchantPrice?.anticipationType ||
                "",
              eventualAnticipationFee:
                merchantPriceGroupProps?.merchantPrice
                  ?.eventualAnticipationFee || 0,
              cardPixMdr:
                merchantPriceGroupProps?.merchantPrice?.cardPixMdr || 0,
              cardPixCeilingFee:
                merchantPriceGroupProps?.merchantPrice?.cardPixCeilingFee ||
                0,
              cardPixMinimumCostFee:
                merchantPriceGroupProps?.merchantPrice
                  ?.cardPixMinimumCostFee || 0,
              nonCardPixMdr:
                merchantPriceGroupProps?.merchantPrice?.nonCardPixMdr || 0,
              nonCardPixCeilingFee:
                merchantPriceGroupProps?.merchantPrice
                  ?.nonCardPixCeilingFee || 0,
              nonCardPixMinimumCostFee:
                merchantPriceGroupProps?.merchantPrice
                  ?.nonCardPixMinimumCostFee || 0,
              merchantpricegroup:
                merchantPriceGroupProps?.merchantpricegroup || [],
            },
          ]}
          idMerchantPrice={merchant.idMerchantPrice || 0}
          permissions={permissions}
          merchantId={merchant.id}
          availableFees={merchantPriceGroupProps?.availableFees || []}
          activeTab={
            listTabs[listTabs.findIndex((tab) => tab === activeTab) + 1]
          }
          setActiveTab={handleTabChange}
          isSuperAdmin={isSuperAdmin}
        />
      </TabsContent>
      <TabsContent value="documents">
        <MerchantFormDocuments
          merchantId={merchant.id.toString()}
          permissions={permissions}
          isSuperAdmin={isSuperAdmin}
        />
      </TabsContent>
    </Tabs>
  );
}

