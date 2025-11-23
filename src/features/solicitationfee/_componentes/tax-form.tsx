
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CardLogo } from "@/components/ui/card-logo";
import { brandList, SolicitationFeeProductTypeList } from "@/lib/lookuptables/lookuptables-tax";
import React, { CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TaXEditFormSchema } from "../schema/schema-tax";
import { updateSolicitationFeeBrandsWithTaxes } from "../server/solicitationfee";

interface TaxEditFormProps {
  idsolicitationFee: number;
  solicitationFeetax: TaXEditFormSchema;
}

export function TaxEditForm1({ idsolicitationFee, solicitationFeetax }: TaxEditFormProps) {
  // Função para inicializar corretamente os valores do formulário
  const initializeFormValues = (): TaXEditFormSchema => {
    console.log("Dados originais recebidos do backend:", solicitationFeetax);
    
    // Criar array para armazenar todos os tipos de produtos
    const solicitationFeeBrands = brandList.map(brand => {
      // Encontrar a marca correspondente nos dados recebidos
      const existingBrand = solicitationFeetax?.solicitationFee?.solicitationFeeBrands?.find(
        b => b.brand === brand.value
      ) || { 
        id: 0, 
        slug: '', 
        brand: brand.value, 
        solicitationFeeId: solicitationFeetax?.solicitationFee?.id || 0,
        dtinsert: undefined,
        dtupdate: undefined,
        solicitationBrandProductTypes: []
      };

      // Criar array de produtos para esta marca, garantindo que todos os tipos estejam presentes
      const solicitationBrandProductTypes = SolicitationFeeProductTypeList.map(productType => {
        // Remover espaços extras dos valores para garantir correspondência exata
        const cleanProductTypeValue = productType.value.trim();
        
        // Encontrar o produto correspondente nos dados recebidos
        const existingProduct = existingBrand.solicitationBrandProductTypes?.find(
          (p) => {
            // Tolerar espaços extras no valor do banco de dados
            const dbProductType = p?.productType?.trim();
            // Fazer a comparação ignorando os espaços extras
            const matchingType = dbProductType === cleanProductTypeValue;
            // Para produtos de crédito parcelado, verificar também o intervalo
            const matchingInterval = 
              String(p.transactionFeeStart) === productType.transactionFeeStart && 
              String(p.transactionFeeEnd) === productType.transactionFeeEnd;
            
            return matchingType && matchingInterval;
          }
        );

        // Se o produto existir, manter todas as propriedades originais
        if (existingProduct) {
          // Importante: log para debugar valores noCardFee
          console.log(`Produto encontrado: ${cleanProductTypeValue} com valores:`, {
            noCardFee: existingProduct.noCardFee,
            noCardFeeAdmin: existingProduct.noCardFeeAdmin,
            noCardFeeDock: existingProduct.noCardFeeDock
          });
          
          // Usar diretamente os valores originais, sem nenhuma conversão
          return {
            ...existingProduct
          };
        } else {
          // Se não existir, criar um produto novo com valores vazios
          return {
            id: 0,
            slug: '',
            productType: cleanProductTypeValue,
            fee: '',
            feeAdmin: '',
            feeDock: '',
            transactionFeeStart: productType.transactionFeeStart,
            transactionFeeEnd: productType.transactionFeeEnd,
            pixMinimumCostFee: '',
            pixCeilingFee: '',
            transactionAnticipationMdr: '',
            dtinsert: undefined,
            dtupdate: undefined,
            // Importante: incluir campos noCard mesmo para produtos novos
            noCardFee: '',
            noCardFeeAdmin: '',
            noCardFeeDock: '',
            noCardTransactionAnticipationMdr: ''
          };
        }
      });

      return {
        ...existingBrand,
        solicitationBrandProductTypes
      };
    });

    // Importante: manter todos os valores originais da solicitação e garantir que os campos PIX estejam presentes
    const solicitationFeeData = solicitationFeetax?.solicitationFee || {};
    
    // Log para depuração dos campos PIX
    console.log("Campos PIX nos dados originais:", {
      // PIX Online (nonCard)
      nonCardPixMdr: solicitationFeeData.nonCardPixMdr,
      nonCardPixMdrAdmin: solicitationFeeData.nonCardPixMdrAdmin,
      nonCardPixMdrDock: solicitationFeeData.nonCardPixMdrDock,
      nonCardPixCeilingFee: solicitationFeeData.nonCardPixCeilingFee,
      nonCardPixCeilingFeeAdmin: solicitationFeeData.nonCardPixCeilingFeeAdmin,
      nonCardPixCeilingFeeDock: solicitationFeeData.nonCardPixCeilingFeeDock,
      nonCardPixMinimumCostFee: solicitationFeeData.nonCardPixMinimumCostFee,
      nonCardPixMinimumCostFeeAdmin: solicitationFeeData.nonCardPixMinimumCostFeeAdmin,
      nonCardPixMinimumCostFeeDock: solicitationFeeData.nonCardPixMinimumCostFeeDock,
      
      // PIX Pos (card)
      cardPixMdr: solicitationFeeData.cardPixMdr,
      cardPixMdrAdmin: solicitationFeeData.cardPixMdrAdmin,
      cardPixMdrDock: solicitationFeeData.cardPixMdrDock,
      cardPixCeilingFee: solicitationFeeData.cardPixCeilingFee,
      cardPixCeilingFeeAdmin: solicitationFeeData.cardPixCeilingFeeAdmin,
      cardPixCeilingFeeDock: solicitationFeeData.cardPixCeilingFeeDock,
      cardPixMinimumCostFee: solicitationFeeData.cardPixMinimumCostFee,
      cardPixMinimumCostFeeAdmin: solicitationFeeData.cardPixMinimumCostFeeAdmin,
      cardPixMinimumCostFeeDock: solicitationFeeData.cardPixMinimumCostFeeDock,
      
      // Campos de antecipação
      eventualAnticipationFee: solicitationFeeData.eventualAnticipationFee,
      eventualAnticipationFeeAdmin: solicitationFeeData.eventualAnticipationFeeAdmin,
      eventualAnticipationFeeDock: solicitationFeeData.eventualAnticipationFeeDock,
      nonCardEventualAnticipationFee: solicitationFeeData.nonCardEventualAnticipationFee,
      nonCardEventualAnticipationFeeAdmin: solicitationFeeData.nonCardEventualAnticipationFeeAdmin,
      nonCardEventualAnticipationFeeDock: solicitationFeeData.nonCardEventualAnticipationFeeDock
    });

    return {
      solicitationFee: {
        ...solicitationFeeData,
        solicitationFeeBrands,
        // Garantir que todos os campos PIX estejam presentes, mesmo que vazios
        nonCardPixMdr: solicitationFeeData.nonCardPixMdr || '',
        nonCardPixMdrAdmin: solicitationFeeData.nonCardPixMdrAdmin || '',
        nonCardPixMdrDock: solicitationFeeData.nonCardPixMdrDock || '',
        nonCardPixCeilingFee: solicitationFeeData.nonCardPixCeilingFee || '',
        nonCardPixCeilingFeeAdmin: solicitationFeeData.nonCardPixCeilingFeeAdmin || '',
        nonCardPixCeilingFeeDock: solicitationFeeData.nonCardPixCeilingFeeDock || '',
        nonCardPixMinimumCostFee: solicitationFeeData.nonCardPixMinimumCostFee || '',
        nonCardPixMinimumCostFeeAdmin: solicitationFeeData.nonCardPixMinimumCostFeeAdmin || '',
        nonCardPixMinimumCostFeeDock: solicitationFeeData.nonCardPixMinimumCostFeeDock || '',
        cardPixMdr: solicitationFeeData.cardPixMdr || '',
        cardPixMdrAdmin: solicitationFeeData.cardPixMdrAdmin || '',
        cardPixMdrDock: solicitationFeeData.cardPixMdrDock || '',
        cardPixCeilingFee: solicitationFeeData.cardPixCeilingFee || '',
        cardPixCeilingFeeAdmin: solicitationFeeData.cardPixCeilingFeeAdmin || '',
        cardPixCeilingFeeDock: solicitationFeeData.cardPixCeilingFeeDock || '',
        cardPixMinimumCostFee: solicitationFeeData.cardPixMinimumCostFee || '',
        cardPixMinimumCostFeeAdmin: solicitationFeeData.cardPixMinimumCostFeeAdmin || '',
        cardPixMinimumCostFeeDock: solicitationFeeData.cardPixMinimumCostFeeDock || '',
        eventualAnticipationFee: solicitationFeeData.eventualAnticipationFee || '',
        eventualAnticipationFeeAdmin: solicitationFeeData.eventualAnticipationFeeAdmin || '',
        eventualAnticipationFeeDock: solicitationFeeData.eventualAnticipationFeeDock || '',
        nonCardEventualAnticipationFee: solicitationFeeData.nonCardEventualAnticipationFee || '',
        nonCardEventualAnticipationFeeAdmin: solicitationFeeData.nonCardEventualAnticipationFeeAdmin || '',
        nonCardEventualAnticipationFeeDock: solicitationFeeData.nonCardEventualAnticipationFeeDock || ''
      }
    };
  };

  // Inicializar os valores do formulário sem o hook useForm
  const [formData, setFormData] = React.useState(() => initializeFormValues());
  const [submitting, setSubmitting] = React.useState(false);
  
  // Função para atualizar valores específicos no formulário
  const updateFormValue = (brandIndex: number, productIndex: number, field: 'feeAdmin' | 'feeDock' | 'noCardFeeAdmin' | 'noCardFeeDock', value: string) => {
    console.log(`Atualizando campo ${field} na marca ${brandIndex}, produto ${productIndex} com valor ${value}`);
    
    setFormData(prevData => {
      const newData = { ...prevData };
      if (newData.solicitationFee?.solicitationFeeBrands?.[brandIndex]?.solicitationBrandProductTypes?.[productIndex]) {
        // Atualizar o valor no campo específico
        newData.solicitationFee.solicitationFeeBrands[brandIndex].solicitationBrandProductTypes[productIndex][field] = value;
        
        // Log para verificar valores após atualização
        const updatedProduct = newData.solicitationFee.solicitationFeeBrands[brandIndex].solicitationBrandProductTypes[productIndex];
        console.log(`Produto após atualização:`, {
          productType: updatedProduct.productType,
          [field]: updatedProduct[field],
          tipo: typeof updatedProduct[field]
        });
      } else {
        console.warn(`Não foi possível atualizar: índices inválidos - marca ${brandIndex}, produto ${productIndex}`);
      }
      return newData;
    });
  };

  // Função para enviar os dados
  const handleSubmit = async () => {
    setSubmitting(true);
    console.log("===== INICIANDO ENVIO DOS DADOS =====");
    console.log("ID da solicitação:", idsolicitationFee);
    console.log("Form data completo:", formData);

    try {
      // Extrair apenas os dados necessários: marca, tipo de produto, feeAdmin e feeDock
      const simplifiedBrands = formData.solicitationFee.solicitationFeeBrands.map(brand => {
        console.log(`Processando marca: ${brand.brand}`);
        return {
          brand: brand.brand || "",
          productTypes: brand.solicitationBrandProductTypes.map(type => {
            // Garantir que todos os valores numéricos sejam processados corretamente
            const fee = parseNumericValue(type.fee || 0);
            const feeAdmin = parseNumericValue(type.feeAdmin || 0);
            const feeDock = parseNumericValue(type.feeDock || 0);
            const pixMinimumCostFee = parseNumericValue(type.pixMinimumCostFee || 0);
            const pixCeilingFee = parseNumericValue(type.pixCeilingFee || 0);
            const transactionAnticipationMdr = parseNumericValue(type.transactionAnticipationMdr || 0);
            
            // Processar valores nonCard com cuidado especial
            console.log(`Processando valores nonCard para produto: ${type.productType}`);
            console.log(`  Valores originais: noCardFee=${type.noCardFee}, noCardFeeAdmin=${type.noCardFeeAdmin}, noCardFeeDock=${type.noCardFeeDock}`);
            
            const noCardFee = parseNumericValue(type.noCardFee || 0);
            const noCardFeeAdmin = parseNumericValue(type.noCardFeeAdmin || 0);
            const noCardFeeDock = parseNumericValue(type.noCardFeeDock || 0);
            const noCardTransactionAnticipationMdr = parseNumericValue(type.noCardTransactionAnticipationMdr || 0);
            
            console.log(`  Valores convertidos: noCardFee=${noCardFee}, noCardFeeAdmin=${noCardFeeAdmin}, noCardFeeDock=${noCardFeeDock}`);
            
            console.log(`  Produto: ${type.productType || ""}`);
            console.log(`    fee: ${fee} (original: ${type.fee})`);
            console.log(`    feeAdmin: ${feeAdmin} (original: ${type.feeAdmin})`);
            console.log(`    feeDock: ${feeDock} (original: ${type.feeDock})`);
            console.log(`    transactionFeeStart: ${parseInt(String(type.transactionFeeStart) || "0")}`);
            console.log(`    transactionFeeEnd: ${parseInt(String(type.transactionFeeEnd) || "0")}`);
            console.log(`    noCardFee: ${noCardFee} (original: ${type.noCardFee})`);
            console.log(`    noCardFeeAdmin: ${noCardFeeAdmin} (original: ${type.noCardFeeAdmin})`);
            console.log(`    noCardFeeDock: ${noCardFeeDock} (original: ${type.noCardFeeDock})`);
            
            return {
              productType: type.productType || "",
              fee,
              feeAdmin,
              feeDock,
              transactionFeeStart: parseInt(String(type.transactionFeeStart) || "0"),
              transactionFeeEnd: parseInt(String(type.transactionFeeEnd) || "0"),
              pixMinimumCostFee,
              pixCeilingFee,
              transactionAnticipationMdr,
              noCardFee,
              noCardFeeAdmin,
              noCardFeeDock,
              noCardTransactionAnticipationMdr
            };
          })
        };
      });

      console.log("===== PREPARANDO DADOS PIX =====");
      
      // Garantir que todos os campos PIX tenham valores definidos
      // Removendo % e convertendo para número com precisão correta
      const pixFields = {
        // PIX Online (nonCard)
        nonCardPixMdr: formData.solicitationFee.nonCardPixMdr || '',
        nonCardPixMdrAdmin: formData.solicitationFee.nonCardPixMdrAdmin || '',
        nonCardPixMdrDock: formData.solicitationFee.nonCardPixMdrDock || '',
        nonCardPixCeilingFee: formData.solicitationFee.nonCardPixCeilingFee || '',
        nonCardPixCeilingFeeAdmin: formData.solicitationFee.nonCardPixCeilingFeeAdmin || '',
        nonCardPixCeilingFeeDock: formData.solicitationFee.nonCardPixCeilingFeeDock || '',
        nonCardPixMinimumCostFee: formData.solicitationFee.nonCardPixMinimumCostFee || '',
        nonCardPixMinimumCostFeeAdmin: formData.solicitationFee.nonCardPixMinimumCostFeeAdmin || '',
        nonCardPixMinimumCostFeeDock: formData.solicitationFee.nonCardPixMinimumCostFeeDock || '',
        
        // PIX Pos (card)
        cardPixMdr: formData.solicitationFee.cardPixMdr || '',
        cardPixMdrAdmin: formData.solicitationFee.cardPixMdrAdmin || '',
        cardPixMdrDock: formData.solicitationFee.cardPixMdrDock || '',
        cardPixCeilingFee: formData.solicitationFee.cardPixCeilingFee || '',
        cardPixCeilingFeeAdmin: formData.solicitationFee.cardPixCeilingFeeAdmin || '',
        cardPixCeilingFeeDock: formData.solicitationFee.cardPixCeilingFeeDock || '',
        cardPixMinimumCostFee: formData.solicitationFee.cardPixMinimumCostFee || '',
        cardPixMinimumCostFeeAdmin: formData.solicitationFee.cardPixMinimumCostFeeAdmin || '',
        cardPixMinimumCostFeeDock: formData.solicitationFee.cardPixMinimumCostFeeDock || '',
        
        // Campos de antecipação
        eventualAnticipationFee: formData.solicitationFee.eventualAnticipationFee || '',
        eventualAnticipationFeeAdmin: formData.solicitationFee.eventualAnticipationFeeAdmin || '',
        eventualAnticipationFeeDock: formData.solicitationFee.eventualAnticipationFeeDock || '',
        nonCardEventualAnticipationFee: formData.solicitationFee.nonCardEventualAnticipationFee || '',
        nonCardEventualAnticipationFeeAdmin: formData.solicitationFee.nonCardEventualAnticipationFeeAdmin || '',
        nonCardEventualAnticipationFeeDock: formData.solicitationFee.nonCardEventualAnticipationFeeDock || ''
      };
      
      console.log("Valores originais PIX:", pixFields);
      
      // Converter todos os campos para valores numéricos
      const nonCardPixData = {
        // PIX Online (nonCard)
        nonCardPixMdr: parseNumericValue(pixFields.nonCardPixMdr),
        nonCardPixCeilingFee: parseNumericValue(pixFields.nonCardPixCeilingFee),
        nonCardPixMinimumCostFee: parseNumericValue(pixFields.nonCardPixMinimumCostFee),
        nonCardPixMdrAdmin: parseNumericValue(pixFields.nonCardPixMdrAdmin),
        nonCardPixCeilingFeeAdmin: parseNumericValue(pixFields.nonCardPixCeilingFeeAdmin),
        nonCardPixMinimumCostFeeAdmin: parseNumericValue(pixFields.nonCardPixMinimumCostFeeAdmin),
        nonCardPixMdrDock: parseNumericValue(pixFields.nonCardPixMdrDock),
        nonCardPixCeilingFeeDock: parseNumericValue(pixFields.nonCardPixCeilingFeeDock),
        nonCardPixMinimumCostFeeDock: parseNumericValue(pixFields.nonCardPixMinimumCostFeeDock),
        
        // PIX Pos (card)
        cardPixMdr: parseNumericValue(pixFields.cardPixMdr),
        cardPixCeilingFee: parseNumericValue(pixFields.cardPixCeilingFee),
        cardPixMinimumCostFee: parseNumericValue(pixFields.cardPixMinimumCostFee),
        cardPixMdrAdmin: parseNumericValue(pixFields.cardPixMdrAdmin),
        cardPixCeilingFeeAdmin: parseNumericValue(pixFields.cardPixCeilingFeeAdmin),
        cardPixMinimumCostFeeAdmin: parseNumericValue(pixFields.cardPixMinimumCostFeeAdmin),
        cardPixMdrDock: parseNumericValue(pixFields.cardPixMdrDock),
        cardPixCeilingFeeDock: parseNumericValue(pixFields.cardPixCeilingFeeDock),
        cardPixMinimumCostFeeDock: parseNumericValue(pixFields.cardPixMinimumCostFeeDock),
        
        // Campos de antecipação
        eventualAnticipationFee: parseNumericValue(pixFields.eventualAnticipationFee),
        eventualAnticipationFeeAdmin: parseNumericValue(pixFields.eventualAnticipationFeeAdmin),
        eventualAnticipationFeeDock: parseNumericValue(pixFields.eventualAnticipationFeeDock),
        nonCardEventualAnticipationFee: parseNumericValue(pixFields.nonCardEventualAnticipationFee),
        nonCardEventualAnticipationFeeAdmin: parseNumericValue(pixFields.nonCardEventualAnticipationFeeAdmin),
        nonCardEventualAnticipationFeeDock: parseNumericValue(pixFields.nonCardEventualAnticipationFeeDock)
      };

      // Log detalhado dos valores PIX para depuração
      console.log("===== DETALHAMENTO DOS VALORES PIX =====");
      console.log("PIX Online (nonCard):");
      console.log(`  MDR - Original: ${pixFields.nonCardPixMdr}, Processado: ${nonCardPixData.nonCardPixMdr}, Tipo: ${typeof nonCardPixData.nonCardPixMdr}`);
      console.log(`  MDR Admin - Original: ${pixFields.nonCardPixMdrAdmin}, Processado: ${nonCardPixData.nonCardPixMdrAdmin}, Tipo: ${typeof nonCardPixData.nonCardPixMdrAdmin}`);
      console.log(`  MDR Dock - Original: ${pixFields.nonCardPixMdrDock}, Processado: ${nonCardPixData.nonCardPixMdrDock}, Tipo: ${typeof nonCardPixData.nonCardPixMdrDock}`);
      console.log(`  Custo Mínimo - Original: ${pixFields.nonCardPixMinimumCostFee}, Processado: ${nonCardPixData.nonCardPixMinimumCostFee}, Tipo: ${typeof nonCardPixData.nonCardPixMinimumCostFee}`);
      console.log(`  Custo Mínimo Admin - Original: ${pixFields.nonCardPixMinimumCostFeeAdmin}, Processado: ${nonCardPixData.nonCardPixMinimumCostFeeAdmin}, Tipo: ${typeof nonCardPixData.nonCardPixMinimumCostFeeAdmin}`);
      console.log(`  Custo Mínimo Dock - Original: ${pixFields.nonCardPixMinimumCostFeeDock}, Processado: ${nonCardPixData.nonCardPixMinimumCostFeeDock}, Tipo: ${typeof nonCardPixData.nonCardPixMinimumCostFeeDock}`);
      console.log(`  Custo Máximo - Original: ${pixFields.nonCardPixCeilingFee}, Processado: ${nonCardPixData.nonCardPixCeilingFee}, Tipo: ${typeof nonCardPixData.nonCardPixCeilingFee}`);
      console.log(`  Custo Máximo Admin - Original: ${pixFields.nonCardPixCeilingFeeAdmin}, Processado: ${nonCardPixData.nonCardPixCeilingFeeAdmin}, Tipo: ${typeof nonCardPixData.nonCardPixCeilingFeeAdmin}`);
      console.log(`  Custo Máximo Dock - Original: ${pixFields.nonCardPixCeilingFeeDock}, Processado: ${nonCardPixData.nonCardPixCeilingFeeDock}, Tipo: ${typeof nonCardPixData.nonCardPixCeilingFeeDock}`);
      
      console.log("PIX Pos (card):");
      console.log(`  MDR - Original: ${pixFields.cardPixMdr}, Processado: ${nonCardPixData.cardPixMdr}, Tipo: ${typeof nonCardPixData.cardPixMdr}`);
      console.log(`  MDR Admin - Original: ${pixFields.cardPixMdrAdmin}, Processado: ${nonCardPixData.cardPixMdrAdmin}, Tipo: ${typeof nonCardPixData.cardPixMdrAdmin}`);
      console.log(`  MDR Dock - Original: ${pixFields.cardPixMdrDock}, Processado: ${nonCardPixData.cardPixMdrDock}, Tipo: ${typeof nonCardPixData.cardPixMdrDock}`);
      console.log(`  Custo Mínimo - Original: ${pixFields.cardPixMinimumCostFee}, Processado: ${nonCardPixData.cardPixMinimumCostFee}, Tipo: ${typeof nonCardPixData.cardPixMinimumCostFee}`);
      console.log(`  Custo Mínimo Admin - Original: ${pixFields.cardPixMinimumCostFeeAdmin}, Processado: ${nonCardPixData.cardPixMinimumCostFeeAdmin}, Tipo: ${typeof nonCardPixData.cardPixMinimumCostFeeAdmin}`);
      console.log(`  Custo Mínimo Dock - Original: ${pixFields.cardPixMinimumCostFeeDock}, Processado: ${nonCardPixData.cardPixMinimumCostFeeDock}, Tipo: ${typeof nonCardPixData.cardPixMinimumCostFeeDock}`);
      console.log(`  Custo Máximo - Original: ${pixFields.cardPixCeilingFee}, Processado: ${nonCardPixData.cardPixCeilingFee}, Tipo: ${typeof nonCardPixData.cardPixCeilingFee}`);
      console.log(`  Custo Máximo Admin - Original: ${pixFields.cardPixCeilingFeeAdmin}, Processado: ${nonCardPixData.cardPixCeilingFeeAdmin}, Tipo: ${typeof nonCardPixData.cardPixCeilingFeeAdmin}`);
      console.log(`  Custo Máximo Dock - Original: ${pixFields.cardPixCeilingFeeDock}, Processado: ${nonCardPixData.cardPixCeilingFeeDock}, Tipo: ${typeof nonCardPixData.cardPixCeilingFeeDock}`);
      
      console.log("Enviando dados para API:");
      console.log("Status: REVIEWED");
      console.log("Dados JSON completo:", JSON.stringify(simplifiedBrands, null, 2));
      console.log("Dados PIX:", JSON.stringify(nonCardPixData, null, 2));
      
      // Enviar todos os tipos de produtos
      const result = await updateSolicitationFeeBrandsWithTaxes(
        idsolicitationFee, 
        "REVIEWED", 
        simplifiedBrands,
        nonCardPixData // Passar os dados PIX para a API
      );
      
      console.log("Resposta da API recebida:", result);
      
      if (result && result.success) {
        toast.success("Taxas atualizadas com sucesso!");
        
        // Forçar recarregamento da página para obter os dados atualizados
        console.log("Recarregando a página para exibir os dados atualizados...");
        setTimeout(() => {
          window.location.reload();
        }, 1000); // Dar tempo para o toast ser exibido
        return; // Interromper execução para evitar exibição de toast duplicado
      }
      
      toast.success("Taxas atualizadas com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar taxas:", error);
      toast.error("Erro ao atualizar taxas: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setSubmitting(false);
      console.log("===== FINALIZADO ENVIO DOS DADOS =====");
    }
  };

  // Função auxiliar para converter valores de string para número
  const parseNumericValue = (value: string | number | undefined): number => {
    console.log("Convertendo valor numérico:", value, typeof value);
    
    if (value === undefined || value === null || value === "") return 0;
    
    // Se já for um número, retorna diretamente
    if (typeof value === 'number') {
      console.log("  Valor já é número:", value);
      return value;
    }
    
    // Remove o símbolo de percentagem e espaços
    let stringValue = String(value).replace(/%/g, "").trim();
    console.log("  Valor após remover % e espaços:", stringValue);
    
    // Verifica se o valor é uma string vazia após limpeza
    if (stringValue === "") return 0;
    
    // Substitui vírgula por ponto para formato numérico
    stringValue = stringValue.replace(/,/g, ".");
    console.log("  Valor após substituir vírgula por ponto:", stringValue);
    
    // Converte para número
    const numericValue = parseFloat(stringValue);
    console.log("  Valor numérico convertido:", numericValue);
    
    // Retorna 0 se for NaN, caso contrário retorna o valor
    if (isNaN(numericValue)) {
      console.log("  Valor inválido (NaN), retornando 0");
      return 0;
    }
    
    return numericValue;
  };

  // Função auxiliar específica para extrair valores no-card de forma segura
  const getNoCardValue = (
    product: {
      noCardFee?: string | number | null;
      noCardFeeAdmin?: string | number | null;
      noCardFeeDock?: string | number | null;
      [key: string]: unknown;
    }, 
    field: 'noCardFee' | 'noCardFeeAdmin' | 'noCardFeeDock'
  ) => {
    if (!product) return '';
    
    // Se o valor for null, undefined ou vazio, retornar string vazia
    const value = product[field];
    if (value === null || value === undefined || value === '') return '';
    
    // Se for um número, retornar como string formatada
    if (typeof value === 'number') {
      return value.toString();
    }
    
    // Se for string, retornar diretamente
    return value;
  };

  const noFocusStyle: CSSProperties = {
    outline: "none",
    boxShadow: "none",
    border: "none",
  };
  
  // Custom percentage input component
  function PercentageInput({
    value,
    onChange,
    placeholder,
    className,
    disabled,
  }: {
    value: string | number;
    onChange: (value: string) => void;
    placeholder: string;
    className?: string;
    disabled?: boolean;
  }) {
    // Log para depuração
    console.log(`PercentageInput recebeu: ${value} (${typeof value})`);
    
    // Handle the input change and append % if needed
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;
  
      // Remove any % symbol if present
      newValue = newValue.replace(/%/g, "");
  
      // Only allow numbers and a single decimal point
      newValue = newValue.replace(/[^\d.,]/g, "");
  
      // Replace dots with commas for decimal separator
      newValue = newValue.replace(/\./g, ",");
  
      // Ensure only one decimal separator
      const parts = newValue.split(",");
      if (parts.length > 2) {
        newValue = parts[0] + "," + parts.slice(1).join("");
      }
  
      onChange(newValue);
    };
    
    // Formatar valor para exibição
    let displayValue = "";
    if (value !== undefined && value !== null) {
      // Converter para string se ainda não for
      const stringValue = typeof value === 'string' ? value : String(value);
      
      // Remove o símbolo % se já existir para evitar duplicação
      const cleanValue = stringValue.replace(/%/g, "").trim();
      
      // Adicionar % apenas se o valor não estiver vazio
      displayValue = cleanValue ? `${cleanValue}%` : "";
      
      // Log para depuração do valor final
      console.log(`Exibindo: ${displayValue}`);
    }
  
    return (
      <div className="relative w-full">
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={className}
          style={noFocusStyle}
          disabled={disabled}
        />
      </div>
    );
  }

  // Função utilitária para calcular diferença entre dois valores
  const calcDiff = (a: string | number | undefined, b: string | number | undefined) => {
    const nA = parseFloat(String(a ?? '').replace(',', '.'));
    const nB = parseFloat(String(b ?? '').replace(',', '.'));
    if (isNaN(nA) || isNaN(nB)) return '';
    const diff = nA - nB;
    return diff.toFixed(2).replace('.', ',') + '%';
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Tabelas de taxas e seções de PIX com scroll horizontal próprio */}
      <div className="w-full max-w-full space-y-6 sm:space-y-8">
        {/* Tabela Taxa POS */}
        <div className="w-full max-w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="min-w-0">
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 border border-border flex-shrink-0"></div>
                <span className="text-sm text-muted-foreground">Taxa Dock</span>
              </div>
             
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 border border-border flex-shrink-0"></div>
                <span className="text-sm text-muted-foreground">Taxa Admin (Outbank)</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-border flex-shrink-0"></div>
                <span className="text-sm text-muted-foreground">Taxa Solicitada (ISO)</span>
              </div>
            </div>
            
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Taxa no Pos</h3>
            <div className="border rounded-lg overflow-hidden bg-card">
              <Table className="w-full min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-card border-r min-w-[120px] whitespace-nowrap">
                  Bandeiras
                </TableHead>
                {SolicitationFeeProductTypeList.map((type, index) => (
                  <React.Fragment key={`header-${type.value}-${index}`}>
                    <TableHead className="text-center min-w-[100px] text-sm">{type.label}</TableHead>
                    {/* Diferença feeDock - feeAdmin */}
                    <TableHead className="text-center min-w-[40px] text-[9px] font-bold"></TableHead>
                    <TableHead className="text-center min-w-[100px] text-sm">{type.label}</TableHead>
                    {/* Diferença feeAdmin - fee */}
                    <TableHead className="text-center min-w-[40px] text-[9px] font-bold"></TableHead>
                    <TableHead className="text-center min-w-[100px] text-sm">{type.label}</TableHead>
                  </React.Fragment>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {brandList.map((brand, brandIndex) => (
                <TableRow key={`brand-${brand.value}-${brandIndex}`}>
                  <TableCell className="font-medium sticky left-0 z-10 bg-card border-r min-w-[120px]">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <CardLogo cardName={brand.value} width={40} height={24} />
                      {brand.label}
                    </div>
                  </TableCell>
                  {SolicitationFeeProductTypeList.map((type, typeIndex) => {
                    // Limpar possíveis espaços extras no valor do tipo
                    const cleanTypeValue = type.value.trim();
                    
                    // Encontrar o índice correto do produto
                    const productIndex = formData.solicitationFee.solicitationFeeBrands[brandIndex]?.
                      solicitationBrandProductTypes.findIndex(product => {
                        const productType = product?.productType?.trim() || '';
                        const matchingType = productType === cleanTypeValue;
                        const matchingInterval = 
                          String(product?.transactionFeeStart) === type.transactionFeeStart && 
                          String(product?.transactionFeeEnd) === type.transactionFeeEnd;
                        return matchingType && matchingInterval;
                      });
                    
                    const actualIndex = productIndex !== -1 ? productIndex : typeIndex;
                    const currentProduct = formData.solicitationFee.solicitationFeeBrands[brandIndex]?.
                      solicitationBrandProductTypes[actualIndex];
                    
                    // Debug log para verificar os valores que estão sendo exibidos
                    console.log(`Exibindo produto POS: ${brand.label}-${type.label}`, {
                      productType: currentProduct?.productType,
                      fee: currentProduct?.fee,
                      feeAdmin: currentProduct?.feeAdmin, 
                      feeDock: currentProduct?.feeDock
                    });
                    
                    // Converter valores para garantir tipos corretos
                    const feeValue = currentProduct?.fee !== undefined && currentProduct.fee !== null 
                      ? String(currentProduct.fee) 
                      : "";
                      
                    const feeAdminValue = currentProduct?.feeAdmin !== undefined && currentProduct.feeAdmin !== null 
                      ? String(currentProduct.feeAdmin) 
                      : "";
                      
                    const feeDockValue = currentProduct?.feeDock !== undefined && currentProduct.feeDock !== null 
                      ? String(currentProduct.feeDock) 
                      : "";
                    
                    return (
                      <React.Fragment key={`cell-${brand.value}-${type.value}-${typeIndex}`}> 
                        {/* Taxa feeDock */}
                        <TableCell className="p-1 text-center">
                          <div className="rounded-full py-1 px-3 inline-block w-[70px] text-center bg-green-100">
                            <PercentageInput
                              value={feeDockValue}
                              onChange={(value) => updateFormValue(brandIndex, actualIndex, 'feeDock', value)}
                              placeholder="0%"
                              className="border-0 p-0 h-auto text-center w-full bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
                            />
                          </div>
                        </TableCell>
                        {/* Diferença feeDock - feeAdmin */}
                        <TableCell className="p-1 text-center align-middle font-bold text-[9px] min-w-[40px]">
                          {calcDiff(feeDockValue, feeAdminValue)}
                        </TableCell>
                        {/* Taxa feeAdmin */}
                        <TableCell className="p-1 text-center">
                          <div className="rounded-full py-1 px-3 inline-block w-[70px] text-center bg-yellow-100">
                            <PercentageInput
                              value={feeAdminValue}
                              onChange={(value) => updateFormValue(brandIndex, actualIndex, 'feeAdmin', value)}
                              placeholder="0%"
                              className="border-0 p-0 h-auto text-center w-full bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
                            />
                          </div>
                        </TableCell>
                        {/* Diferença feeAdmin - fee */}
                        <TableCell className="p-1 text-center align-middle font-bold text-[9px] min-w-[40px]">
                          {calcDiff(feeAdminValue, feeValue)}
                        </TableCell>
                        {/* Taxa fee */}
                        <TableCell className="p-1 text-center">
                          <div className="rounded-full py-1 px-3 inline-block w-[70px] text-center bg-blue-100">
                            <PercentageInput
                              value={feeValue}
                              onChange={() => {}} // Readonly
                              placeholder="0%"
                              className="border-0 p-0 h-auto text-center w-full bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
                              disabled={true}
                            />
                          </div>
                        </TableCell>
                      </React.Fragment>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
            </div>
          </div>
        </div>
        
        {/* Seção PIX POS */}
        <div className="w-full max-w-full space-y-4">
          <h3 className="text-base sm:text-lg font-semibold">PIX Pos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div>
              <h4 className="font-medium mb-2 text-sm">MDR</h4>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="rounded-full py-2 px-3 sm:px-4 bg-green-100 dark:bg-green-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <PercentageInput
                    value={formData.solicitationFee.cardPixMdrDock || ""}
                    onChange={(value) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        newData.solicitationFee.cardPixMdrDock = value;
                        setFormData(newData);
                      }
                    }}
                    placeholder="0,01%"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                  />
                </div>
                {/* Diferença Dock - Admin */}
                <div className="rounded-full py-2 px-1 bg-muted inline-block w-[35px] sm:w-[40px] min-w-[35px] sm:min-w-[40px] text-center font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                  {calcDiff(formData.solicitationFee.cardPixMdrDock ?? undefined, formData.solicitationFee.cardPixMdrAdmin ?? undefined)}
                </div>
                <div className="rounded-full py-2 px-3 sm:px-4 bg-yellow-100 dark:bg-yellow-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <PercentageInput
                    value={formData.solicitationFee.cardPixMdrAdmin || ""}
                    onChange={(value) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        newData.solicitationFee.cardPixMdrAdmin = value;
                        setFormData(newData);
                      }
                    }}
                    placeholder="0,01%"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                  />
                </div>
                {/* Diferença Admin - ISO */}
                <div className="rounded-full py-2 px-1 bg-muted inline-block w-[35px] sm:w-[40px] min-w-[35px] sm:min-w-[40px] text-center font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                  {calcDiff(formData.solicitationFee.cardPixMdrAdmin ?? undefined, formData.solicitationFee.cardPixMdr ?? undefined)}
                </div>
                <div className="rounded-full py-2 px-3 sm:px-4 bg-blue-100 dark:bg-blue-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <PercentageInput
                    value={formData.solicitationFee.cardPixMdr || ""}
                    onChange={() => {}}
                    placeholder="0,01%"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    disabled={true}
                  />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-sm">Custo Mínimo</h4>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="rounded-full py-2 px-3 sm:px-4 bg-green-100 dark:bg-green-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.cardPixMinimumCostFeeDock || ""}
                    onChange={(e) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        const value = e.target.value ? String(parseFloat(e.target.value)) : "";
                        newData.solicitationFee.cardPixMinimumCostFeeDock = value;
                        setFormData(newData);
                      }
                    }}
                  />
                </div>
                {/* Diferença Dock - Admin */}
                <div className="rounded-full py-2 px-1 bg-muted inline-block w-[35px] sm:w-[40px] min-w-[35px] sm:min-w-[40px] text-center font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                  {calcDiff(formData.solicitationFee.cardPixMinimumCostFeeDock ?? undefined, formData.solicitationFee.cardPixMinimumCostFeeAdmin ?? undefined)}
                </div>
                <div className="rounded-full py-2 px-3 sm:px-4 bg-yellow-100 dark:bg-yellow-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.cardPixMinimumCostFeeAdmin || ""}
                    onChange={(e) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        const value = e.target.value ? String(parseFloat(e.target.value)) : "";
                        newData.solicitationFee.cardPixMinimumCostFeeAdmin = value;
                        setFormData(newData);
                      }
                    }}
                  />
                </div>
                {/* Diferença Admin - ISO */}
                <div className="rounded-full py-2 px-1 bg-muted inline-block w-[35px] sm:w-[40px] min-w-[35px] sm:min-w-[40px] text-center font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                  {calcDiff(formData.solicitationFee.cardPixMinimumCostFeeAdmin ?? undefined, formData.solicitationFee.cardPixMinimumCostFee ?? undefined)}
                </div>
                <div className="rounded-full py-2 px-3 sm:px-4 bg-blue-100 dark:bg-blue-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.cardPixMinimumCostFee || ""}
                    onChange={() => {}}
                    disabled={true}
                  />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-sm">Custo Máximo</h4>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="rounded-full py-2 px-3 sm:px-4 bg-green-100 dark:bg-green-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.cardPixCeilingFeeDock || ""}
                    onChange={(e) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        const value = e.target.value ? String(parseFloat(e.target.value)) : "";
                        newData.solicitationFee.cardPixCeilingFeeDock = value;
                        setFormData(newData);
                      }
                    }}
                  />
                </div>
                {/* Diferença Dock - Admin */}
                <div className="rounded-full py-2 px-1 bg-muted inline-block w-[35px] sm:w-[40px] min-w-[35px] sm:min-w-[40px] text-center font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                  {calcDiff(formData.solicitationFee.cardPixCeilingFeeDock ?? undefined, formData.solicitationFee.cardPixCeilingFeeAdmin ?? undefined)}
                </div>
                <div className="rounded-full py-2 px-3 sm:px-4 bg-yellow-100 dark:bg-yellow-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.cardPixCeilingFeeAdmin || ""}
                    onChange={(e) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        const value = e.target.value ? String(parseFloat(e.target.value)) : "";
                        newData.solicitationFee.cardPixCeilingFeeAdmin = value;
                        setFormData(newData);
                      }
                    }}
                  />
                </div>
                {/* Diferença Admin - ISO */}
                <div className="rounded-full py-2 px-1 bg-muted inline-block w-[35px] sm:w-[40px] min-w-[35px] sm:min-w-[40px] text-center font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                  {calcDiff(formData.solicitationFee.cardPixCeilingFeeAdmin ?? undefined, formData.solicitationFee.cardPixCeilingFee ?? undefined)}
                </div>
                <div className="rounded-full py-2 px-3 sm:px-4 bg-blue-100 dark:bg-blue-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.cardPixCeilingFee || ""}
                    onChange={() => {}}
                    disabled={true}
                  />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-sm">Antecipação</h4>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="rounded-full py-2 px-3 sm:px-4 bg-green-100 dark:bg-green-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <PercentageInput
                    value={formData.solicitationFee.eventualAnticipationFeeDock || ""}
                    onChange={(value) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        newData.solicitationFee.eventualAnticipationFeeDock = value;
                        setFormData(newData);
                      }
                    }}
                    placeholder="1,67%"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                  />
                </div>
                {/* Diferença Dock - Admin */}
                <div className="rounded-full py-2 px-1 bg-muted inline-block w-[35px] sm:w-[40px] min-w-[35px] sm:min-w-[40px] text-center font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                  {calcDiff(formData.solicitationFee.eventualAnticipationFeeDock ?? undefined, formData.solicitationFee.eventualAnticipationFeeAdmin ?? undefined)}
                </div>
                <div className="rounded-full py-2 px-3 sm:px-4 bg-yellow-100 dark:bg-yellow-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <PercentageInput
                    value={formData.solicitationFee.eventualAnticipationFeeAdmin || ""}
                    onChange={(value) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        newData.solicitationFee.eventualAnticipationFeeAdmin = value;
                        setFormData(newData);
                      }
                    }}
                    placeholder="1,67%"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                  />
                </div>
                {/* Diferença Admin - ISO */}
                <div className="rounded-full py-2 px-1 bg-muted inline-block w-[35px] sm:w-[40px] min-w-[35px] sm:min-w-[40px] text-center font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                  {calcDiff(formData.solicitationFee.eventualAnticipationFeeAdmin ?? undefined, formData.solicitationFee.eventualAnticipationFee ?? undefined)}
                </div>
                <div className="rounded-full py-2 px-3 sm:px-4 bg-blue-100 dark:bg-blue-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <PercentageInput
                    value={formData.solicitationFee.eventualAnticipationFee || ""}
                    onChange={() => {}}
                    placeholder="1,67%"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    disabled={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela Taxa Online */}
        <div className="w-full max-w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mt-8 sm:mt-12">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Taxa Online</h3>
            <div className="border rounded-lg overflow-hidden bg-card">
              <Table className="w-full min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-10 bg-card border-r min-w-[120px] whitespace-nowrap">
                      Bandeiras
                    </TableHead>
                {SolicitationFeeProductTypeList.map((type, index) => (
                  <React.Fragment key={`noncard-header-${type.value}-${index}`}>
                    <TableHead className="text-center min-w-[100px] text-sm">{type.label}</TableHead>
                    {/* Diferença noCardFeeDock - noCardFeeAdmin */}
                    <TableHead className="text-center min-w-[40px] text-[9px] font-bold"></TableHead>
                    <TableHead className="text-center min-w-[100px] text-sm">{type.label}</TableHead>
                    {/* Diferença noCardFeeAdmin - noCardFee */}
                    <TableHead className="text-center min-w-[40px] text-[9px] font-bold"></TableHead>
                    <TableHead className="text-center min-w-[100px] text-sm">{type.label}</TableHead>
                  </React.Fragment>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {brandList.map((brand, brandIndex) => (
                <TableRow key={`noncard-brand-${brand.value}-${brandIndex}`}>
                  <TableCell className="font-medium sticky left-0 z-10 bg-card border-r min-w-[120px]">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <CardLogo cardName={brand.value} width={40} height={24} />
                      {brand.label}
                    </div>
                  </TableCell>
                  {SolicitationFeeProductTypeList.map((type, typeIndex) => {
                    // Limpar possíveis espaços extras no valor do tipo
                    const cleanTypeValue = type.value.trim();
                    
                    // Encontrar o índice correto do produto
                    const productIndex = formData.solicitationFee.solicitationFeeBrands[brandIndex]?.
                      solicitationBrandProductTypes.findIndex(product => {
                        const productType = product?.productType?.trim() || '';
                        const matchingType = productType === cleanTypeValue;
                        const matchingInterval = 
                          String(product?.transactionFeeStart) === type.transactionFeeStart && 
                          String(product?.transactionFeeEnd) === type.transactionFeeEnd;
                        return matchingType && matchingInterval;
                      });
                    
                    const actualIndex = productIndex !== -1 ? productIndex : typeIndex;
                    const currentProduct = formData.solicitationFee.solicitationFeeBrands[brandIndex]?.
                      solicitationBrandProductTypes[actualIndex];
                    
                    // Verificar se temos um produto válido antes de tentar acessar suas propriedades
                    if (!currentProduct) {
                      return null;
                    }
                    
                    // Log de depuração temporário
                    console.log(`Valores para tabela Online - ${brand.label} - ${type.label}:`, {
                      noCardFee: currentProduct.noCardFee,
                      noCardFeeAdmin: currentProduct.noCardFeeAdmin, 
                      noCardFeeDock: currentProduct.noCardFeeDock
                    });
                    
                    // Garantir que os valores noCardFee sejam strings não vazias
                    const noCardFeeValue = getNoCardValue(currentProduct, 'noCardFee');
                    const noCardFeeAdminValue = getNoCardValue(currentProduct, 'noCardFeeAdmin');
                    const noCardFeeDockValue = getNoCardValue(currentProduct, 'noCardFeeDock');
                    
                    return (
                      <React.Fragment key={`noncard-cell-${brand.value}-${type.value}-${typeIndex}`}> 
                        {/* Taxa noCardFeeDock */}
                        <TableCell className="p-1 text-center">
                          <div className="rounded-full py-1 px-3 inline-block w-[70px] text-center bg-green-100">
                            <PercentageInput
                              value={noCardFeeDockValue}
                              onChange={(value) => updateFormValue(brandIndex, actualIndex, 'noCardFeeDock', value)}
                              placeholder="0%"
                              className="border-0 p-0 h-auto text-center w-full bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
                            />
                          </div>
                        </TableCell>
                        {/* Diferença noCardFeeDock - noCardFeeAdmin */}
                        <TableCell className="p-1 text-center align-middle font-bold text-[9px] min-w-[40px]">
                          {calcDiff(noCardFeeDockValue, noCardFeeAdminValue)}
                        </TableCell>
                        {/* Taxa noCardFeeAdmin */}
                        <TableCell className="p-1 text-center">
                          <div className="rounded-full py-1 px-3 inline-block w-[70px] text-center bg-yellow-100">
                            <PercentageInput
                              value={noCardFeeAdminValue}
                              onChange={(value) => updateFormValue(brandIndex, actualIndex, 'noCardFeeAdmin', value)}
                              placeholder="0%"
                              className="border-0 p-0 h-auto text-center w-full bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
                            />
                          </div>
                        </TableCell>
                        {/* Diferença noCardFeeAdmin - noCardFee */}
                        <TableCell className="p-1 text-center align-middle font-bold text-[9px] min-w-[40px]">
                          {calcDiff(noCardFeeAdminValue, noCardFeeValue)}
                        </TableCell>
                        {/* Taxa noCardFee */}
                        <TableCell className="p-1 text-center">
                          <div className="rounded-full py-1 px-3 inline-block w-[70px] text-center bg-blue-100">
                            <PercentageInput
                              value={noCardFeeValue}
                              onChange={() => {}} // Readonly
                              placeholder="0%"
                              className="border-0 p-0 h-auto text-center w-full bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
                              disabled={true}
                            />
                          </div>
                        </TableCell>
                      </React.Fragment>
                    );
                  })}
                </TableRow>
              ))}
              </TableBody>
            </Table>
            </div>
          </div>
        </div>

        {/* Seção PIX Online */}
        <div className="w-full max-w-full space-y-4">
          <h3 className="text-base sm:text-lg font-semibold">PIX Online</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div>
              <h4 className="font-medium mb-2 text-sm">MDR</h4>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="rounded-full py-2 px-3 sm:px-4 bg-green-100 dark:bg-green-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <PercentageInput
                    value={formData.solicitationFee.nonCardPixMdrDock || ""}
                    onChange={(value) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        newData.solicitationFee.nonCardPixMdrDock = value;
                        setFormData(newData);
                      }
                    }}
                    placeholder="0,01%"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                  />
                </div>
                {/* Diferença Dock - Admin */}
                <div className="rounded-full py-2 px-1 bg-muted inline-block w-[35px] sm:w-[40px] min-w-[35px] sm:min-w-[40px] text-center font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                  {calcDiff(formData.solicitationFee.nonCardPixMdrDock ?? undefined, formData.solicitationFee.nonCardPixMdrAdmin ?? undefined)}
                </div>
                <div className="rounded-full py-2 px-3 sm:px-4 bg-yellow-100 dark:bg-yellow-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <PercentageInput
                    value={formData.solicitationFee.nonCardPixMdrAdmin || ""}
                    onChange={(value) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        newData.solicitationFee.nonCardPixMdrAdmin = value;
                        setFormData(newData);
                      }
                    }}
                    placeholder="0,01%"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                  />
                </div>
                {/* Diferença Admin - ISO */}
                <div className="rounded-full py-2 px-1 bg-muted inline-block w-[35px] sm:w-[40px] min-w-[35px] sm:min-w-[40px] text-center font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                  {calcDiff(formData.solicitationFee.nonCardPixMdrAdmin ?? undefined, formData.solicitationFee.nonCardPixMdr ?? undefined)}
                </div>
                <div className="rounded-full py-2 px-3 sm:px-4 bg-blue-100 dark:bg-blue-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <PercentageInput
                    value={formData.solicitationFee.nonCardPixMdr || ""}
                    onChange={() => {}}
                    placeholder="0,01%"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    disabled={true}
                  />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-sm">Custo Mínimo</h4>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="rounded-full py-2 px-3 sm:px-4 bg-green-100 dark:bg-green-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.nonCardPixMinimumCostFeeDock || ""}
                    onChange={(e) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        const value = e.target.value ? String(parseFloat(e.target.value)) : "";
                        newData.solicitationFee.nonCardPixMinimumCostFeeDock = value;
                        setFormData(newData);
                      }
                    }}
                  />
                </div>
                {/* Diferença Dock - Admin */}
                <div className="rounded-full py-2 px-1 bg-muted inline-block w-[35px] sm:w-[40px] min-w-[35px] sm:min-w-[40px] text-center font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                  {calcDiff(formData.solicitationFee.nonCardPixMinimumCostFeeDock ?? undefined, formData.solicitationFee.nonCardPixMinimumCostFeeAdmin ?? undefined)}
                </div>
                <div className="rounded-full py-2 px-3 sm:px-4 bg-yellow-100 dark:bg-yellow-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.nonCardPixMinimumCostFeeAdmin || ""}
                    onChange={(e) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        const value = e.target.value ? String(parseFloat(e.target.value)) : "";
                        newData.solicitationFee.nonCardPixMinimumCostFeeAdmin = value;
                        setFormData(newData);
                      }
                    }}
                  />
                </div>
                {/* Diferença Admin - ISO */}
                <div className="rounded-full py-2 px-1 bg-muted inline-block w-[35px] sm:w-[40px] min-w-[35px] sm:min-w-[40px] text-center font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                  {calcDiff(formData.solicitationFee.nonCardPixMinimumCostFeeAdmin ?? undefined, formData.solicitationFee.nonCardPixMinimumCostFee ?? undefined)}
                </div>
                <div className="rounded-full py-2 px-3 sm:px-4 bg-blue-100 dark:bg-blue-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.nonCardPixMinimumCostFee || ""}
                    onChange={() => {}}
                    disabled={true}
                  />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-sm">Custo Máximo</h4>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="rounded-full py-2 px-3 sm:px-4 bg-green-100 dark:bg-green-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.nonCardPixCeilingFeeDock || ""}
                    onChange={(e) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        const value = e.target.value ? String(parseFloat(e.target.value)) : "";
                        newData.solicitationFee.nonCardPixCeilingFeeDock = value;
                        setFormData(newData);
                      }
                    }}
                  />
                </div>
                {/* Diferença Dock - Admin */}
                <div className="rounded-full py-2 px-1 bg-muted inline-block w-[35px] sm:w-[40px] min-w-[35px] sm:min-w-[40px] text-center font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                  {calcDiff(formData.solicitationFee.nonCardPixCeilingFeeDock ?? undefined, formData.solicitationFee.nonCardPixCeilingFeeAdmin ?? undefined)}
                </div>
                <div className="rounded-full py-2 px-3 sm:px-4 bg-yellow-100 dark:bg-yellow-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.nonCardPixCeilingFeeAdmin || ""}
                    onChange={(e) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        const value = e.target.value ? String(parseFloat(e.target.value)) : "";
                        newData.solicitationFee.nonCardPixCeilingFeeAdmin = value;
                        setFormData(newData);
                      }
                    }}
                  />
                </div>
                {/* Diferença Admin - ISO */}
                <div className="rounded-full py-2 px-1 bg-muted inline-block w-[35px] sm:w-[40px] min-w-[35px] sm:min-w-[40px] text-center font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                  {calcDiff(formData.solicitationFee.nonCardPixCeilingFeeAdmin ?? undefined, formData.solicitationFee.nonCardPixCeilingFee ?? undefined)}
                </div>
                <div className="rounded-full py-2 px-3 sm:px-4 bg-blue-100 dark:bg-blue-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.nonCardPixCeilingFee || ""}
                    onChange={() => {}}
                    disabled={true}
                  />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-sm">Antecipação</h4>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="rounded-full py-2 px-3 sm:px-4 bg-green-100 dark:bg-green-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <PercentageInput
                    value={formData.solicitationFee.nonCardEventualAnticipationFeeDock || ""}
                    onChange={(value) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        newData.solicitationFee.nonCardEventualAnticipationFeeDock = value;
                        setFormData(newData);
                      }
                    }}
                    placeholder="1,67%"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                  />
                </div>
                {/* Diferença Dock - Admin */}
                <div className="rounded-full py-2 px-1 bg-muted inline-block w-[35px] sm:w-[40px] min-w-[35px] sm:min-w-[40px] text-center font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                  {calcDiff(formData.solicitationFee.nonCardEventualAnticipationFeeDock ?? undefined, formData.solicitationFee.nonCardEventualAnticipationFeeAdmin ?? undefined)}
                </div>
                <div className="rounded-full py-2 px-3 sm:px-4 bg-yellow-100 dark:bg-yellow-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <PercentageInput
                    value={formData.solicitationFee.nonCardEventualAnticipationFeeAdmin || ""}
                    onChange={(value) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        newData.solicitationFee.nonCardEventualAnticipationFeeAdmin = value;
                        setFormData(newData);
                      }
                    }}
                    placeholder="1,67%"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                  />
                </div>
                {/* Diferença Admin - ISO */}
                <div className="rounded-full py-2 px-1 bg-muted inline-block w-[35px] sm:w-[40px] min-w-[35px] sm:min-w-[40px] text-center font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                  {calcDiff(formData.solicitationFee.nonCardEventualAnticipationFeeAdmin ?? undefined, formData.solicitationFee.nonCardEventualAnticipationFee ?? undefined)}
                </div>
                <div className="rounded-full py-2 px-3 sm:px-4 bg-blue-100 dark:bg-blue-900/30 inline-block min-w-[90px] sm:w-[110px] flex-shrink-0">
                  <PercentageInput
                    value={formData.solicitationFee.nonCardEventualAnticipationFee || ""}
                    onChange={() => {}}
                    placeholder="1,67%"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    disabled={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Botão Enviar */}
        <div className="mt-6 sm:mt-8 flex justify-end w-full">
          <Button 
            type="button" 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md min-w-[120px]"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
                

