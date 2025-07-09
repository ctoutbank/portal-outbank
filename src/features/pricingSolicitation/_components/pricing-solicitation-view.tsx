"use client";

import { sendPricingSolicitationEmail } from "@/app/utils/send-email-adtivo";
import FileUpload from "@/components/fileUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import ListDocumentDownload from "@/features/pricingSolicitation/_components/list-document-download";
import {
  approveAction,
  completeAction,
  rejectAction,
  updateToSendDocumentsAction,
} from "@/features/pricingSolicitation/actions/pricing-solicitation-actions";
import { type PricingSolicitationForm } from "@/features/pricingSolicitation/server/pricing-solicitation";
import { SolicitationFeeProductTypeList } from "@/lib/lookuptables/lookuptables";
import { brandList } from "@/lib/lookuptables/lookuptables-transactions";
import { FileIcon, UploadIcon, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";

interface PricingSolicitationViewProps {
  pricingSolicitation: PricingSolicitationForm;
  userEmail: string;
}

interface ProductType {
  name?: string;
  fee?: string | number;
  feeAdmin?: string | number;
  feeDock?: string | number;
  transactionFeeStart?: string | number;
  transactionFeeEnd?: string | number;
  noCardFee?: string | number;
  noCardFeeAdmin?: string | number;
  noCardFeeDock?: string | number;
  noCardTransactionAnticipationMdr?: string | number;
  transactionAnticipationMdr?: string | number;
}

interface Brand {
  name: string;
  productTypes?: ProductType[];
}

const getCardImage = (cardName: string): string => {
  const cardMap: { [key: string]: string } = {
    MASTERCARD: "/mastercard.svg",
    VISA: "/visa.svg",
    ELO: "/elo.svg",
    AMERICAN_EXPRESS: "/american-express.svg",
    HIPERCARD: "/hipercard.svg",
    AMEX: "/american-express.svg",
    CABAL: "/cabal.svg",
  };
  return cardMap[cardName] || "";
};

// Função para normalizar uma string
function normalizeString(str: string | undefined | null): string {
  return (str ?? "").toUpperCase().trim().replace(/\s+/g, "");
}

// Função para normalizar um tipo de produto
function normalizeProductType(pt: ProductType): ProductType {
  return {
    ...pt,
    name: normalizeString(pt.name),
    fee: pt.fee ?? "-",
    feeAdmin: pt.feeAdmin ?? "-",
    noCardFee: pt.noCardFee ?? "-",
    noCardFeeAdmin: pt.noCardFeeAdmin ?? "-",
  };
}

export function PricingSolicitationView({
  pricingSolicitation,
  userEmail,
}: PricingSolicitationViewProps) {
  const handleUploadComplete = (fileData: {
    fileId: number;
    fileURL: string;
    fileName: string;
    fileExtension: string;
  }) => {
    console.log("Arquivo enviado com sucesso:", fileData);
    setRefreshDocsKey((k) => k + 1);
  };
  const form = useForm();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [refreshDocsKey, setRefreshDocsKey] = useState(0);
  const [uploadSuccessful] = useState(false);

  if (!pricingSolicitation) {
    return <div>Nenhuma solicitação encontrada</div>;
  }

  console.log("PricingSolicitation completo:", pricingSolicitation);
  console.log("Campos PIX Admin:", {
    cardPixMdrAdmin: pricingSolicitation.cardPixMdrAdmin,
    cardPixCeilingFeeAdmin: pricingSolicitation.cardPixCeilingFeeAdmin,
    cardPixMinimumCostFeeAdmin: pricingSolicitation.cardPixMinimumCostFeeAdmin,
    eventualAnticipationFeeAdmin:
      pricingSolicitation.eventualAnticipationFeeAdmin,
    nonCardPixMdrAdmin: pricingSolicitation.nonCardPixMdrAdmin,
    nonCardPixCeilingFeeAdmin: pricingSolicitation.nonCardPixCeilingFeeAdmin,
    nonCardPixMinimumCostFeeAdmin:
      pricingSolicitation.nonCardPixMinimumCostFeeAdmin,
    nonCardEventualAnticipationFeeAdmin:
      pricingSolicitation.nonCardEventualAnticipationFeeAdmin,
  });

  // Mapear marcas da solicitação para o formato de exibição
  const brandsMap = new Map<string, Brand>();
  pricingSolicitation.brands?.forEach((brand) => {
    const normalizedBrandName = normalizeString(brand.name);
    console.log("Processing brand from DB:", {
      originalName: brand.name,
      normalizedName: normalizedBrandName,
      productTypes: brand.productTypes?.map((pt) => ({
        original: {
          name: pt.name,
          fee: pt.fee,
          feeAdmin: pt.feeAdmin,
          noCardFee: pt.noCardFee,
          noCardFeeAdmin: pt.noCardFeeAdmin,
        },
        normalized: normalizeProductType(pt),
      })),
    });

    brandsMap.set(normalizedBrandName, {
      ...brand,
      name: normalizedBrandName,
      productTypes: brand.productTypes?.map(normalizeProductType),
    });
  });

  const handleCloseUploadDialog = () => {
    setOpenUploadDialog(false);

    // Se uma solicitação foi criada durante o upload e temos um ID
    if (uploadSuccessful && pricingSolicitation.id) {
      // Navegar para a página correta com o ID da solicitação
      router.push(`/portal/pricingSolicitation/${pricingSolicitation.id}`);
    }
  };
  // feesData agora garante todas as bandeiras e tipos, mesmo que não existam no banco
  const feesData = brandList.map((brand) => {
    const normalizedBrandName = normalizeString(brand.value);
    const foundBrand = brandsMap.get(normalizedBrandName);

    console.log(`Processing brand ${brand.value}:`, {
      originalName: brand.value,
      normalizedName: normalizedBrandName,
      foundBrand: foundBrand
        ? {
            name: foundBrand.name,
            productTypes: foundBrand.productTypes?.map((pt) => ({
              name: pt.name,
              fee: pt.fee,
              feeAdmin: pt.feeAdmin,
              noCardFee: pt.noCardFee,
              noCardFeeAdmin: pt.noCardFeeAdmin,
            })),
          }
        : null,
    });

    // Agrupa os tipos POS
    const posTypes = SolicitationFeeProductTypeList.map((type) => {
      const normalizedTypeName = normalizeString(type.value);
      const foundType = foundBrand?.productTypes?.find(
        (pt) => normalizeString(pt.name) === normalizedTypeName
      );

      console.log(`Looking for POS type ${type.value}:`, {
        typeValue: type.value,
        normalizedTypeName,
        foundType: foundType
          ? {
              name: foundType.name,
              fee: foundType.fee,
              feeAdmin: foundType.feeAdmin,
            }
          : null,
        allProductTypes: foundBrand?.productTypes?.map((pt) => ({
          name: pt.name,
          normalizedName: normalizeString(pt.name),
        })),
      });

      return {
        value: type.value,
        label: type.label,
        fee: foundType?.fee ?? "-",
        feeAdmin: foundType?.feeAdmin ?? "-",
      };
    });

    // Agrupa os tipos Online
    const onlineTypes = SolicitationFeeProductTypeList.map((type) => {
      const normalizedTypeName = normalizeString(type.value);
      const foundType = foundBrand?.productTypes?.find(
        (pt) => normalizeString(pt.name) === normalizedTypeName
      );

      console.log(`Looking for Online type ${type.value}:`, {
        typeValue: type.value,
        normalizedTypeName,
        foundType: foundType
          ? {
              name: foundType.name,
              noCardFee: foundType.noCardFee,
              noCardFeeAdmin: foundType.noCardFeeAdmin,
            }
          : null,
        allProductTypes: foundBrand?.productTypes?.map((pt) => ({
          name: pt.name,
          normalizedName: normalizeString(pt.name),
        })),
      });

      return {
        value: type.value,
        label: type.label,
        noCardFee: foundType?.noCardFee ?? "-",
        noCardFeeAdmin: foundType?.noCardFeeAdmin ?? "-",
      };
    });

    return {
      brand: {
        value: brand.value,
        label: brand.label,
      },
      posTypes,
      onlineTypes,
    };
  });

  console.log("Final Fees Data:", JSON.stringify(feesData, null, 2));

  // Você pode sim criar uma constante que normaliza toda a estrutura, facilitando o acesso aos campos independentemente do formato do nome.
  // Exemplo de normalização dos campos em uma única constante:
  const normalized = {
    ...pricingSolicitation,
    cnpjQuantity:
      (pricingSolicitation as any).cnpj_quantity ??
      pricingSolicitation.cnpjQuantity,
    averageTicket:
      (pricingSolicitation as any).average_ticket ??
      pricingSolicitation.averageTicket,
    monthlyPosFee:
      (pricingSolicitation as any).monthly_pos_fee ??
      pricingSolicitation.monthlyPosFee,
    cnaeInUse:
      (pricingSolicitation as any).cnae_in_use ?? pricingSolicitation.cnaeInUse,

    // PIX com cartão
    cardPixMdr:
      (pricingSolicitation as any).card_pix_mdr ??
      pricingSolicitation.cardPixMdr,
    cardPixCeilingFee:
      (pricingSolicitation as any).card_pix_ceiling_fee ??
      pricingSolicitation.cardPixCeilingFee,
    cardPixMinimumCostFee:
      (pricingSolicitation as any).card_pix_minimum_cost_fee ??
      pricingSolicitation.cardPixMinimumCostFee,
    eventualAnticipationFee:
      (pricingSolicitation as any).eventualAnticipationFee ??
      (pricingSolicitation as any).eventual_anticipation_fee,

    // Novos campos Admin para PIX com cartão
    cardPixMdrAdmin:
      (pricingSolicitation as any).card_pix_mdr_admin ??
      pricingSolicitation.cardPixMdrAdmin,
    cardPixCeilingFeeAdmin:
      (pricingSolicitation as any).card_pix_ceiling_fee_admin ??
      pricingSolicitation.cardPixCeilingFeeAdmin,
    cardPixMinimumCostFeeAdmin:
      (pricingSolicitation as any).card_pix_minimum_cost_fee_admin ??
      pricingSolicitation.cardPixMinimumCostFeeAdmin,
    eventualAnticipationFeeAdmin:
      (pricingSolicitation as any).eventual_anticipation_fee_admin ??
      pricingSolicitation.eventualAnticipationFeeAdmin,

    // PIX sem cartão
    nonCardPixMdr:
      (pricingSolicitation as any).non_card_pix_mdr ??
      pricingSolicitation.nonCardPixMdr,
    nonCardPixCeilingFee:
      (pricingSolicitation as any).non_card_pix_ceiling_fee ??
      pricingSolicitation.nonCardPixCeilingFee,
    nonCardPixMinimumCostFee:
      (pricingSolicitation as any).non_card_pix_minimum_cost_fee ??
      pricingSolicitation.nonCardPixMinimumCostFee,
    nonCardEventualAnticipationFee:
      (pricingSolicitation as any).nonCardEventualAnticipationFee ??
      (pricingSolicitation as any).non_card_eventual_anticipation_fee,

    // Novos campos Admin para PIX sem cartão
    nonCardPixMdrAdmin:
      (pricingSolicitation as any).non_card_pix_mdr_admin ??
      pricingSolicitation.nonCardPixMdrAdmin,
    nonCardPixCeilingFeeAdmin:
      (pricingSolicitation as any).non_card_pix_ceiling_fee_admin ??
      pricingSolicitation.nonCardPixCeilingFeeAdmin,
    nonCardPixMinimumCostFeeAdmin:
      (pricingSolicitation as any).non_card_pix_minimum_cost_fee_admin ??
      pricingSolicitation.nonCardPixMinimumCostFeeAdmin,
    nonCardEventualAnticipationFeeAdmin:
      (pricingSolicitation as any).non_card_eventual_anticipation_fee_admin ??
      pricingSolicitation.nonCardEventualAnticipationFeeAdmin,
  };

  console.log(normalized);

  // Agora você pode acessar os campos normalizados:
  const {
    cnpjQuantity,
    averageTicket,
    monthlyPosFee,
    cnaeInUse,
    cardPixMdr,
    cardPixCeilingFee,
    cardPixMinimumCostFee,
    eventualAnticipationFee,
    cardPixMdrAdmin,
    cardPixCeilingFeeAdmin,
    cardPixMinimumCostFeeAdmin,
    eventualAnticipationFeeAdmin,
    nonCardPixMdr,
    nonCardPixCeilingFee,
    nonCardPixMinimumCostFee,
    nonCardEventualAnticipationFee,
    nonCardPixMdrAdmin,
    nonCardPixCeilingFeeAdmin,
    nonCardPixMinimumCostFeeAdmin,
    nonCardEventualAnticipationFeeAdmin,
  } = normalized;

  console.log(
    pricingSolicitation.brands?.map((b) => ({
      name: b.name,
      productTypes: b.productTypes?.map((pt) => ({
        name: pt.name,
        noCardFee: pt.noCardFee,
        noCardFeeAdmin: pt.noCardFeeAdmin,
      })),
    }))
  );

  // Handlers

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadedFile || !pricingSolicitation.id) return;

    setIsSubmitting(true);
    try {
      const result = await updateToSendDocumentsAction(pricingSolicitation.id);
      await completeAction(pricingSolicitation.id);

      if (result.success) {
        setShowUploadDialog(false);
        alert("Aditivo enviado com sucesso! ");
        router.refresh();
      } else {
        alert("Erro ao atualizar status: " + result.error);
      }
    } catch (error) {
      console.error("Erro ao enviar aditivo:", error);
      alert("Erro ao processar o envio do aditivo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!pricingSolicitation.id) return;

    setIsSubmitting(true);
    try {
      await sendPricingSolicitationEmail(userEmail);
      const result = await approveAction(pricingSolicitation.id);
      if (result.success) {
        alert("Solicitação aprovada com sucesso!");
        router.refresh();
      } else {
        alert("Erro ao aprovar: " + result.error);
      }
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      alert("Erro ao processar a aprovação");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRejectDialog = () => {
    setShowRejectDialog(true);
  };

  const handleReject = async () => {
    if (!pricingSolicitation.id) return;

    setIsSubmitting(true);
    try {
      const result = await rejectAction(pricingSolicitation.id, rejectReason);
      if (result.success) {
        setShowRejectDialog(false);
        alert("Solicitação rejeitada com sucesso!");
        router.refresh();
      } else {
        alert("Erro ao rejeitar: " + result.error);
      }
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
      alert("Erro ao processar a rejeição");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen box-border relative overflow-x-hidden">
      <Form {...form}>
        <div className="space-y-8 w-full max-w-full box-border overflow-x-hidden">
          {/* Card: Dados da Solicitação */}
          <Card className="shadow-sm w-full max-w-full overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Solicitação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <div className="space-y-2">
                    <FormLabel>CNAE</FormLabel>
                    <div className="p-2 border rounded-md bg-gray-50">
                      {pricingSolicitation.cnae || "-"}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="space-y-2">
                    <FormLabel>MCC</FormLabel>
                    <div className="p-2 border rounded-md bg-gray-50">
                      {pricingSolicitation.mcc || "-"}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="space-y-2">
                    <FormLabel>Quantidade de CNPJs</FormLabel>
                    <div className="p-2 border rounded-md bg-gray-50">
                      {cnpjQuantity || "-"}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="space-y-2">
                    <FormLabel>Ticket Médio</FormLabel>
                    <div className="p-2 border rounded-md bg-gray-50">
                      {averageTicket ? `R$ ${averageTicket}` : "-"}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="space-y-2">
                    <FormLabel>TPV Mensal</FormLabel>
                    <div className="p-2 border rounded-md bg-gray-50">
                      {monthlyPosFee ? `R$ ${monthlyPosFee}` : "-"}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                    {cnaeInUse && (
                      <div className="h-4 w-4 rounded border flex items-center justify-center">
                        <span className="h-2 w-2 bg-black rounded-sm" />
                      </div>
                    )}
                    {/*<div className="space-y-1 leading-none">
                    <FormLabel>CNAE em uso?</FormLabel>
                  </div>*/}
                  </div>
                </div>
              </div>
              {cnaeInUse && pricingSolicitation.description && (
                <div className="mb-6">
                  <div className="space-y-2">
                    <FormLabel>Descrição</FormLabel>
                    <div className="p-2 border rounded-md bg-gray-50 min-h-[100px]">
                      {pricingSolicitation.description}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Taxas Transações POS */}
          <Card className="shadow-sm w-full max-w-full overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Taxas Transações POS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-full overflow-x-hidden">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-amber-100" />
                <span className="text-sm text-gray-600">
                  Oferecido pelo Outbank
                </span>
              </div>
              <div className="flex flex-col gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-100" />
                  <span className="text-sm text-gray-600">Solicitado</span>
                </div>
              </div>
              <div className="overflow-y-hidden overflow-x-auto">
                <Table className="text-xs min-w-[1000px] w-full ">
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        key="brand"
                        className="sticky left-0 z-20 bg-white w-20"
                        style={{ width: "20%", minWidth: "100 px" }}
                      >
                        Bandeiras
                      </TableHead>
                      {SolicitationFeeProductTypeList.map((type, index) => (
                        <>
                          <TableHead
                            key={`${type.value}-feeAdmin-${index}`}
                            className="text-center"
                            style={{ width: "9%", minWidth: "50px" }}
                          >
                            {type.label}
                          </TableHead>
                          <TableHead
                            key={`${type.value}-diff-${index}`}
                            className="text-center text-xs"
                            style={{ width: "7%", minWidth: "50px" }}
                          ></TableHead>
                          <TableHead
                            key={`${type.value}-fee-${index}`}
                            className="text-center"
                            style={{ width: "9%", minWidth: "50px" }}
                          >
                            {type.label}
                          </TableHead>
                        </>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feesData.map((item) => (
                      <TableRow key={item.brand.value}>
                        <TableCell
                          className="font-medium sticky left-0 z-20 bg-white"
                          style={{ minWidth: "120px" }}
                        >
                          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                            {getCardImage(item.brand.value) && (
                              <img
                                src={getCardImage(item.brand.value)}
                                alt={item.brand.label}
                                width={40}
                                height={24}
                                className="object-contain w-8 h-5 sm:w-10 sm:h-6 flex-shrink-0"
                              />
                            )}
                            <span className="truncate">{item.brand.label}</span>
                          </div>
                        </TableCell>
                        {item.posTypes.map((productType, typeIndex) => {
                          const feeAdmin =
                            typeof productType.feeAdmin === "number"
                              ? productType.feeAdmin
                              : typeof productType.feeAdmin === "string"
                                ? parseFloat(productType.feeAdmin)
                                : 0;
                          const fee =
                            typeof productType.fee === "number"
                              ? productType.fee
                              : typeof productType.fee === "string"
                                ? parseFloat(productType.fee)
                                : 0;
                          const difference =
                            feeAdmin && fee ? (feeAdmin - fee).toFixed(2) : "-";

                          return (
                            <>
                              <TableCell
                                key={`${item.brand.value}-${productType.value}-feeAdmin-${typeIndex}`}
                                className="p-1 text-center"
                              >
                                <div className="flex items-center justify-center">
                                  <div className="rounded-full py-1 px-2 inline-block min-w-[50px] max-w-[70px] text-center bg-amber-100 text-xs sm:text-sm">
                                    {productType.feeAdmin
                                      ? `${productType.feeAdmin}%`
                                      : "-"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell
                                key={`${item.brand.value}-${productType.value}-diff-${typeIndex}`}
                                className="p-1 text-center"
                              >
                                <div className="text-[10px] text-gray-600 font-medium">
                                  {difference !== "-" ? `${difference}%` : "-"}
                                </div>
                              </TableCell>
                              <TableCell
                                key={`${item.brand.value}-${productType.value}-fee-${typeIndex}`}
                                className="p-1 text-center"
                              >
                                <div className="rounded-full py-1 px-2 inline-block min-w-[50px] max-w-[70px] text-center bg-blue-100 text-xs sm:text-sm">
                                  {productType.fee
                                    ? `${productType.fee}%`
                                    : "-"}
                                </div>
                              </TableCell>
                            </>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="w-full overflow-hidden">
                <h3 className="text-lg font-medium mb-2">PIX </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-1 w-full max-w-full">
                  <div>
                    <h4 className="font-medium mb-1 text-sm">MDR</h4>
                    <div className="flex flex-wrap gap-1">
                      <div className="flex items-center gap-1">
                        <div className="rounded-full h-7 min-w-14 max-w-18 flex justify-center items-center text-xs bg-amber-100 px-1">
                          {cardPixMdrAdmin ? `${cardPixMdrAdmin}%` : "-"}
                        </div>
                        {cardPixMdrAdmin && cardPixMdr && (
                          <div className="text-[9px] text-gray-500">
                            {(
                              parseFloat(cardPixMdrAdmin) -
                              parseFloat(cardPixMdr)
                            ).toFixed(2)}
                            %
                          </div>
                        )}
                      </div>
                      <div className="rounded-full h-7 min-w-14 max-w-18 flex justify-center items-center text-xs bg-blue-100 px-1">
                        {`${cardPixMdr}%` || "-"}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1 text-sm">Custo Mínimo</h4>
                    <div className="flex flex-wrap gap-1">
                      <div className="flex items-center gap-1">
                        <div className="rounded-full h-7 min-w-14 max-w-18 flex justify-center items-center text-xs bg-amber-100 px-1">
                          {cardPixMinimumCostFeeAdmin
                            ? `R$ ${cardPixMinimumCostFeeAdmin}`
                            : "-"}
                        </div>
                        {cardPixMinimumCostFeeAdmin &&
                          cardPixMinimumCostFee && (
                            <div className="text-[9px] text-gray-500">
                              R${" "}
                              {(
                                parseFloat(cardPixMinimumCostFeeAdmin) -
                                parseFloat(cardPixMinimumCostFee)
                              ).toFixed(2)}
                            </div>
                          )}
                      </div>
                      <div className="rounded-full h-7 min-w-14 max-w-18 flex justify-center items-center text-xs bg-blue-100 px-1">
                        {cardPixMinimumCostFee
                          ? `R$ ${cardPixMinimumCostFee}`
                          : "-"}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1 text-sm">Custo Máximo</h4>
                    <div className="flex flex-wrap gap-1">
                      <div className="flex items-center gap-1">
                        <div className="rounded-full h-7 min-w-14 max-w-18 flex justify-center items-center text-xs bg-amber-100 px-1">
                          {cardPixCeilingFeeAdmin
                            ? `R$ ${cardPixCeilingFeeAdmin}`
                            : "-"}
                        </div>
                        {cardPixCeilingFeeAdmin && cardPixCeilingFee && (
                          <div className="text-[9px] text-gray-500">
                            R${" "}
                            {(
                              parseFloat(cardPixCeilingFeeAdmin) -
                              parseFloat(cardPixCeilingFee)
                            ).toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className="rounded-full h-7 min-w-14 max-w-18 flex justify-center items-center text-xs bg-blue-100 px-1">
                        {cardPixCeilingFee ? `R$ ${cardPixCeilingFee}` : "-"}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1 text-sm">Antecipação</h4>
                    <div className="flex flex-wrap gap-1">
                      <div className="flex items-center gap-1">
                        <div className="rounded-full h-7 min-w-14 max-w-18 flex justify-center items-center text-xs bg-amber-100 px-1">
                          {eventualAnticipationFeeAdmin
                            ? `${eventualAnticipationFeeAdmin}%`
                            : "-"}
                        </div>
                        {eventualAnticipationFeeAdmin &&
                          eventualAnticipationFee && (
                            <div className="text-[9px] text-gray-500">
                              {(
                                parseFloat(eventualAnticipationFeeAdmin) -
                                parseFloat(eventualAnticipationFee)
                              ).toFixed(2)}
                              %
                            </div>
                          )}
                      </div>
                      <div className="rounded-full h-7 min-w-14 max-w-18 flex justify-center items-center text-xs bg-blue-100 px-1">
                        {eventualAnticipationFee
                          ? `${eventualAnticipationFee}%`
                          : "-"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Taxas Transações Online */}
          <Card className="shadow-sm w-full max-w-full overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Taxas Transações Online
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-full overflow-x-hidden">
              <div className="flex flex-col gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-100" />
                  <span className="text-sm text-gray-600">
                    Oferecido pelo Outbank
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-100" />
                  <span className="text-sm text-gray-600">Solicitado</span>
                </div>
              </div>
              <div className="overflow-y-hidden overflow-x-auto">
                <Table className="text-xs min-w-[1000px] w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="sticky left-0 z-20 bg-white w-20"
                        style={{ width: "28%", minWidth: "120px" }}
                      >
                        Bandeiras
                      </TableHead>
                      {SolicitationFeeProductTypeList.map((type, index) => (
                        <>
                          <TableHead
                            key={`${type.value}-noCardFeeAdmin-${index}`}
                            className="text-center"
                            style={{ width: "9%" }}
                          >
                            {type.label}
                          </TableHead>
                          <TableHead
                            key={`${type.value}-diff-${index}`}
                            className="text-center text-xs"
                            style={{ width: "7%" }}
                          ></TableHead>
                          <TableHead
                            key={`${type.value}-noCardFee-${index}`}
                            className="text-center"
                            style={{ width: "9%" }}
                          >
                            {type.label}
                          </TableHead>
                        </>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feesData.map((item) => (
                      <TableRow key={item.brand.value}>
                        <TableCell
                          className="font-medium sticky left-0 z-20 bg-white"
                          style={{ minWidth: "120px" }}
                        >
                          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                            {getCardImage(item.brand.value) && (
                              <img
                                src={getCardImage(item.brand.value)}
                                alt={item.brand.label}
                                width={40}
                                height={24}
                                className="object-contain w-8 h-5 sm:w-10 sm:h-6 flex-shrink-0"
                              />
                            )}
                            <span className="truncate">{item.brand.label}</span>
                          </div>
                        </TableCell>
                        {item.onlineTypes.map((productType, typeIndex) => {
                          const noCardFeeAdmin =
                            typeof productType.noCardFeeAdmin === "number"
                              ? productType.noCardFeeAdmin
                              : typeof productType.noCardFeeAdmin === "string"
                                ? parseFloat(productType.noCardFeeAdmin)
                                : 0;
                          const noCardFee =
                            typeof productType.noCardFee === "number"
                              ? productType.noCardFee
                              : typeof productType.noCardFee === "string"
                                ? parseFloat(productType.noCardFee)
                                : 0;
                          const difference =
                            noCardFeeAdmin && noCardFee
                              ? (noCardFeeAdmin - noCardFee).toFixed(2)
                              : "-";

                          return (
                            <>
                              <TableCell
                                key={`${item.brand.value}-${productType.value}-noCardFeeAdmin-${typeIndex}`}
                                className="p-1 text-center"
                              >
                                <div className="flex items-center justify-center">
                                  <div className="rounded-full py-1 px-2 inline-block min-w-[50px] max-w-[70px] text-center bg-amber-100 text-xs sm:text-sm">
                                    {productType.noCardFeeAdmin
                                      ? `${productType.noCardFeeAdmin}%`
                                      : "-"}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell
                                key={`${item.brand.value}-${productType.value}-diff-${typeIndex}`}
                                className="p-1 text-center"
                              >
                                <div className="text-[10px] text-gray-600 font-medium">
                                  {difference !== "-" ? `${difference}%` : "-"}
                                </div>
                              </TableCell>
                              <TableCell
                                key={`${item.brand.value}-${productType.value}-noCardFee-${typeIndex}`}
                                className="p-1 text-center"
                              >
                                <div className="rounded-full py-1 px-2 inline-block min-w-[50px] max-w-[70px] text-center bg-blue-100 text-xs sm:text-sm">
                                  {productType.noCardFee
                                    ? `${productType.noCardFee}%`
                                    : "-"}
                                </div>
                              </TableCell>
                            </>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="w-full overflow-hidden">
                <h3 className="text-lg font-medium mb-2">PIX Online</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-1 w-full max-w-full">
                  <div>
                    <h4 className="font-medium mb-1 text-sm">MDR</h4>
                    <div className="flex flex-wrap gap-1">
                      <div className="flex items-center gap-1">
                        <div className="rounded-full h-7 min-w-14 max-w-18 flex justify-center items-center text-xs bg-amber-100 px-1">
                          {nonCardPixMdrAdmin ? `${nonCardPixMdrAdmin}%` : "-"}
                        </div>
                        {nonCardPixMdrAdmin && nonCardPixMdr && (
                          <div className="text-[9px] text-gray-500">
                            {(
                              parseFloat(nonCardPixMdrAdmin) -
                              parseFloat(nonCardPixMdr)
                            ).toFixed(2)}
                            %
                          </div>
                        )}
                      </div>
                      <div className="rounded-full h-7 min-w-14 max-w-18 flex justify-center items-center text-xs bg-blue-100 px-1">
                        {nonCardPixMdr ? `${nonCardPixMdr}%` : "-"}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1 text-sm">Custo Mínimo</h4>
                    <div className="flex flex-wrap gap-1">
                      <div className="flex items-center gap-1">
                        <div className="rounded-full h-7 min-w-14 max-w-18 flex justify-center items-center text-xs bg-amber-100 px-1">
                          {nonCardPixMinimumCostFeeAdmin
                            ? `R$ ${nonCardPixMinimumCostFeeAdmin}`
                            : "-"}
                        </div>
                        {nonCardPixMinimumCostFeeAdmin &&
                          nonCardPixMinimumCostFee && (
                            <div className="text-[9px] text-gray-500">
                              R${" "}
                              {(
                                parseFloat(nonCardPixMinimumCostFeeAdmin) -
                                parseFloat(nonCardPixMinimumCostFee)
                              ).toFixed(2)}
                            </div>
                          )}
                      </div>
                      <div className="rounded-full h-7 min-w-14 max-w-18 flex justify-center items-center text-xs bg-blue-100 px-1">
                        {nonCardPixMinimumCostFee
                          ? `R$ ${nonCardPixMinimumCostFee}`
                          : "-"}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1 text-sm">Custo Máximo</h4>
                    <div className="flex flex-wrap gap-1">
                      <div className="flex items-center gap-1">
                        <div className="rounded-full h-7 min-w-14 max-w-18 flex justify-center items-center text-xs bg-amber-100 px-1">
                          {nonCardPixCeilingFeeAdmin
                            ? `R$ ${nonCardPixCeilingFeeAdmin}`
                            : "-"}
                        </div>
                        {nonCardPixCeilingFeeAdmin && nonCardPixCeilingFee && (
                          <div className="text-[9px] text-gray-500">
                            R${" "}
                            {(
                              parseFloat(nonCardPixCeilingFeeAdmin) -
                              parseFloat(nonCardPixCeilingFee)
                            ).toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className="rounded-full h-7 min-w-14 max-w-18 flex justify-center items-center text-xs bg-blue-100 px-1">
                        {nonCardPixCeilingFee
                          ? `R$ ${nonCardPixCeilingFee}`
                          : "-"}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1 text-sm">Antecipação</h4>
                    <div className="flex flex-wrap gap-1">
                      <div className="flex items-center gap-1">
                        <div className="rounded-full h-7 min-w-14 max-w-18 flex justify-center items-center text-xs bg-amber-100 px-1">
                          {nonCardEventualAnticipationFeeAdmin
                            ? `${nonCardEventualAnticipationFeeAdmin}%`
                            : "-"}
                        </div>
                        {nonCardEventualAnticipationFeeAdmin &&
                          nonCardEventualAnticipationFee && (
                            <div className="text-[9px] text-gray-500">
                              {(
                                parseFloat(
                                  nonCardEventualAnticipationFeeAdmin
                                ) - parseFloat(nonCardEventualAnticipationFee)
                              ).toFixed(2)}
                              %
                            </div>
                          )}
                      </div>
                      <div className="rounded-full h-7 min-w-14 max-w-18 flex justify-center items-center text-xs bg-blue-100 px-1">
                        {nonCardEventualAnticipationFee
                          ? `${nonCardEventualAnticipationFee}%`
                          : "-"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Card: Documentos */}
          <Card className="shadow-sm w-full max-w-full overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 col-span-2">
              <div className="mt-4">
                {pricingSolicitation.id && (
                  <ListDocumentDownload
                    solicitationId={pricingSolicitation.id}
                    refreshKey={refreshDocsKey}
                  />
                )}
              </div>
              {pricingSolicitation.status === "SEND_DOCUMENTS" && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => setOpenUploadDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <UploadIcon className="w-4 h-4" />
                    Importar Documentos
                  </Button>
                </div>
              )}
            </CardContent>
            <CardContent>
              <Dialog
                open={openUploadDialog}
                onOpenChange={setOpenUploadDialog}
              >
                <DialogContent className="sm:max-w-[900px]">
                  <DialogHeader>
                    <DialogTitle>Importar Documentos</DialogTitle>
                    <DialogDescription>
                      Selecione os documentos que deseja anexar à solicitação.
                    </DialogDescription>
                  </DialogHeader>
                  <FileUpload
                    title="Documentos"
                    description="Selecione os documentos que deseja anexar à solicitação."
                    entityType="solicitationFee"
                    entityId={Number(pricingSolicitation.id)}
                    fileType="DOCUMENTOS"
                    maxSizeMB={5}
                    acceptedFileTypes="pdf,jpeg,jpg,png,gif,bmp,tiff,ico,webp,svg,heic,heif,PNG"
                    onUploadComplete={handleUploadComplete}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCloseUploadDialog}
                    >
                      Concluir
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
          {pricingSolicitation.id && (
            <div className="flex justify-end gap-4 mt-6">
              {pricingSolicitation.status === "REVIEWED" && (
                <Button
                  variant="outline"
                  onClick={handleOpenRejectDialog}
                  disabled={isSubmitting}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                >
                  Recusar
                </Button>
              )}
              {pricingSolicitation.status === "REVIEWED" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleApprove();
                  }}
                  disabled={isSubmitting}
                  className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                >
                  Aceitar
                </Button>
              )}
              {pricingSolicitation.status === "APPROVED" && (
                <Button
                  variant="outline"
                  onClick={() => setShowUploadDialog(true)}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Importar e Concluir
                </Button>
              )}
            </div>
          )}
        </div>
        {/* Modal de Upload de Aditivo */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Aditivo Assinado</DialogTitle>
              <DialogDescription>
                Faça o upload do aditivo devidamente assinado
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="aditivo">Aditivo Assinado</Label>
                <Input
                  id="aditivo"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                />
              </div>
              {uploadedFile && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                  <FileIcon className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">{uploadedFile.name}</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUploadSubmit}
                disabled={!uploadedFile || isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Enviar Aditivo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Modal de Rejeição */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Rejeição</DialogTitle>
              <DialogDescription>
                Informe o motivo da rejeição desta solicitação de taxas.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Informe o motivo da rejeição"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReject}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? "Processando..." : "Rejeitar Solicitação"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Form>
    </div>
  );
}
