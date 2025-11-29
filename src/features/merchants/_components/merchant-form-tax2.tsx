"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  updateMerchantPriceFormAction,
  updateMultipleTransactionPricesFormAction,
} from "../_actions/merchant-price-formActions";
import {
  updateMerchantPriceGroupFormAction,
} from "../_actions/merchantpricegroup-formActions";
import { TransactionPrice } from "../server/types";
// import { FeeData } from "@/features/newTax/server/fee-db";
type FeeData = any; // TODO: Definir tipo correto quando disponível

interface MerchantProps {
  merchantprice: any[];
  idMerchantPrice: number;
  permissions: string[];
  merchantId: number;
  availableFees: FeeData[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function MerchantFormTax2({
  merchantprice,
  idMerchantPrice,
  permissions,
  merchantId,
  availableFees,
  activeTab,
  setActiveTab,
}: MerchantProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const params = new URLSearchParams(searchParams || "");

  const refreshPage = (id: number) => {
    params.set("tab", activeTab);
    setActiveTab(activeTab);
    router.push(`/merchants/${id}?${params.toString()}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!idMerchantPrice || idMerchantPrice === 0) {
        toast.error("Nenhuma taxa configurada para salvar");
        return;
      }

      // Atualizar merchant price principal se houver dados
      if (merchantprice && merchantprice.length > 0) {
        const mainPrice = merchantprice[0];
        if (mainPrice.id) {
          await updateMerchantPriceFormAction({
            id: mainPrice.id,
            slug: mainPrice.slug || "",
            active: mainPrice.active ?? true,
            name: mainPrice.name || "",
            tableType: mainPrice.tableType || "",
            slugMerchant: mainPrice.slugMerchant || "",
            compulsoryAnticipationConfig:
              mainPrice.compulsoryAnticipationConfig || 0,
            anticipationType: mainPrice.anticipationType || "",
            eventualAnticipationFee: mainPrice.eventualAnticipationFee || 0,
            cardPixMdr: mainPrice.cardPixMdr || 0,
            cardPixCeilingFee: mainPrice.cardPixCeilingFee || 0,
            cardPixMinimumCostFee: mainPrice.cardPixMinimumCostFee || 0,
            nonCardPixMdr: mainPrice.nonCardPixMdr || 0,
            nonCardPixCeilingFee: mainPrice.nonCardPixCeilingFee || 0,
            nonCardPixMinimumCostFee: mainPrice.nonCardPixMinimumCostFee || 0,
            dtinsert: mainPrice.dtinsert
              ? new Date(mainPrice.dtinsert)
              : undefined,
            dtupdate: mainPrice.dtupdate
              ? new Date(mainPrice.dtupdate)
              : undefined,
          });
        }
      }

      // Atualizar price groups e transaction prices
      if (merchantprice && merchantprice.length > 0) {
        const mainPrice = merchantprice[0];
        if (mainPrice.merchantpricegroup) {
          for (const group of mainPrice.merchantpricegroup) {
            if (group.id) {
              await updateMerchantPriceGroupFormAction({
                id: group.id,
                slug: group.slug || "",
                active: group.active ?? true,
                brand: group.name || "",
                idGroup: 0,
                idMerchantPrice: idMerchantPrice,
                dtinsert: group.dtinsert
                  ? new Date(group.dtinsert)
                  : undefined,
                dtupdate: group.dtupdate ? new Date(group.dtupdate) : undefined,
              });

              // Atualizar transaction prices do grupo
              if (group.listMerchantTransactionPrice) {
                const transactionUpdates = group.listMerchantTransactionPrice
                  .filter((tp: TransactionPrice) => tp.id)
                  .map((tp: TransactionPrice) => ({
                    id: tp.id!,
                    data: {
                      id: tp.id,
                      slug: tp.slug || "",
                      active: tp.active ?? true,
                      idMerchantPriceGroup: group.id,
                      installmentTransactionFeeStart:
                        tp.installmentTransactionFeeStart || 1,
                      installmentTransactionFeeEnd:
                        tp.installmentTransactionFeeEnd || 1,
                      cardTransactionFee: tp.cardTransactionFee || 0,
                      cardTransactionMdr: tp.cardTransactionMdr || 0,
                      nonCardTransactionFee: tp.nonCardTransactionFee || 0,
                      nonCardTransactionMdr: tp.nonCardTransactionMdr || 0,
                      producttype: tp.producttype || "",
                      cardCompulsoryAnticipationMdr:
                        tp.cardCompulsoryAnticipationMdr || 0,
                      noCardCompulsoryAnticipationMdr:
                        tp.noCardCompulsoryAnticipationMdr || 0,
                      dtinsert: tp.dtinsert ? new Date(tp.dtinsert) : undefined,
                      dtupdate: tp.dtupdate ? new Date(tp.dtupdate) : undefined,
                    },
                  }));

                if (transactionUpdates.length > 0) {
                  await updateMultipleTransactionPricesFormAction(
                    transactionUpdates
                  );
                }
              }
            }
          }
        }
      }

      toast.success("Taxas salvas com sucesso!");
      refreshPage(merchantId);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar as taxas");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!idMerchantPrice || idMerchantPrice === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <CardTitle>Taxas de Transação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-700">
                  Nenhuma taxa atribuída
                </p>
                <p className="text-sm text-gray-500">
                  Este estabelecimento ainda não possui taxas configuradas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <CardTitle>Taxas de Transação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Configuração de taxas será implementada</p>
            <p className="text-sm mt-2">
              Merchant Price ID: {idMerchantPrice}
            </p>
          </div>
        </CardContent>
      </Card>

      {permissions?.includes("Atualizar") && (
        <div className="flex justify-end mt-4">
          <Button type="submit" disabled={isSubmitting} className="px-6">
            {isSubmitting ? "Salvando..." : "Avançar"}
          </Button>
        </div>
      )}
    </form>
  );
}

