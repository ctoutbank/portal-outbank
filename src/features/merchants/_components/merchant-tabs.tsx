"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MerchantTabsProps } from "@/features/merchants/server/types";

import MerchantFormCompany from "./merchant-form-company";

import MerchantFormcontact from "./merchant-form-contact";

import MerchantFormOperations from "./merchant-form-operation";

import MerchantFormBankAccount from "./merchant-form-bank-account";

import MerchantFormAuthorizers from "./merchant-form-authorizers";

import MerchantFormTax2 from "./merchant-form-tax2";

import MerchantFormDocuments from "./merchant-form-documents";

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
}: MerchantTabsProps) {
  const [activeTab, setActiveTab] = useState("company");
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(
    new Set(["company"])
  );

  // Função para marcar uma tab como visitada e navegar para ela
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setVisitedTabs((prev) => new Set(prev).add(newTab));
  };

  const searchParams = useSearchParams();
  useEffect(() => {
    const tab = searchParams?.get("tab") || "company";
    setActiveTab(tab);

    // Quando vem da URL, marca todas as tabs até a solicitada como visitadas
    const tabIndex = listTabs.indexOf(tab);
    if (tabIndex > 0) {
      const tabsToVisit = listTabs.slice(0, tabIndex + 1);
      setVisitedTabs(new Set(tabsToVisit));
    } else {
      setVisitedTabs((prev) => new Set(prev).add(tab));
    }
  }, [searchParams]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="space-y-4 w-full"
    >
      <TabsList>
        <TabsTrigger
          value="company"
          className={visitedTabs.has("company") ? "" : "pointer-events-none opacity-50"}
        >
          Dados da Empresa
        </TabsTrigger>
        <TabsTrigger
          value="contact"
          className={visitedTabs.has("contact") ? "" : "pointer-events-none opacity-50"}
        >
          Dados do Responsável
        </TabsTrigger>
        <TabsTrigger
          value="operation"
          className={visitedTabs.has("operation") ? "" : "pointer-events-none opacity-50"}
        >
          Dados de Operação
        </TabsTrigger>
        {permissions?.includes("Configurar dados Bancários") && (
          <TabsTrigger
            value="bank"
            className={visitedTabs.has("bank") ? "" : "pointer-events-none opacity-50"}
          >
            Dados Bancários
          </TabsTrigger>
        )}
        <TabsTrigger
          value="authorizers"
          className={
            visitedTabs.has("authorizers") ? "" : "pointer-events-none opacity-50"
          }
        >
          Autorizados
        </TabsTrigger>
        {permissions?.includes("Configurar Taxas do EC") && (
          <TabsTrigger
            value="rate"
            className={visitedTabs.has("rate") ? "" : "pointer-events-none opacity-50"}
          >
            Taxas de Transação
          </TabsTrigger>
        )}
        {permissions?.includes("Inserir documentos EC") && (
          <TabsTrigger
            value="documents"
            className={
              visitedTabs.has("documents") ? "" : "pointer-events-none opacity-50"
            }
          >
            Documentos
          </TabsTrigger>
        )}
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
        />
      </TabsContent>
      {permissions?.includes("Configurar dados Bancários") && (
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
          />
        </TabsContent>
      )}

      <TabsContent value="authorizers">
        <MerchantFormAuthorizers
          activeTab={
            listTabs[listTabs.findIndex((tab) => tab === activeTab) + 1]
          }
          setActiveTab={handleTabChange}
          idMerchant={merchant.id}
          permissions={permissions}
        />
      </TabsContent>
      {permissions?.includes("Configurar Taxas do EC") && (
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
          />
        </TabsContent>
      )}
      {permissions?.includes("Inserir documentos EC") && (
        <TabsContent value="documents">
          <MerchantFormDocuments
            merchantId={merchant.id.toString()}
            permissions={permissions}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}

