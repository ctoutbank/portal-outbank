"use client";

import { cnaeMap, mccToCnaeMap } from "@/lib/lookuptables/lookuptables";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";


import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";

import {
  insertSolicitationFeeAdmin,
  updateSolicitationFeeAdmin,
  mapFormDataToSolicitationAdmin,
  type SolicitationFeeAdminForm,
} from "@/features/categories/server/solicitationfee";
import {
  PricingSolicitationSchemaAdmin,
  schemaPricingSolicitationAdmin,
} from "@/features/categories/schema/schema";
import {
  SelectItem,
  SelectItemSolicitationFee,
  SolicitationFeeProductTypeList,
} from "@/lib/lookuptables/lookuptables";
import { brandList } from "@/lib/lookuptables/lookuptables-transactions";

import { updateCategoryWithSolicitationFeeId } from "@/features/categories/server/category";
import { BusinessInfoSectionFeeAdmin } from "./sections/business-info-section";
import { FeesAdminSection } from "./sections/fees-section";


interface PricingSolicitationFormProps {
  pricingSolicitation?: SolicitationFeeAdminForm | null;
  mcc: string | null;
  cnae: string | null;
  categoryId?: number | null;
  idSolicitationFee?: number | null;
}

export default function CategoriesFeeAdminForm({
  pricingSolicitation,
  mcc,
  cnae,
  categoryId,
  idSolicitationFee,
}: PricingSolicitationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [solicitationId, setSolicitationId] = useState<number | null>(idSolicitationFee || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  



  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<PricingSolicitationSchemaAdmin>({
    resolver: zodResolver(schemaPricingSolicitationAdmin),
    defaultValues: {
      cnae: cnae || "",
      mcc: mcc || "",
      cnpjQuantity: pricingSolicitation?.cnpjQuantity?.toString() || "",
      averageTicket: pricingSolicitation?.averageTicket || "",
      monthlyPosFee: pricingSolicitation?.monthlyPosFee || "",
      cardPixMdrAdmin: pricingSolicitation?.cardPixMdrAdmin || "",
      cardPixCeilingFeeAdmin: pricingSolicitation?.cardPixCeilingFeeAdmin || "",
      cardPixMinimumCostFeeAdmin: pricingSolicitation?.cardPixMinimumCostFeeAdmin || "",
      nonCardPixMdrAdmin: pricingSolicitation?.nonCardPixMdrAdmin || "",
      nonCardPixCeilingFeeAdmin: pricingSolicitation?.nonCardPixCeilingFeeAdmin || "",
      nonCardPixMinimumCostFeeAdmin:
        pricingSolicitation?.nonCardPixMinimumCostFeeAdmin || "",
      eventualAnticipationFeeAdmin:
        pricingSolicitation?.eventualAnticipationFeeAdmin || "",
      nonCardEventualAnticipationFeeAdmin:
        pricingSolicitation?.nonCardEventualAnticipationFeeAdmin || "",
      brands: pricingSolicitation?.brands
        ? pricingSolicitation.brands.map((brand) => ({
            name: brand.name,
            productTypes: brand.productTypes?.map((pt) => ({
              name: pt.name,
              feeAdmin: pt.feeAdmin?.toString() || "",
              noCardFeeAdmin: pt.noCardFeeAdmin?.toString() || "",
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
                
                feeAdmin: "",
                noCardFeeAdmin: "",
               
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
          form.setValue("cardPixMdrAdmin", mapping.mdr);
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
  async function mapFormDataToSolicitation(data: PricingSolicitationSchemaAdmin) {
    const mappedData = await mapFormDataToSolicitationAdmin(data);
    // Adicionar o ID da solicitação se existir
    if (solicitationId) {
      mappedData.id = solicitationId;
    }
    return mappedData;
  }

  // Create a new solicitation

  // Update an existing solicitation
  async function updateExistingSolicitation(values: PricingSolicitationSchemaAdmin) {
    const formattedData = await mapFormDataToSolicitation(values);

    console.log("Dados formatados para atualização:", {
      ...formattedData,
    });

    try {
      await updateSolicitationFeeAdmin(formattedData as SolicitationFeeAdminForm);
      return formattedData as SolicitationFeeAdminForm;
    } catch (error) {
      console.error("Erro na função updateSolicitationFeeAdmin:", error);
      throw error;
    }
  }


  // Final submission handler
  async function onSubmit(values: PricingSolicitationSchemaAdmin) {
    setIsSubmitting(true);
    try {
      if (solicitationId) {
        // Se já existe uma solicitação, apenas atualiza
        const newStatus = "COMPLETED";
        console.log("Valores antes de atualizar:", values);
        console.log("Status:", newStatus);
        console.log("ID da solicitação:", solicitationId);

        await updateExistingSolicitation(values);
        
        toast({
          title: "Taxas atualizadas com sucesso!",
          description: "As taxas da solicitação foram atualizadas.",
        });
      } else {
        // Se não existe solicitação, cria uma nova
        console.log("Criando nova solicitação...");
        const formattedData = await mapFormDataToSolicitation(values);
        
        // Criar nova solicitação
        const newSolicitationId = await insertSolicitationFeeAdmin(formattedData as SolicitationFeeAdminForm);
        
        if (newSolicitationId && categoryId) {
          // Atualizar a categoria com o ID da nova solicitação
          await updateCategoryWithSolicitationFeeId(categoryId, newSolicitationId);
          setSolicitationId(newSolicitationId);
          
          toast({
            title: "Solicitação criada com sucesso!",
            description: `Solicitação #${newSolicitationId} foi criada e associada à categoria.`,
          });
        }
      }
      
      // Refresh da página para atualizar os dados
      router.refresh();
      
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
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
     
      // O refresh já atualiza a página atual
    }
  }



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
                <BusinessInfoSectionFeeAdmin control={form.control} />

                {/* Details Section (conditional) */}
                {/*
                {form.watch("cnaeInUse") && (
                  <DetailsSection control={form.control} />
                )}

                {/* Fees Section */}
                <FeesAdminSection
                  control={form.control}
                />
              </form>
            </Form>

 
            <div className="flex justify-end items-center gap-4 mt-4">
              <Button
                type="button"
                onClick={() => formRef.current?.requestSubmit()}
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? "Salvando..." 
                  : idSolicitationFee 
                    ? "Atualizar Taxas" 
                    : "Criar Taxas"
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
