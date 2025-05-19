"use client";

import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { brandList, SolicitationFeeProductTypeList } from "@/lib/lookuptables/lookuptables-tax";
import { getCardImage } from "@/utils/actions";
import React, { CSSProperties, Fragment } from "react";

import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TaXEditFormSchema, TaxEditFormSchema } from "../schema/schema-tax";
import { updateSolicitationFeeBrandsWithTaxes } from "../server/solicitationfee";

interface TaxEditFormProps {
  idsolicitationFee: number;
  solicitationFeetax: TaXEditFormSchema;
}

export function TaxEditForm1({ idsolicitationFee, solicitationFeetax }: TaxEditFormProps) {
  const form = useForm<TaXEditFormSchema>({
    resolver: zodResolver(TaxEditFormSchema),
    defaultValues:{
      solicitationFee: {
        id: solicitationFeetax.solicitationFee.id || 0,
        slug: solicitationFeetax?.solicitationFee.slug || "",
        cnae: solicitationFeetax?.solicitationFee.cnae || "",
        idCustomers: solicitationFeetax?.solicitationFee.idCustomers || 0,
        mcc: solicitationFeetax?.solicitationFee.mcc || "",
        cnpjQuantity: solicitationFeetax.solicitationFee.cnpjQuantity || 0,
        monthlyPosFee: solicitationFeetax.solicitationFee.monthlyPosFee || 0,
        averageTicket: solicitationFeetax.solicitationFee.averageTicket || 0,
        description: solicitationFeetax.solicitationFee.description || "",
        cnaeInUse: solicitationFeetax.solicitationFee.cnaeInUse || false,
        status: solicitationFeetax.solicitationFee.status || "",
        dtinsert: solicitationFeetax?.solicitationFee.dtinsert  
        ? new Date(solicitationFeetax.solicitationFee.dtinsert)
        : undefined,
        dtupdate: solicitationFeetax?.solicitationFee.dtupdate 
        ? new Date(solicitationFeetax.solicitationFee.dtupdate)
        : undefined,
        solicitationFeeBrands: solicitationFeetax?.solicitationFee.solicitationFeeBrands.map(solicitationFeeBrand => ({
          id: solicitationFeeBrand.id || 0,
          slug: solicitationFeeBrand.slug || "",
          brand: solicitationFeeBrand.brand || "",
          solicitationFeeId: solicitationFeeBrand.solicitationFeeId || 0,

          dtinsert: solicitationFeeBrand.dtinsert  
        ? new Date(solicitationFeeBrand.dtinsert)
        : undefined,
        dtupdate: solicitationFeeBrand.dtupdate 
        ? new Date(solicitationFeeBrand.dtupdate)
        : undefined,
          solicitationBrandProductTypes: solicitationFeeBrand.solicitationBrandProductTypes.map(product => ({
            id: product.id || 0,
            slug: product.slug || "",
            productType: product.productType || "",
            fee: String(product.fee || ""),
            feeAdmin: String(product.feeAdmin || ""),
            feeDock: String(product.feeDock || ""),
            transactionFeeStart: String(product.transactionFeeStart || ""),
            transactionFeeEnd: String(product.transactionFeeEnd || ""),
            pixMinimumCostFee: String(product.pixMinimumCostFee || ""),
            pixCeilingFee: String(product.pixCeilingFee || ""),
            transactionAnticipationMdr: String(product.transactionAnticipationMdr || ""),
            dtinsert: product.dtinsert ? new Date(product.dtinsert) : undefined,
            dtupdate: product.dtupdate ? new Date(product.dtupdate) : undefined,
          }))
        }))
      }
    }
  });
  
  
  const onSubmit = async (values: Record<string, unknown>) => {
    try {
      // Usa as tipagens do TaXEditFormSchema para trabalhar com os dados
      const data = values as TaXEditFormSchema;
      console.log("Dados enviados:", data);
      const brands = data.solicitationFee.solicitationFeeBrands.map(brand => ({
        brand: brand.brand || "",
        id: brand.id,
        slug: brand.slug,
        solicitationFeeId: brand.solicitationFeeId,
        dtinsert: brand.dtinsert || new Date().toISOString(),
        dtupdate: brand.dtupdate || new Date().toISOString(),
      
        productTypes: brand.solicitationBrandProductTypes.map(type => ({
          id: type.id,
          slug: type.slug,
          productType: type.productType,
          fee: parseNumericValue(type.fee),
          feeAdmin: parseNumericValue(type.feeAdmin),
          feeDock: parseNumericValue(type.feeDock),
          transactionFeeStart: parseNumericValue(type.transactionFeeStart),
          transactionFeeEnd: parseNumericValue(type.transactionFeeEnd),
          pixMinimumCostFee: parseNumericValue(type.pixMinimumCostFee),
          pixCeilingFee: parseNumericValue(type.pixCeilingFee),
          transactionAnticipationMdr: parseNumericValue(type.transactionAnticipationMdr),
          dtinsert: type.dtinsert || new Date().toISOString(),
          dtupdate: type.dtupdate || new Date().toISOString(),
        }))
      }));
      console.log("Dados formatados para envio:", brands);
      const formattedBrands = brands.map(brand => ({
        brand: brand.brand,
        id: brand.id,
        slug: brand.slug,
        solicitationFeeId: brand.solicitationFeeId,
        dtinsert: brand.dtinsert,
        dtupdate: brand.dtupdate,
        productTypes: brand.productTypes.map(type => ({
          id: type.id,
          slug: type.slug,
          productType: type.productType || "",
          fee: type.fee,
          feeAdmin: type.feeAdmin,
          feeDock: type.feeDock, 
          transactionFeeStart: type.transactionFeeStart,
          transactionFeeEnd: type.transactionFeeEnd,
          pixMinimumCostFee: type.pixMinimumCostFee,
          pixCeilingFee: type.pixCeilingFee,
          transactionAnticipationMdr: type.transactionAnticipationMdr
        }))
      }));
      await updateSolicitationFeeBrandsWithTaxes(idsolicitationFee, "REVIEWED", formattedBrands);
      console.log("Taxas atualizadas com sucesso!");
      toast.success("Taxas atualizadas com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar taxas:", error);
      toast.error("Erro ao atualizar taxas");
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
  }: {
    value: string | number;
    onChange: (value: string) => void;
    placeholder: string;
    className?: string;
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
        />
      </div>
    );
  }

  // Filtrar lista de tipos de produtos para ter apenas valores únicos
  

  return (
    <div>
      <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
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
                      {type.label}{" "}
                    </TableHead>
                    <TableHead
                      className="text-center min-w-[100px] text-sm"
                    >
                      {type.label}{" "}
                    </TableHead>
                    <TableHead
                      className="text-center min-w-[100px] text-sm"
                    >
                      {type.label}{" "}
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
                    {SolicitationFeeProductTypeList.map((type, typeIndex) => (
                      <React.Fragment key={`cell-${brand.value}-${type.value}-${typeIndex}`}>
                        {/* Taxa fee */}
                        <TableCell
                          className="p-1 text-center"
                        >
                          <FormField
                            control={form.control}
                            name={`solicitationFee.solicitationFeeBrands.${brandIndex}.solicitationBrandProductTypes.${typeIndex * 3}.fee`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="rounded-full py-1 px-3 inline-block w-[70px] text-center bg-blue-100">
                                    <PercentageInput
                                      value={String(field.value)}
                                      onChange={field.onChange}
                                      placeholder="0%"
                                      className="border-0 p-0 h-auto text-center w-full bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        
                        {/* Taxa feeAdmin */}
                        <TableCell
                          className="p-1 text-center"
                        >
                          <FormField
                            control={form.control}
                            name={`solicitationFee.solicitationFeeBrands.${brandIndex}.solicitationBrandProductTypes.${typeIndex * 3 + 1}.feeAdmin`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="rounded-full py-1 px-3 inline-block w-[70px] text-center bg-yellow-100">
                                    <PercentageInput
                                      value={String(field.value)}
                                      onChange={field.onChange}
                                      placeholder="0%"
                                      className="border-0 p-0 h-auto text-center w-full bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        
                        {/* Taxa feeDock */}
                        <TableCell
                          className="p-1 text-center"
                        >
                          <FormField
                            control={form.control}
                            name={`solicitationFee.solicitationFeeBrands.${brandIndex}.solicitationBrandProductTypes.${typeIndex * 3 + 2}.feeDock`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="rounded-full py-1 px-3 inline-block w-[70px] text-center bg-green-100">
                                    <PercentageInput
                                      value={String(field.value)}
                                      onChange={field.onChange}
                                      placeholder="0%"
                                      className="border-0 p-0 h-auto text-center w-full bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
                                    />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </TableCell>
                      </React.Fragment>
                    ))}
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
                    <FormField
                      control={form.control}
                      name="solicitationFee.solicitationFeeBrands.0.solicitationBrandProductTypes.0.fee"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <PercentageInput
                              value={String(field.value)}
                              onChange={field.onChange}
                              placeholder="0,01%"
                              className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Custo Mínimo</h4>
                  <div className="rounded-full py-2 px-4 bg-yellow-100 inline-block">
                    <FormField
                      control={form.control}
                      name="solicitationFee.solicitationFeeBrands.0.solicitationBrandProductTypes.0.pixMinimumCostFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              placeholder="R$ 0.09"
                              className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Custo Máximo</h4>
                  <div className="rounded-full py-2 px-4 bg-green-100 inline-block">
                    <FormField
                      control={form.control}
                      name="solicitationFee.solicitationFeeBrands.0.solicitationBrandProductTypes.0.pixCeilingFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              placeholder="R$ 0.09"
                              className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Antecipação</h4>
                  <div className="rounded-full py-2 px-4 bg-blue-100 inline-block">
                    <FormField
                      control={form.control}
                      name="solicitationFee.solicitationFeeBrands.0.solicitationBrandProductTypes.0.transactionAnticipationMdr"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <PercentageInput
                              value={String(field.value)}
                              onChange={field.onChange}
                              placeholder="1,67%"
                              className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botão Enviar */}
            <div className="mt-4 flex justify-end">
              <Button 
                type="submit"
                
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                Enviar
              </Button>
            </div>
          </div>
        </form>
      </Form>
      </>
    </div>
  );
}
                

