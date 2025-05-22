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
    console.log("=== Iniciando inicialização do formulário ===");
    console.log("Dados recebidos do backend:", JSON.stringify(solicitationFeetax, null, 2));
    
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

      console.log(`Inicializando marca: ${brand.label} (${brand.value})`);
      if (existingBrand.solicitationBrandProductTypes?.length > 0) {
        console.log(`  Tipos de produtos encontrados para ${brand.label}:`, 
          existingBrand.solicitationBrandProductTypes.map(p => 
            `${p.productType} (${p.transactionFeeStart}-${p.transactionFeeEnd})`
          ).join(', ')
        );
      }
      
      // Garantir que existingBrand.solicitationBrandProductTypes seja um array
      if (!existingBrand.solicitationBrandProductTypes) {
        existingBrand.solicitationBrandProductTypes = [];
      }
      
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
            
            // Para facilitar debug
            if (cleanProductTypeValue.includes('INSTALLMENTS') && dbProductType && dbProductType.includes('INSTALLMENTS')) {
              console.log(`Comparando: '${cleanProductTypeValue}' com '${dbProductType}', intervalo: ${productType.transactionFeeStart}-${productType.transactionFeeEnd} vs ${p.transactionFeeStart}-${p.transactionFeeEnd}, resultado: ${matchingType && matchingInterval}`);
            }
            
            return matchingType && matchingInterval;
          }
        );

        // Se o produto não existir no banco de dados, criar um novo com dados padrão
        let newProduct;
        if (existingProduct) {
          console.log(`  - Produto: ${productType.label} (${cleanProductTypeValue}), Intervalo: ${productType.transactionFeeStart}-${productType.transactionFeeEnd}, Encontrado: SIM`);
          newProduct = existingProduct;
        } else {
          console.log(`  - Produto: ${productType.label} (${cleanProductTypeValue}), Intervalo: ${productType.transactionFeeStart}-${productType.transactionFeeEnd}, Encontrado: NÃO - Criando novo`);
          newProduct = {
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
            dtupdate: undefined
          };
          // Adicionar o novo produto ao array de existingBrand para garantir que esteja disponível para referência futura
          existingBrand.solicitationBrandProductTypes.push(newProduct);
        }
        
        return newProduct;
      });

      return {
        ...existingBrand,
        solicitationBrandProductTypes
      };
    });

    console.log("=== Inicialização concluída ===");
    console.log(`Total de marcas: ${solicitationFeeBrands.length}`);
    solicitationFeeBrands.forEach(brand => {
      console.log(`Marca ${brand.brand} - Total de produtos: ${brand.solicitationBrandProductTypes.length}`);
    });

    return {
      solicitationFee: {
        id: solicitationFeetax?.solicitationFee?.id || 0,
        slug: solicitationFeetax?.solicitationFee?.slug || "",
        cnae: solicitationFeetax?.solicitationFee?.cnae || "",
        idCustomers: solicitationFeetax?.solicitationFee?.idCustomers || 0,
        mcc: solicitationFeetax?.solicitationFee?.mcc || "",
        cnpjQuantity: solicitationFeetax?.solicitationFee?.cnpjQuantity || 0,
        monthlyPosFee: solicitationFeetax?.solicitationFee?.monthlyPosFee || 0,
        averageTicket: solicitationFeetax?.solicitationFee?.averageTicket || 0,
        description: solicitationFeetax?.solicitationFee?.description || "",
        cnaeInUse: solicitationFeetax?.solicitationFee?.cnaeInUse || false,
        status: solicitationFeetax?.solicitationFee?.status || "",
        dtinsert: solicitationFeetax?.solicitationFee?.dtinsert  
          ? new Date(solicitationFeetax.solicitationFee.dtinsert)
          : undefined,
        dtupdate: solicitationFeetax?.solicitationFee?.dtupdate 
          ? new Date(solicitationFeetax.solicitationFee.dtupdate)
          : undefined,
        solicitationFeeBrands
      }
    };
  };

  // Inicializar os valores do formulário sem o hook useForm
  const [formData, setFormData] = React.useState(() => initializeFormValues());
  const [submitting, setSubmitting] = React.useState(false);
  
  // Função para atualizar valores específicos no formulário
  const updateFormValue = (brandIndex: number, productIndex: number, field: 'feeAdmin' | 'feeDock', value: string) => {
    setFormData(prevData => {
      const newData = { ...prevData };
      if (newData.solicitationFee?.solicitationFeeBrands?.[brandIndex]?.solicitationBrandProductTypes?.[productIndex]) {
        newData.solicitationFee.solicitationFeeBrands[brandIndex].solicitationBrandProductTypes[productIndex][field] = value;
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
            
            console.log(`  Produto: ${type.productType || ""}`);
            console.log(`    fee: ${fee} (original: ${type.fee})`);
            console.log(`    feeAdmin: ${feeAdmin} (original: ${type.feeAdmin})`);
            console.log(`    feeDock: ${feeDock} (original: ${type.feeDock})`);
            console.log(`    transactionFeeStart: ${parseInt(String(type.transactionFeeStart) || "0")}`);
            console.log(`    transactionFeeEnd: ${parseInt(String(type.transactionFeeEnd) || "0")}`);
            
            return {
              productType: type.productType || "",
              fee,
              feeAdmin,
              feeDock,
              transactionFeeStart: parseInt(String(type.transactionFeeStart) || "0"),
              transactionFeeEnd: parseInt(String(type.transactionFeeEnd) || "0"),
              pixMinimumCostFee,
              pixCeilingFee,
              transactionAnticipationMdr
            };
          })
        };
      });

      console.log("Enviando dados para API:");
      console.log("Status: REVIEWED");
      console.log("Dados JSON completo:", JSON.stringify(simplifiedBrands, null, 2));
      
      // Enviar todos os tipos de produtos
      await updateSolicitationFeeBrandsWithTaxes(
        idsolicitationFee, 
        "REVIEWED", 
        simplifiedBrands
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
    if (value === undefined || value === null || value === "") return 0;
    
    // Se já for um número, retorna diretamente
    if (typeof value === 'number') return value;
    
    // Remove o símbolo de percentagem e espaços
    let stringValue = String(value).replace(/%/g, "").trim();
    
    // Substitui vírgula por ponto para formato numérico
    stringValue = stringValue.replace(/,/g, ".");
    
    // Converte para número
    const numericValue = parseFloat(stringValue);
    
    // Retorna 0 se for NaN, caso contrário retorna o valor
    return isNaN(numericValue) ? 0 : numericValue;
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
  
      console.log("Valor modificado no PercentageInput:", newValue);
      onChange(newValue);
    };
    
    // Formatar valor para exibição
    let displayValue = "";
    if (value) {
      // Remove o símbolo % se já existir para evitar duplicação
      const cleanValue = String(value).replace(/%/g, "");
      displayValue = cleanValue ? `${cleanValue}%` : "";
    }
    
    console.log("Valor de exibição no PercentageInput:", displayValue);
  
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
                  
                  return (
                    <React.Fragment key={`cell-${brand.value}-${type.value}-${typeIndex}`}>
                      {/* Taxa fee */}
                      <TableCell className="p-1 text-center">
                        <div className="rounded-full py-1 px-3 inline-block w-[70px] text-center bg-blue-100">
                          <PercentageInput
                            value={currentProduct?.fee || ""}
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
                            value={currentProduct?.feeAdmin || ""}
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
                            value={currentProduct?.feeDock || ""}
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
          <h3 className="text-lg font-medium mb-4">PIX</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <h4 className="font-medium mb-2">MDR</h4>
              <div className="rounded-full py-2 px-4 bg-blue-100 inline-block">
                <PercentageInput
                  value={formData.solicitationFee.solicitationFeeBrands[0]?.solicitationBrandProductTypes[0]?.fee || ""}
                  onChange={() => {}} // Readonly
                  placeholder="0,01%"
                  className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={true}
                />
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Custo Mínimo</h4>
              <div className="rounded-full py-2 px-4 bg-yellow-100 inline-block">
                <input
                  type="number"
                  step="0.01"
                  placeholder="R$ 0.09"
                  className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={formData.solicitationFee.solicitationFeeBrands[0]?.solicitationBrandProductTypes[0]?.pixMinimumCostFee || ""}
                  onChange={(e) => {
                    const newData = { ...formData };
                    if (newData.solicitationFee?.solicitationFeeBrands?.[0]?.solicitationBrandProductTypes?.[0]) {
                      newData.solicitationFee.solicitationFeeBrands[0].solicitationBrandProductTypes[0].pixMinimumCostFee = e.target.value;
                      setFormData(newData);
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Custo Máximo</h4>
              <div className="rounded-full py-2 px-4 bg-green-100 inline-block">
                <input
                  type="number"
                  step="0.01"
                  placeholder="R$ 0.09"
                  className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={formData.solicitationFee.solicitationFeeBrands[0]?.solicitationBrandProductTypes[0]?.pixCeilingFee || ""}
                  onChange={(e) => {
                    const newData = { ...formData };
                    if (newData.solicitationFee?.solicitationFeeBrands?.[0]?.solicitationBrandProductTypes?.[0]) {
                      newData.solicitationFee.solicitationFeeBrands[0].solicitationBrandProductTypes[0].pixCeilingFee = e.target.value;
                      setFormData(newData);
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Antecipação</h4>
              <div className="rounded-full py-2 px-4 bg-blue-100 inline-block">
                <PercentageInput
                  value={formData.solicitationFee.solicitationFeeBrands[0]?.solicitationBrandProductTypes[0]?.transactionAnticipationMdr || ""}
                  onChange={(value) => {
                    const newData = { ...formData };
                    if (newData.solicitationFee?.solicitationFeeBrands?.[0]?.solicitationBrandProductTypes?.[0]) {
                      newData.solicitationFee.solicitationFeeBrands[0].solicitationBrandProductTypes[0].transactionAnticipationMdr = value;
                      setFormData(newData);
                    }
                  }}
                  placeholder="1,67%"
                  className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
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
                

