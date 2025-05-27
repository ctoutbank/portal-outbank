"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { brandList, SolicitationFeeProductTypeList } from "@/lib/lookuptables/lookuptables-tax";
import { getCardImage } from "@/utils/actions";
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
          (p: any) => {
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

    // Importante: manter todos os valores originais da solicitação
    return {
      solicitationFee: {
        ...solicitationFeetax?.solicitationFee,
        solicitationFeeBrands
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

      // Adicionar campos nonCardPix da solicitação
      const nonCardPixData = {
        nonCardPixMdr: parseNumericValue(formData.solicitationFee.nonCardPixMdr || 0),
        nonCardPixCeilingFee: parseNumericValue(formData.solicitationFee.nonCardPixCeilingFee || 0),
        nonCardPixMinimumCostFee: parseNumericValue(formData.solicitationFee.nonCardPixMinimumCostFee || 0),
        // Adicionar campos Admin e Dock para nonCardPix
        nonCardPixMdrAdmin: parseNumericValue(formData.solicitationFee.nonCardPixMdrAdmin || 0),
        nonCardPixCeilingFeeAdmin: parseNumericValue(formData.solicitationFee.nonCardPixCeilingFeeAdmin || 0),
        nonCardPixMinimumCostFeeAdmin: parseNumericValue(formData.solicitationFee.nonCardPixMinimumCostFeeAdmin || 0),
        nonCardPixMdrDock: parseNumericValue(formData.solicitationFee.nonCardPixMdrDock || 0),
        nonCardPixCeilingFeeDock: parseNumericValue(formData.solicitationFee.nonCardPixCeilingFeeDock || 0),
        nonCardPixMinimumCostFeeDock: parseNumericValue(formData.solicitationFee.nonCardPixMinimumCostFeeDock || 0),
        // Incluir campos do PIX Pos também
        cardPixMdr: parseNumericValue(formData.solicitationFee.cardPixMdr || 0),
        cardPixCeilingFee: parseNumericValue(formData.solicitationFee.cardPixCeilingFee || 0),
        cardPixMinimumCostFee: parseNumericValue(formData.solicitationFee.cardPixMinimumCostFee || 0),
        // Adicionar campos Admin e Dock para cardPix
        cardPixMdrAdmin: parseNumericValue(formData.solicitationFee.cardPixMdrAdmin || 0),
        cardPixCeilingFeeAdmin: parseNumericValue(formData.solicitationFee.cardPixCeilingFeeAdmin || 0),
        cardPixMinimumCostFeeAdmin: parseNumericValue(formData.solicitationFee.cardPixMinimumCostFeeAdmin || 0),
        cardPixMdrDock: parseNumericValue(formData.solicitationFee.cardPixMdrDock || 0),
        cardPixCeilingFeeDock: parseNumericValue(formData.solicitationFee.cardPixCeilingFeeDock || 0),
        cardPixMinimumCostFeeDock: parseNumericValue(formData.solicitationFee.cardPixMinimumCostFeeDock || 0),
        // Incluir também o campo de antecipação
        eventualAnticipationFee: parseNumericValue(formData.solicitationFee.eventualAnticipationFee || 0),
        eventualAnticipationFeeAdmin: parseNumericValue(formData.solicitationFee.eventualAnticipationFeeAdmin || 0),
        eventualAnticipationFeeDock: parseNumericValue(formData.solicitationFee.eventualAnticipationFeeDock || 0),
        nonCardEventualAnticipationFee: parseNumericValue(formData.solicitationFee.nonCardEventualAnticipationFee || 0),
        nonCardEventualAnticipationFeeAdmin: parseNumericValue(formData.solicitationFee.nonCardEventualAnticipationFeeAdmin || 0),
        nonCardEventualAnticipationFeeDock: parseNumericValue(formData.solicitationFee.nonCardEventualAnticipationFeeDock || 0)
      };

      console.log("Enviando dados para API:");
      console.log("Status: REVIEWED");
      console.log("Dados JSON completo:", JSON.stringify(simplifiedBrands, null, 2));
      console.log("Dados PIX:", JSON.stringify(nonCardPixData, null, 2));
      
      // Enviar todos os tipos de produtos
      await updateSolicitationFeeBrandsWithTaxes(
        idsolicitationFee, 
        "REVIEWED", 
        simplifiedBrands,
        nonCardPixData // Passar os dados PIX para a API
      );
      
      console.log("Resposta da API recebida com sucesso");
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
  const getNoCardValue = (product: any, field: 'noCardFee' | 'noCardFeeAdmin' | 'noCardFeeDock') => {
    if (!product) return '';
    
    const rawValue = product[field];
    
    // Se for null, undefined ou uma string vazia
    if (rawValue === null || rawValue === undefined || String(rawValue).trim() === '') {
      return '';
    }
    
    // Converter para string, independente do tipo original
    return String(rawValue);
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

  return (
    <div>
      <div className="w-full overflow-x-auto">
        {/* Legenda para cores de inputs */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-100"></div>
            <span className="text-sm text-gray-600">Taxa Solicitada (fee)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-100"></div>
            <span className="text-sm text-gray-600">Taxa Admin (feeAdmin)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-100"></div>
            <span className="text-sm text-gray-600">Taxa Dock (feeDock)</span>
          </div>
        </div>
        
        <h3 className="text-lg font-medium mb-4">Taxa no Pos</h3>
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 bg-white">
                Bandeiras
              </TableHead>
              {SolicitationFeeProductTypeList.map((type, index) => (
                <React.Fragment key={`header-${type.value}-${index}`}>
                  <TableHead
                    className="text-center min-w-[100px] text-sm"
                  >
                    {type.label}
                  </TableHead>
                  <TableHead
                    className="text-center min-w-[100px] text-sm"
                  >
                    {type.label}
                  </TableHead>
                  <TableHead
                    className="text-center min-w-[100px] text-sm"
                  >
                    {type.label}
                  </TableHead>
                </React.Fragment>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {brandList.map((brand, brandIndex) => (
              <TableRow key={`brand-${brand.value}-${brandIndex}`}>
                <TableCell className="font-medium sticky left-0 z-10 bg-white">
                  <div className="flex items-center gap-2">
                    {getCardImage(brand.value) && (
                      <img
                        src={getCardImage(brand.value)}
                        alt={brand.label}
                        width={40}
                        height={24}
                        className="object-contain"
                      />
                    )}
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
                    </React.Fragment>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
            {/* PIX Fees Section */}
            <div className="mt-12 mb-6">
          <h3 className="text-lg font-medium mb-4">PIX Pos</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h4 className="font-medium mb-2">MDR</h4>
              <div className="flex gap-2">
                <div className="rounded-full py-2 px-4 bg-blue-100 inline-block w-[110px]">
                  <PercentageInput
                    value={formData.solicitationFee.cardPixMdr || ""}
                    onChange={() => {}} // Readonly
                    placeholder="0,01%"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    disabled={true}
                  />
                </div>
                <div className="rounded-full py-2 px-4 bg-yellow-100 inline-block w-[110px]">
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
                <div className="rounded-full py-2 px-4 bg-green-100 inline-block w-[110px]">
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
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Custo Mínimo</h4>
              <div className="flex gap-2">
                <div className="rounded-full py-2 px-4 bg-blue-100 inline-block w-[110px]">
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
                <div className="rounded-full py-2 px-4 bg-yellow-100 inline-block w-[110px]">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.cardPixMinimumCostFeeAdmin || ""}
                    onChange={(e) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        newData.solicitationFee.cardPixMinimumCostFeeAdmin = e.target.value;
                        setFormData(newData);
                      }
                    }}
                  />
                </div>
                <div className="rounded-full py-2 px-4 bg-green-100 inline-block w-[110px]">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.cardPixMinimumCostFeeDock || ""}
                    onChange={(e) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        newData.solicitationFee.cardPixMinimumCostFeeDock = e.target.value;
                        setFormData(newData);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Custo Máximo</h4>
              <div className="flex gap-2">
                <div className="rounded-full py-2 px-4 bg-blue-100 inline-block w-[110px]">
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
                <div className="rounded-full py-2 px-4 bg-yellow-100 inline-block w-[110px]">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.cardPixCeilingFeeAdmin || ""}
                    onChange={(e) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        newData.solicitationFee.cardPixCeilingFeeAdmin = e.target.value;
                        setFormData(newData);
                      }
                    }}
                  />
                </div>
                <div className="rounded-full py-2 px-4 bg-green-100 inline-block w-[110px]">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.cardPixCeilingFeeDock || ""}
                    onChange={(e) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        newData.solicitationFee.cardPixCeilingFeeDock = e.target.value;
                        setFormData(newData);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Antecipação</h4>
              <div className="flex gap-2">
                <div className="rounded-full py-2 px-4 bg-blue-100 inline-block w-[110px]">
                  <PercentageInput
                    value={formData.solicitationFee.eventualAnticipationFee || ""}
                    onChange={() => {}}
                    placeholder="1,67%"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    disabled={true}
                  />
                </div>
                <div className="rounded-full py-2 px-4 bg-yellow-100 inline-block w-[110px]">
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
                <div className="rounded-full py-2 px-4 bg-green-100 inline-block w-[110px]">
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
              </div>
            </div>
          </div>
        </div>

        {/* Tabela NonCard */}
        <h3 className="text-lg font-medium mt-12 mb-4">Taxa Online</h3>
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 bg-white">
                Bandeiras
              </TableHead>
              {SolicitationFeeProductTypeList.map((type, index) => (
                <React.Fragment key={`noncard-header-${type.value}-${index}`}>
                  <TableHead
                    className="text-center min-w-[100px] text-sm"
                  >
                    {type.label}
                  </TableHead>
                  <TableHead
                    className="text-center min-w-[100px] text-sm"
                  >
                    {type.label}
                  </TableHead>
                  <TableHead
                    className="text-center min-w-[100px] text-sm"
                  >
                    {type.label}
                  </TableHead>
                </React.Fragment>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {brandList.map((brand, brandIndex) => (
              <TableRow key={`noncard-brand-${brand.value}-${brandIndex}`}>
                <TableCell className="font-medium sticky left-0 z-10 bg-white">
                  <div className="flex items-center gap-2">
                    {getCardImage(brand.value) && (
                      <img
                        src={getCardImage(brand.value)}
                        alt={brand.label}
                        width={40}
                        height={24}
                        className="object-contain"
                      />
                    )}
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
                    </React.Fragment>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>

    
        
        {/* PIX Online Fees Section */}
        <div className="mt-12 mb-6">
          <h3 className="text-lg font-medium mb-4">PIX Online</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h4 className="font-medium mb-2">MDR</h4>
              <div className="flex gap-2">
                <div className="rounded-full py-2 px-4 bg-blue-100 inline-block w-[110px]">
                  <PercentageInput
                    value={formData.solicitationFee.nonCardPixMdr || ""}
                    onChange={() => {}} // Readonly
                    placeholder="0,01%"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    disabled={true}
                  />
                </div>
                <div className="rounded-full py-2 px-4 bg-yellow-100 inline-block w-[110px]">
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
                <div className="rounded-full py-2 px-4 bg-green-100 inline-block w-[110px]">
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
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Custo Mínimo</h4>
              <div className="flex gap-2">
                <div className="rounded-full py-2 px-4 bg-blue-100 inline-block w-[110px]">
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
                <div className="rounded-full py-2 px-4 bg-yellow-100 inline-block w-[110px]">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.nonCardPixMinimumCostFeeAdmin || ""}
                    onChange={(e) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        newData.solicitationFee.nonCardPixMinimumCostFeeAdmin = e.target.value;
                        setFormData(newData);
                      }
                    }}
                  />
                </div>
                <div className="rounded-full py-2 px-4 bg-green-100 inline-block w-[110px]">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.nonCardPixMinimumCostFeeDock || ""}
                    onChange={(e) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        newData.solicitationFee.nonCardPixMinimumCostFeeDock = e.target.value;
                        setFormData(newData);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Custo Máximo</h4>
              <div className="flex gap-2">
                <div className="rounded-full py-2 px-4 bg-blue-100 inline-block w-[110px]">
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
                <div className="rounded-full py-2 px-4 bg-yellow-100 inline-block w-[110px]">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.nonCardPixCeilingFeeAdmin || ""}
                    onChange={(e) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        newData.solicitationFee.nonCardPixCeilingFeeAdmin = e.target.value;
                        setFormData(newData);
                      }
                    }}
                  />
                </div>
                <div className="rounded-full py-2 px-4 bg-green-100 inline-block w-[110px]">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0.09"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    value={formData.solicitationFee.nonCardPixCeilingFeeDock || ""}
                    onChange={(e) => {
                      const newData = { ...formData };
                      if (newData.solicitationFee) {
                        newData.solicitationFee.nonCardPixCeilingFeeDock = e.target.value;
                        setFormData(newData);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Antecipação</h4>
              <div className="flex gap-2">
                <div className="rounded-full py-2 px-4 bg-blue-100 inline-block w-[110px]">
                  <PercentageInput
                    value={formData.solicitationFee.nonCardEventualAnticipationFee || ""}
                    onChange={() => {}}
                    placeholder="1,67%"
                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 w-full text-center"
                    disabled={true}
                  />
                </div>
                <div className="rounded-full py-2 px-4 bg-yellow-100 inline-block w-[110px]">
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
                <div className="rounded-full py-2 px-4 bg-green-100 inline-block w-[110px]">
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
              </div>
            </div>
          </div>
        </div>
        
        {/* Botão Enviar */}
        <div className="mt-4 flex justify-end">
          <Button 
            type="button" 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
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
                

