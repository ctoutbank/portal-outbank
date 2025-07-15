"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {useEffect, useState} from "react";
import { useForm } from "react-hook-form";
import {cnaeMap, mccToCnaeMap} from "@/lib/lookuptables/lookuptables"


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
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";

import {
  PricingSolicitationSchema,
  schemaPricingSolicitation,
} from "@/features/pricingSolicitation/schema/schema";
import {
  updatePricingSolicitation,
  type PricingSolicitationForm,
} from "@/features/pricingSolicitation/server/pricing-solicitation";
import {
  SelectItem,
  SelectItemSolicitationFee,
  SolicitationFeeProductTypeList,
} from "@/lib/lookuptables/lookuptables";
import { brandList } from "@/lib/lookuptables/lookuptables-transactions";

import FileUpload from "@/components/fileUpload";
import { DocumentUploadContent } from "@/features/pricingSolicitation/_components/document-upload-content";
import ListDocumentDownload from "@/features/pricingSolicitation/_components/list-document-download";
import { UploadIcon, User } from "lucide-react";
import { BusinessInfoSection } from "./sections/business-info-section";
import { DetailsSection } from "./sections/details-section";
import { FeesSection } from "./sections/fees-section";


interface PricingSolicitationFormProps {
  pricingSolicitation?: PricingSolicitationForm | null;
  mcc: string | null;
  cnae: string | null;
}

