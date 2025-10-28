"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type FeeData } from "@/features/newTax/server/fee-db";
import Image from "next/image";

import { getCardImage } from "./card-image-utils";

export interface FeeSelectionProps {
  availableFees: FeeData[];
  selectedFeeId: string;
  selectedFee: FeeData | null;
  isCreatingMerchantPrice: boolean;
  onFeeSelection: (feeId: string) => void;
  onCreateMerchantPrice: () => void;
  onCancel: () => void;
}

export default function FeeSelectionView({
  availableFees,
  selectedFeeId,
  selectedFee,
  isCreatingMerchantPrice,
  onFeeSelection,
  onCreateMerchantPrice,
  onCancel,
}: FeeSelectionProps) {
  // Renderizar dados da fee selecionada em formato de preview
  const renderFeePreview = (fee: FeeData) => {
    // Organizar dados da fee para exibição similar ao merchantprice
    const organizedFeeData =
      fee.feeBrand?.map((brand) => {
        const transactions = brand.feeBrandProductType || [];
        return {
          name: brand.brand,
          transactions: {
            credit: {
              vista: transactions.find(
                (tx) =>
                  (tx.producttype?.toLowerCase() === "credit" ||
                    tx.producttype === "Crédito à Vista") &&
                  tx.installmentTransactionFeeStart === 1 &&
                  tx.installmentTransactionFeeEnd === 1
              ),
              parcela2_6: transactions.find(
                (tx) =>
                  (tx.producttype?.toLowerCase() === "credit" ||
                    tx.producttype?.includes("Crédito Parcelado")) &&
                  tx.installmentTransactionFeeStart === 2 &&
                  tx.installmentTransactionFeeEnd === 6
              ),
              parcela7_12: transactions.find(
                (tx) =>
                  (tx.producttype?.toLowerCase() === "credit" ||
                    tx.producttype?.includes("Crédito Parcelado")) &&
                  tx.installmentTransactionFeeStart === 7 &&
                  tx.installmentTransactionFeeEnd === 12
              ),
            },
            debit: transactions.find(
              (tx) =>
                tx.producttype?.toLowerCase() === "debit" ||
                tx.producttype === "Débito"
            ),
            prepaid: transactions.find(
              (tx) =>
                tx.producttype?.toLowerCase() === "prepaid" ||
                tx.producttype === "Pré-Pago"
            ),
          },
        };
      }) || [];

    return (
      <div className="w-full">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Nome da Taxa</p>
            <p className="text-sm">{fee.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">
              Tipo de Antecipação
            </p>
            <p className="text-sm">
              {fee.anticipationType === "NOANTECIPATION"
                ? "Sem Antecipação"
                : fee.anticipationType === "EVENTUAL"
                  ? "Antecipação Eventual"
                  : "Antecipação Compulsória"}
            </p>
          </div>
        </div>

        <Tabs defaultValue="todas" className="w-full">
          <TabsList className="flex gap-4 mb-2">
            <TabsTrigger value="todas">
              <span className="flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Todas as Transações
              </span>
            </TabsTrigger>
            <TabsTrigger value="pos">
              <span className="flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                >
                  <rect
                    x="3"
                    y="6"
                    width="18"
                    height="12"
                    rx="2"
                    strokeWidth="2"
                  />
                  <path d="M8 12h8" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Transações no POS
              </span>
            </TabsTrigger>
            <TabsTrigger value="online">
              <span className="flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path
                    d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
                    strokeWidth="2"
                  />
                </svg>
                Transações Online
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todas">
            <div className="bg-gray-50 rounded-lg p-4 mb-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 bg-gray-100 p-2 rounded">
                Taxas Transações no POS
              </h3>

              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-4">Bandeira</th>
                    <th className="text-left py-2 px-4">Crédito à vista</th>
                    <th className="text-left py-2 px-4">Crédito 2-6x</th>
                    <th className="text-left py-2 px-4">Crédito 7-12x</th>
                    <th className="text-left py-2 px-4">Débito</th>
                    <th className="text-left py-2 px-4">Pré-pago</th>
                  </tr>
                </thead>
                <tbody>
                  {organizedFeeData.map((group, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          {getCardImage(group.name) && (
                            <Image
                              src={getCardImage(group.name)}
                              alt={group.name}
                              width={40}
                              height={24}
                              className="object-contain"
                            />
                          )}
                          <span>{group.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.credit.vista?.cardTransactionMdr
                            ? `${group.transactions.credit.vista.cardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.credit.parcela2_6
                            ?.cardTransactionMdr
                            ? `${group.transactions.credit.parcela2_6.cardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.credit.parcela7_12
                            ?.cardTransactionMdr
                            ? `${group.transactions.credit.parcela7_12.cardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.debit?.cardTransactionMdr
                            ? `${group.transactions.debit.cardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.prepaid?.cardTransactionMdr
                            ? `${group.transactions.prepaid.cardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-8 bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-6 text-gray-800">
                  Taxa Pix
                </h2>
                <div className="flex gap-10">
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-600 mb-2">MDR</p>
                    <div className="px-3 py-1 text-sm w-24">
                      {fee.cardPixMdr}%
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-600 mb-2">Custo Mínimo</p>
                    <div className="px-3 py-1 text-sm w-24">
                      R$ {fee.cardPixMinimumCostFee}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-600 mb-2">Custo Máximo</p>
                    <div className="px-3 py-1 text-sm w-24">
                      R$ {fee.cardPixCeilingFee}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-600 mb-2">Antecipação</p>
                    <div className="px-3 py-1 text-sm min-w-fit whitespace-nowrap">
                      {fee.eventualAnticipationFee}% ao mês
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-700 mb-3 bg-gray-100 p-2 rounded">
              Taxas Transações Online
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-4">Bandeira</th>
                    <th className="text-left py-2 px-4">Crédito à vista</th>
                    <th className="text-left py-2 px-4">Crédito 2-6x</th>
                    <th className="text-left py-2 px-4">Crédito 7-12x</th>
                    <th className="text-left py-2 px-4">Débito</th>
                    <th className="text-left py-2 px-4">Pré-pago</th>
                  </tr>
                </thead>
                <tbody>
                  {organizedFeeData.map((group, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          {getCardImage(group.name) && (
                            <Image
                              src={getCardImage(group.name)}
                              alt={group.name}
                              width={40}
                              height={24}
                              className="object-contain"
                            />
                          )}
                          <span>{group.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.credit.vista
                            ?.nonCardTransactionMdr
                            ? `${group.transactions.credit.vista.nonCardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.credit.parcela2_6
                            ?.nonCardTransactionMdr
                            ? `${group.transactions.credit.parcela2_6.nonCardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.credit.parcela7_12
                            ?.nonCardTransactionMdr
                            ? `${group.transactions.credit.parcela7_12.nonCardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.debit?.nonCardTransactionMdr
                            ? `${group.transactions.debit.nonCardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.prepaid?.nonCardTransactionMdr
                            ? `${group.transactions.prepaid.nonCardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-8 bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-6 text-gray-800">
                  Taxa Pix
                </h2>
                <div className="flex gap-10">
                  <div className="flex flex-col items-left">
                    <p className="text-sm text-gray-600 mb-2">MDR</p>
                    <div className="px-3 py-1 text-sm w-24">
                      {fee.nonCardPixMdr}%
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-600 mb-2">Custo Mínimo</p>
                    <div className="px-3 py-1 text-sm w-24">
                      R$ {fee.nonCardPixMinimumCostFee}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-600 mb-2">Custo Máximo</p>
                    <div className="px-3 py-1 text-sm w-24">
                      R$ {fee.nonCardPixCeilingFee}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-600 mb-2">Antecipação</p>
                    <div className="px-3 py-1 text-sm min-w-fit whitespace-nowrap">
                      {fee.eventualAnticipationFee}% ao mês
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pos">
            <div className="bg-gray-50 rounded-lg p-4 mb-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 bg-gray-100 p-2 rounded">
                Taxas Transações no POS
              </h3>
              <table className="w-full ">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-4">Bandeira</th>
                    <th className="text-left py-2 px-4">Crédito à vista</th>
                    <th className="text-left py-2 px-4">Crédito 2-6x</th>
                    <th className="text-left py-2 px-4">Crédito 7-12x</th>
                    <th className="text-left py-2 px-4">Débito</th>
                    <th className="text-left py-2 px-4">Pré-pago</th>
                  </tr>
                </thead>
                <tbody>
                  {organizedFeeData.map((group, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          {getCardImage(group.name) && (
                            <Image
                              src={getCardImage(group.name)}
                              alt={group.name}
                              width={40}
                              height={24}
                              className="object-contain"
                            />
                          )}
                          <span>{group.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.credit.vista?.cardTransactionMdr
                            ? `${group.transactions.credit.vista.cardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.credit.parcela2_6
                            ?.cardTransactionMdr
                            ? `${group.transactions.credit.parcela2_6.cardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.credit.parcela7_12
                            ?.cardTransactionMdr
                            ? `${group.transactions.credit.parcela7_12.cardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.debit?.cardTransactionMdr
                            ? `${group.transactions.debit.cardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.prepaid?.cardTransactionMdr
                            ? `${group.transactions.prepaid.cardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-8 bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-6 text-gray-800">
                  Taxa Pix
                </h2>
                <div className="flex gap-10">
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-600 mb-2">MDR</p>
                    <div className="px-3 py-1 text-sm w-24">
                      {fee.cardPixMdr}%
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-600 mb-2">Custo Mínimo</p>
                    <div className="px-3 py-1 text-sm w-24">
                      R$ {fee.cardPixMinimumCostFee}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-600 mb-2">Custo Máximo</p>
                    <div className="px-3 py-1 text-sm w-24">
                      R$ {fee.cardPixCeilingFee}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-600 mb-2">Antecipação</p>
                    <div className="px-3 py-1 text-sm min-w-fit whitespace-nowrap">
                      {fee.eventualAnticipationFee}% ao mês
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="online">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 bg-gray-100 p-2 rounded">
                Taxas Transações Online
              </h3>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-4">Bandeira</th>
                    <th className="text-left py-2 px-4">Crédito à vista</th>
                    <th className="text-left py-2 px-4">Crédito 2-6x</th>
                    <th className="text-left py-2 px-4">Crédito 7-12x</th>
                    <th className="text-left py-2 px-4">Débito</th>
                    <th className="text-left py-2 px-4">Pré-pago</th>
                  </tr>
                </thead>
                <tbody>
                  {organizedFeeData.map((group, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          {getCardImage(group.name) && (
                            <Image
                              src={getCardImage(group.name)}
                              alt={group.name}
                              width={40}
                              height={24}
                              className="object-contain"
                            />
                          )}
                          <span>{group.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.credit.vista
                            ?.nonCardTransactionMdr
                            ? `${group.transactions.credit.vista.nonCardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.credit.parcela2_6
                            ?.nonCardTransactionMdr
                            ? `${group.transactions.credit.parcela2_6.nonCardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.credit.parcela7_12
                            ?.nonCardTransactionMdr
                            ? `${group.transactions.credit.parcela7_12.nonCardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.debit?.nonCardTransactionMdr
                            ? `${group.transactions.debit.nonCardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <div className="px-3 py-1 text-sm w-24">
                          {group.transactions.prepaid?.nonCardTransactionMdr
                            ? `${group.transactions.prepaid.nonCardTransactionMdr}%`
                            : "-"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-8 bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-6 text-gray-800">
                  Taxa Pix
                </h2>
                <div className="flex gap-10">
                  <div className="flex flex-col items-left">
                    <p className="text-sm text-gray-600 mb-2">MDR</p>
                    <div className="px-3 py-1 text-sm w-24">
                      {fee.nonCardPixMdr}%
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-600 mb-2">Custo Mínimo</p>
                    <div className="px-3 py-1 text-sm w-24">
                      R$ {fee.nonCardPixMinimumCostFee}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-600 mb-2">Custo Máximo</p>
                    <div className="px-3 py-1 text-sm w-24">
                      R$ {fee.nonCardPixCeilingFee}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-600 mb-2">Antecipação</p>
                    <div className="px-3 py-1 text-sm min-w-fit whitespace-nowrap">
                      {fee.eventualAnticipationFee}% ao mês
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="w-full mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-6 w-6 bg-black rounded flex items-center justify-center text-white text-sm">
          $
        </div>
        <h1 className="text-xl font-semibold">Atribuir Taxa de Transação</h1>
      </div>

      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle>Selecionar Taxa</CardTitle>
          <p className="text-sm text-gray-600">
            Este estabelecimento ainda não possui uma taxa atribuída. Selecione
            uma taxa existente para configurar as taxas de transação.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium">Taxa Disponível</label>
            <Select value={selectedFeeId} onValueChange={onFeeSelection}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma taxa..." />
              </SelectTrigger>
              <SelectContent>
                {availableFees.map((fee) => (
                  <SelectItem key={fee.id} value={fee.id}>
                    {fee.name} - {fee.code} (
                    {fee.anticipationType === "NOANTECIPATION"
                      ? "Sem Antecipação"
                      : fee.anticipationType === "EVENTUAL"
                        ? "Eventual"
                        : "Compulsória"}
                    )
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFee && (
            <div className=" space-y-4">
              <h3 className="text-lg font-medium">
                Preview da Taxa Selecionada
              </h3>
              {renderFeePreview(selectedFee)}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
                <Button
                  onClick={onCreateMerchantPrice}
                  disabled={isCreatingMerchantPrice}
                >
                  {isCreatingMerchantPrice ? "Atribuindo..." : "Atribuir Taxa"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