export default function PricingSolicitationForm({
  pricingSolicitation,
  mcc,
  cnae,
}: PricingSolicitationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [refreshDocsKey, setRefreshDocsKey] = useState(0);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [solicitationId, setSolicitationId] = useState<number | null>(
    pricingSolicitation?.id || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccessful, setUploadSuccessful] = useState(false);

  const handleUploadComplete = (fileData: {
    fileId: number;
    fileURL: string;
    fileName: string;
    fileExtension: string;
  }) => {
    console.log("Arquivo enviado com sucesso:", fileData);
    setRefreshDocsKey((k) => k + 1);
  };

  const [formStatus, setFormStatus] = useState<
    "SEND_DOCUMENTS" | "PENDING" | null
  >(
    pricingSolicitation?.status === "PENDING"
      ? "PENDING"
      : pricingSolicitation?.status === "SEND_DOCUMENTS"
        ? "SEND_DOCUMENTS"
        : null
  );

  const formRef = useRef<HTMLFormElement>(null);

  // Simplified function to just open the dialog
  function handleOpenDocumentUpload() {
    setUploadSuccessful(false);
    setOpenUploadDialog(true);
  }

  // Função para lidar com a criação de solicitação durante o upload
  const handleSolicitationCreated = (id: number) => {
    console.log(`Solicitação criada com ID: ${id}`);
    setSolicitationId(id);
    setFormStatus("SEND_DOCUMENTS");
    setUploadSuccessful(true);

    // Atualizar a URL para incluir o ID da solicitação sem navegar
    // Corrigir o caminho para usar o formato correto da aplicação
            window.history.replaceState({}, "", `/solicitationfee/${id}`);
  };

  const form = useForm<PricingSolicitationSchema>({
    resolver: zodResolver(schemaPricingSolicitation),
    defaultValues: {
      cnae: cnae || "",
      mcc: mcc || "",
      cnpjsQuantity: pricingSolicitation?.cnpjQuantity?.toString() || "",
      ticketAverage: pricingSolicitation?.averageTicket || "",
      tpvMonthly: pricingSolicitation?.monthlyPosFee || "",
      cardPixMdr: pricingSolicitation?.cardPixMdr || "",
      cardPixCeilingFee: pricingSolicitation?.cardPixCeilingFee || "",
      cardPixMinimumCostFee: pricingSolicitation?.cardPixMinimumCostFee || "",
      nonCardPixMdr: pricingSolicitation?.nonCardPixMdr || "",
      nonCardPixCeilingFee: pricingSolicitation?.nonCardPixCeilingFee || "",
      nonCardPixMinimumCostFee:
        pricingSolicitation?.nonCardPixMinimumCostFee || "",
      eventualAnticipationFee:
        pricingSolicitation?.eventualAnticipationFee || "",
      nonCardEventualAnticipationFee:
        pricingSolicitation?.nonCardEventualAnticipationFee || "",
      brands: pricingSolicitation?.brands
        ? pricingSolicitation.brands.map((brand) => ({
            name: brand.name,
            productTypes: brand.productTypes?.map((pt) => ({
              name: pt.name,
              fee: pt.fee?.toString() || "",
              feeAdmin: pt.feeAdmin?.toString() || "",
              feeDock: pt.feeDock?.toString() || "",
              noCardFee: pt.noCardFee?.toString() || "",
              noCardTransactionAnticipationMdr:
                pt.noCardTransactionAnticipationMdr?.toString() || "",
              noCardFeeAdmin: pt.noCardFeeAdmin?.toString() || "",
              noCardFeeDock: pt.noCardFeeDock?.toString() || "",

              transactionFeeStart: pt.transactionFeeStart?.toString() || "",
              transactionFeeEnd: pt.transactionFeeEnd?.toString() || "",
              transactionAnticipationMdr:
                pt.transactionAnticipationMdr?.toString() || "",
            })),
          }))
        : brandList.map((brand: SelectItem) => ({
            name: brand.value,
            productTypes: SolicitationFeeProductTypeList.map(
              (productType: SelectItemSolicitationFee) => ({
                name: productType.value,
                fee: "",
                feeAdmin: "",
                feeDock: "",
                transactionFeeStart: productType.transactionFeeStart || "",
                transactionFeeEnd: productType.transactionFeeEnd || "",

                transactionAnticipationMdr: "",
              })
            ),
          })),
      cnaeInUse: pricingSolicitation?.cnaeInUse || false,
      description: pricingSolicitation?.description || "",
    },
  });

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      console.log("WATCH TRIGGERED:", name, value);
      if (name === "cnae" && value.cnae) {
        const mapping = cnaeMap[value.cnae];
        if (mapping && value.mcc !== mapping.mcc) { // Verificar se o mcc atual é diferente
          console.log("MCC SETADO COMO: ", mapping.mcc);
          form.setValue("mcc", mapping.mcc);
          form.setValue("cardPixMdr", mapping.mdr);
        }
      }

      // Preenche o campo cnae automaticamente quando o mcc for preenchido
      if (name === "mcc" && value.mcc) {
        const cnae = mccToCnaeMap[value.mcc];
        if (cnae && value.cnae !== cnae) { // Verificar se o cnae atual é diferente
          console.log("CNAE SETADO COMO: ", cnae);
          form.setValue("cnae", cnae);
        }
      }

    });
    return () => subscription.unsubscribe?.();
  }, [form]);


  // Map form data to solicitation structure
  function mapFormDataToSolicitation(data: PricingSolicitationSchema): PricingSolicitationForm | undefined {
    // Se não houver dados, retorna undefined
    if (!data) return undefined;

    const mappedData: PricingSolicitationForm = {
      id: solicitationId || 0,
      cnae: data.cnae || "",
      mcc: data.mcc || "",
      cnpjQuantity: data.cnpjsQuantity ? Number(data.cnpjsQuantity) : 0,
      slug: null,
      dtinsert: new Date().toISOString(),
      dtupdate: new Date().toISOString(),
      idCustomers: null,
      monthlyPosFee: data.tpvMonthly || null,
      averageTicket: data.ticketAverage || null,
      description: data.description || null,
      cnaeInUse: data.cnaeInUse ?? null,
      cardPixMdr: data.cardPixMdr || null,
      cardPixCeilingFee: data.cardPixCeilingFee || null,
      cardPixMinimumCostFee: data.cardPixMinimumCostFee || null,
      nonCardPixMdr: data.nonCardPixMdr || null,
      nonCardPixCeilingFee: data.nonCardPixCeilingFee || null,
      nonCardPixMinimumCostFee: data.nonCardPixMinimumCostFee || null,
      compulsoryAnticipationConfig: Number(data.eventualAnticipationFee) || 0,
      eventualAnticipationFee: data.eventualAnticipationFee || null,
      nonCardEventualAnticipationFee:
        data.nonCardEventualAnticipationFee || null,
      cardPixMdrAdmin: null,
      cardPixCeilingFeeAdmin: null,
      cardPixMinimumCostFeeAdmin: null,
      nonCardPixMdrAdmin: null,
      nonCardPixCeilingFeeAdmin: null,
      nonCardPixMinimumCostFeeAdmin: null,
      compulsoryAnticipationConfigAdmin: 0,
      eventualAnticipationFeeAdmin: null,
      nonCardEventualAnticipationFeeAdmin: null,
      cardPixMdrDock: null,
      cardPixCeilingFeeDock: null,
      cardPixMinimumCostFeeDock: null,
      nonCardPixMdrDock: null,
      nonCardPixCeilingFeeDock: null,
      nonCardPixMinimumCostFeeDock: null,
      compulsoryAnticipationConfigDock: 0,
      eventualAnticipationFeeDock: null,
      nonCardEventualAnticipationFeeDock: null,
      status: "SEND_DOCUMENTS", // Definir status padrão para upload
      brands: (data.brands || []).map((brand) => ({
        name: brand.name || "",
        productTypes: (brand.productTypes || []).map((productType) => ({
          name: productType.name || "",
          fee: productType.fee || "",
          feeAdmin: productType.feeAdmin || "",
          feeDock: productType.feeDock || "",
          transactionFeeStart: productType.transactionFeeStart || "",
          transactionFeeEnd: productType.transactionFeeEnd || "",
          noCardFee: productType.noCardFee || "",
          noCardFeeAdmin: productType.noCardFeeAdmin || "",
          noCardFeeDock: productType.noCardFeeDock || "",
          noCardTransactionAnticipationMdr:
            productType.noCardTransactionAnticipationMdr || "",
          transactionAnticipationMdr:
            productType.transactionAnticipationMdr || "",
        })),
      })),
    };

    console.log("Dados do formulário mapeados para upload:", mappedData);
    return mappedData;
  }

  // Create a new solicitation

  // Update an existing solicitation
  async function updateExistingSolicitation(values: PricingSolicitationSchema) {
    const formattedData = mapFormDataToSolicitation(values);

    console.log("Dados formatados para atualização:", {
      ...formattedData,
    });

    try {
      await updatePricingSolicitation(formattedData as PricingSolicitationForm);
      return formattedData as PricingSolicitationForm;
    } catch (error) {
      console.error("Erro na função updatePricingSolicitation:", error);
      throw error;
    }
  }


  // Final submission handler
  async function onSubmit(values: PricingSolicitationSchema) {
    setIsSubmitting(true);
    try {
      if (solicitationId) {
        const newStatus = "PENDING";

        console.log("Valores antes de atualizar:", values);
        console.log("Status:", newStatus);
        console.log("ID da solicitação:", solicitationId);

        // Atualiza a solicitação existente para o novo status
        await updateExistingSolicitation(values);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      let errorMessage = "Erro desconhecido";

      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Stack:", error.stack, errorMessage);
      }

      toast({
        variant: "destructive",
        title: "Erro ao enviar formulário",
      });
    } finally {
      setIsSubmitting(false);
      router.push(`/solicitationfee/${solicitationId}`);
    }
  }

  // Handle closing upload dialog
  const handleCloseUploadDialog = () => {
    setOpenUploadDialog(false);

    // Se uma solicitação foi criada durante o upload e temos um ID
    if (uploadSuccessful && solicitationId) {
      // Navegar para a página correta com o ID da solicitação
      router.push(`/solicitationfee/${solicitationId}`);
    }
  };

  return (
    <div>
      <div className="">
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                ref={formRef}
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                {/* Business Information Section */}
                <BusinessInfoSection control={form.control} />

                {/* Details Section (conditional) */}
                {form.watch("cnaeInUse") && (
                  <DetailsSection control={form.control} />
                )}

                {/* Fees Section */}
                <FeesSection
                  control={form.control}
                  isNewSolicitation={solicitationId === null}
                  hideFeeAdmin={formStatus == "SEND_DOCUMENTS"}
                />
                {pricingSolicitation?.status === "SEND_DOCUMENTS" && (
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl flex items-center">
                        <User className="h-5 w-5 mr-2 text-primary" />
                        Documentos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 col-span-2">
                      <div className="mt-4 ">
                        {pricingSolicitation?.id && (
                          <ListDocumentDownload
                            solicitationId={pricingSolicitation.id}
                            refreshKey={refreshDocsKey}
                          />
                        )}
                      </div>

                      {/* Adicionar botão para abrir o diálogo de upload quando status é PENDING */}

                      <div className="flex justify-end ">
                        <Button
                          onClick={() => setOpenUploadDialog(true)}
                          className="flex items-center gap-2"
                        >
                          <UploadIcon className="w-4 h-4" />
                          Importar Documentos
                        </Button>
                      </div>
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
                              Selecione os documentos que deseja anexar à
                              solicitação.
                            </DialogDescription>
                          </DialogHeader>
                          <FileUpload
                            title="Documentos"
                            description="Selecione os documentos que deseja anexar à solicitação."
                            entityType="solicitationFee"
                            entityId={Number(pricingSolicitation?.id || 0)}
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
                )}
              </form>
            </Form>
            <div className="flex justify-end items-center gap-4 mt-4">
              {pricingSolicitation?.status != "SEND_DOCUMENTS" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenDocumentUpload}
                  className="flex items-center gap-2"
                >
                  <UploadIcon className="h-4 w-4" />
                  Importar
                </Button>
              )}
              <Button
                type="button"
                onClick={() => formRef.current?.requestSubmit()}
                disabled={isSubmitting || !solicitationId}
              >
                {isSubmitting ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={openUploadDialog} onOpenChange={setOpenUploadDialog}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Importar Documentos</DialogTitle>
            <DialogDescription>
              {uploadSuccessful
                ? `Solicitação #${solicitationId} criada com sucesso. Você pode continuar adicionando documentos.`
                : "Selecione os documentos que deseja anexar à solicitação."}
            </DialogDescription>
          </DialogHeader>

          <DocumentUploadContent
            solicitationId={solicitationId}
            pricingSolicitationData={
              !solicitationId
                ? mapFormDataToSolicitation(form.getValues())
                : undefined
            }
            onSolicitationCreated={handleSolicitationCreated}
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
    </div>
  );
}
