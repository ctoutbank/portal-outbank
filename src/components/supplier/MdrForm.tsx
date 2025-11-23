'use client';
import { FornecedorMDRForm } from "@/types/fornecedor";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Card, CardContent } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { SolicitationFeeProductTypeList } from "@/lib/lookuptables/lookuptables";
import { brandList } from "@/lib/lookuptables/lookuptables-transactions";

// Usar brandList para garantir ordem correta: Master, Visa, Elo, Amex, Hipercard, Cabal
type BrandValue = typeof brandList[number]['value'];

type TaxaFields = {
  [key: string]: string; // Mapeia os productTypes (DEBIT, CREDIT, CREDIT_INSTALLMENTS_2_TO_6, etc.)
};

interface MdrFormState {
  mcc: string[];
  // Taxas POS: mapeia brand -> productType -> valor
  taxasPos: Record<BrandValue, TaxaFields>;
  // Taxas Online: mapeia brand -> productType -> valor
  taxasOnline: Record<BrandValue, TaxaFields>;
  // Seção PIX POS
  pixPosMdr: string;
  pixPosCustoMin: string;
  pixPosCustoMax: string;
  pixPosAntecipacao: string;
  // Seção PIX Online
  pixOnlineMdr: string;
  pixOnlineCustoMin: string;
  pixOnlineCustoMax: string;
  pixOnlineAntecipacao: string;
  // Outras taxas POS (legado para compatibilidade com API)
  prepos: string;
  mdrpos: string;
  cminpos: string;
  cmaxpos: string;
  antecipacao: string;
  // Outras taxas Online (legado para compatibilidade com API)
  preonline: string;
  mdronline: string;
  cminonline: string;
  cmaxonline: string;
  antecipacaoonline: string;
}

interface MdrProps {
  onSubmit: (data: FornecedorMDRForm) => Promise<void>;
  isOpen: boolean;
  mdrData?: Partial<FornecedorMDRForm>;
  categories?: Array<{ id: string; label: string }>;
  onCancel: () => void;
  isEditing: boolean;
}

export default function MdrForm({
  mdrData,
  onSubmit,
  isEditing = false,
  onCancel,
  categories: categoriesProp,
}: MdrProps) {

  const [loading, setLoading] = useState(false);

  
  // Função para inicializar estrutura de taxas vazia
  const initializeTaxasStructure = (): Record<BrandValue, TaxaFields> => {
    const structure: Record<string, TaxaFields> = {};
    brandList.forEach((brand) => {
      structure[brand.value] = {};
      SolicitationFeeProductTypeList.forEach((productType) => {
        structure[brand.value][productType.value] = "";
      });
    });
    return structure as Record<BrandValue, TaxaFields>;
  };

  const [mdrForm, setMdrForm] = useState<MdrFormState>({
    mcc: mdrData?.mcc || [],
    
    // Taxas POS por bandeira (nova estrutura usando SolicitationFeeProductTypeList)
    taxasPos: initializeTaxasStructure(),
    
    // Taxas Online por bandeira (nova estrutura usando SolicitationFeeProductTypeList)
    taxasOnline: initializeTaxasStructure(),
    
    // Seção PIX POS
    pixPosMdr: mdrData?.mdrpos || "",
    pixPosCustoMin: mdrData?.cminpos || "",
    pixPosCustoMax: mdrData?.cmaxpos || "",
    pixPosAntecipacao: mdrData?.antecipacao || "",
    
    // Seção PIX Online
    pixOnlineMdr: mdrData?.mdronline || "",
    pixOnlineCustoMin: mdrData?.cminonline || "",
    pixOnlineCustoMax: mdrData?.cmaxonline || "",
    pixOnlineAntecipacao: mdrData?.antecipacaoonline || "",
    
    // Outras taxas (legado para compatibilidade com API)
    prepos: mdrData?.prepos || "",
    mdrpos: mdrData?.mdrpos || "",
    cminpos: mdrData?.cminpos || "",
    cmaxpos: mdrData?.cmaxpos || "",
    antecipacao: mdrData?.antecipacao || "",
    preonline: mdrData?.preonline || "",
    mdronline: mdrData?.mdronline || "",
    cminonline: mdrData?.cminonline || "",
    cmaxonline: mdrData?.cmaxonline || "",
    antecipacaoonline: mdrData?.antecipacaoonline || "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMdrForm((prev) => {
      // Atualizar campos PIX
      if (
        name === 'pixPosMdr' ||
        name === 'pixPosCustoMin' ||
        name === 'pixPosCustoMax' ||
        name === 'pixPosAntecipacao' ||
        name === 'pixOnlineMdr' ||
        name === 'pixOnlineCustoMin' ||
        name === 'pixOnlineCustoMax' ||
        name === 'pixOnlineAntecipacao'
      ) {
        const updated = { ...prev, [name]: value };
        // Sincronizar com campos legados para compatibilidade
        if (name === 'pixPosMdr') updated.mdrpos = value;
        if (name === 'pixPosCustoMin') updated.cminpos = value;
        if (name === 'pixPosCustoMax') updated.cmaxpos = value;
        if (name === 'pixPosAntecipacao') updated.antecipacao = value;
        if (name === 'pixOnlineMdr') updated.mdronline = value;
        if (name === 'pixOnlineCustoMin') updated.cminonline = value;
        if (name === 'pixOnlineCustoMax') updated.cmaxonline = value;
        if (name === 'pixOnlineAntecipacao') updated.antecipacaoonline = value;
        return updated;
      }
      // Campos legados
      if (
        name === 'prepos' ||
        name === 'mdrpos' ||
        name === 'cminpos' ||
        name === 'cmaxpos' ||
        name === 'antecipacao' ||
        name === 'preonline' ||
        name === 'mdronline' ||
        name === 'cminonline' ||
        name === 'cmaxonline' ||
        name === 'antecipacaoonline'
      ) {
        return { ...prev, [name]: value } as MdrFormState;
      }
      return prev;
    });
  };

  const handleTaxaChange = (
    tipo: 'taxasPos' | 'taxasOnline',
    brandValue: BrandValue,
    productTypeValue: string,
    value: string
  ) => {
    setMdrForm(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [brandValue]: {
          ...prev[tipo][brandValue],
          [productTypeValue]: value
        }
      }
    }));
  };

  // Função que transforma os dados da nova estrutura para o formato da API (compatibilidade)
  const transformToApiFormat = (): FornecedorMDRForm => {
    const bandeiras = brandList.map(b => b.label).join(',');
    
    // Mapear os valores usando SolicitationFeeProductTypeList
    const getTaxaValue = (taxas: Record<BrandValue, TaxaFields>, brandValue: BrandValue, productType: string): string => {
      // Mapear valores novos para antigos (compatibilidade)
      const mapToOldFormat: Record<string, string> = {
        'DEBIT': 'DEBIT',
        'CREDIT': 'CREDIT',
        'CREDIT_INSTALLMENTS_2_TO_6': 'CREDIT_INSTALLMENTS_2_TO_6',
        'CREDIT_INSTALLMENTS_7_TO_12': 'CREDIT_INSTALLMENTS_7_TO_12',
        'VOUCHER': 'VOUCHER',
        'PREPAID_CREDIT': 'PREPAID_CREDIT',
      };
      
      // Para compatibilidade com API antiga, mapear:
      // CREDIT_INSTALLMENTS_2_TO_6 -> credito2x (primeira parcela)
      // CREDIT_INSTALLMENTS_7_TO_12 -> credito7x (primeira parcela)
      
      if (productType === 'CREDIT_INSTALLMENTS_2_TO_6') {
        return taxas[brandValue]?.[productType] || taxas[brandValue]?.['credito2x'] || "0";
      }
      if (productType === 'CREDIT_INSTALLMENTS_7_TO_12') {
        return taxas[brandValue]?.[productType] || taxas[brandValue]?.['credito7x'] || "0";
      }
      
      return taxas[brandValue]?.[productType] || "0";
    };
    
    // Concatenar valores de todas as bandeiras separados por vírgula (usando ordem do brandList)
    const debitopos = brandList.map(b => getTaxaValue(mdrForm.taxasPos, b.value, 'DEBIT')).join(',');
    const creditopos = brandList.map(b => getTaxaValue(mdrForm.taxasPos, b.value, 'CREDIT')).join(',');
    const credito2xpos = brandList.map(b => getTaxaValue(mdrForm.taxasPos, b.value, 'CREDIT_INSTALLMENTS_2_TO_6')).join(',');
    const credito7xpos = brandList.map(b => getTaxaValue(mdrForm.taxasPos, b.value, 'CREDIT_INSTALLMENTS_7_TO_12')).join(',');
    const voucherpos = brandList.map(b => getTaxaValue(mdrForm.taxasPos, b.value, 'VOUCHER')).join(',');
    const prepagopos = brandList.map(b => getTaxaValue(mdrForm.taxasPos, b.value, 'PREPAID_CREDIT')).join(',');
    
    const debitoonline = brandList.map(b => getTaxaValue(mdrForm.taxasOnline, b.value, 'DEBIT')).join(',');
    const creditoonline = brandList.map(b => getTaxaValue(mdrForm.taxasOnline, b.value, 'CREDIT')).join(',');
    const credito2xonline = brandList.map(b => getTaxaValue(mdrForm.taxasOnline, b.value, 'CREDIT_INSTALLMENTS_2_TO_6')).join(',');
    const credito7xonline = brandList.map(b => getTaxaValue(mdrForm.taxasOnline, b.value, 'CREDIT_INSTALLMENTS_7_TO_12')).join(',');
    const voucheronline = brandList.map(b => getTaxaValue(mdrForm.taxasOnline, b.value, 'VOUCHER')).join(',');

    return {
      bandeiras,
      debitopos,
      creditopos,
      credito2xpos,
      credito7xpos,
      voucherpos,
      prepos: mdrForm.prepos || "",
      mdrpos: mdrForm.pixPosMdr || mdrForm.mdrpos || "",
      cminpos: mdrForm.pixPosCustoMin || mdrForm.cminpos || "",
      cmaxpos: mdrForm.pixPosCustoMax || mdrForm.cmaxpos || "",
      antecipacao: mdrForm.pixPosAntecipacao || mdrForm.antecipacao || "",
      debitoonline,
      creditoonline,
      credito2xonline,
      credito7xonline,
      voucheronline,
      preonline: mdrForm.preonline || "",
      mdronline: mdrForm.pixOnlineMdr || mdrForm.mdronline || "",
      cminonline: mdrForm.pixOnlineCustoMin || mdrForm.cminonline || "",
      cmaxonline: mdrForm.pixOnlineCustoMax || mdrForm.cmaxonline || "",
      antecipacaoonline: mdrForm.pixOnlineAntecipacao || mdrForm.antecipacaoonline || "",
      mcc: mdrForm.mcc,
    };
  };

  // Função para carregar dados existentes do mdrData
  useEffect(() => {
    if (!mdrData || !isEditing) return;

    // Função para parsear valores separados por vírgula
    const parseCommaSeparatedValues = (value: string | undefined, brandIndex: number): string => {
      if (!value) return "";
      const values = value.split(',');
      return values[brandIndex]?.trim() || "";
    };

    // Função para mapear valores antigos para novos productTypes
    const mapOldToNewProductType = (oldValue: string): string => {
      const map: Record<string, string> = {
        'debito': 'DEBIT',
        'credito': 'CREDIT',
        'credito2x': 'CREDIT_INSTALLMENTS_2_TO_6',
        'credito7x': 'CREDIT_INSTALLMENTS_7_TO_12',
        'voucher': 'VOUCHER',
        'prepago': 'PREPAID_CREDIT',
      };
      return map[oldValue.toLowerCase()] || oldValue.toUpperCase();
    };

    // Atualizar taxas POS
    const updatedTaxasPos = initializeTaxasStructure();
    brandList.forEach((brand, brandIndex) => {
      SolicitationFeeProductTypeList.forEach((productType) => {
        // Mapear para formato antigo para buscar valores
        const oldKeyMap: Record<string, string> = {
          'DEBIT': 'debitopos',
          'CREDIT': 'creditopos',
          'CREDIT_INSTALLMENTS_2_TO_6': 'credito2xpos',
          'CREDIT_INSTALLMENTS_7_TO_12': 'credito7xpos',
          'VOUCHER': 'voucherpos',
          'PREPAID_CREDIT': 'prepos', // Pré-pago não tem posição específica na API antiga
        };
        const oldKey = oldKeyMap[productType.value];
        if (oldKey && mdrData[oldKey as keyof FornecedorMDRForm]) {
          const value = parseCommaSeparatedValues(
            mdrData[oldKey as keyof FornecedorMDRForm] as string,
            brandIndex
          );
          if (value) {
            updatedTaxasPos[brand.value][productType.value] = value;
          }
        }
      });
    });

    // Atualizar taxas Online
    const updatedTaxasOnline = initializeTaxasStructure();
    brandList.forEach((brand, brandIndex) => {
      SolicitationFeeProductTypeList.forEach((productType) => {
        const oldKeyMap: Record<string, string> = {
          'DEBIT': 'debitoonline',
          'CREDIT': 'creditoonline',
          'CREDIT_INSTALLMENTS_2_TO_6': 'credito2xonline',
          'CREDIT_INSTALLMENTS_7_TO_12': 'credito7xonline',
          'VOUCHER': 'voucheronline',
          'PREPAID_CREDIT': 'preonline',
        };
        const oldKey = oldKeyMap[productType.value];
        if (oldKey && mdrData[oldKey as keyof FornecedorMDRForm]) {
          const value = parseCommaSeparatedValues(
            mdrData[oldKey as keyof FornecedorMDRForm] as string,
            brandIndex
          );
          if (value) {
            updatedTaxasOnline[brand.value][productType.value] = value;
          }
        }
      });
    });

    setMdrForm(prev => ({
      ...prev,
      taxasPos: updatedTaxasPos,
      taxasOnline: updatedTaxasOnline,
      // Atualizar campos PIX também
      pixPosMdr: mdrData.mdrpos || prev.pixPosMdr,
      pixPosCustoMin: mdrData.cminpos || prev.pixPosCustoMin,
      pixPosCustoMax: mdrData.cmaxpos || prev.pixPosCustoMax,
      pixPosAntecipacao: mdrData.antecipacao || prev.pixPosAntecipacao,
      pixOnlineMdr: mdrData.mdronline || prev.pixOnlineMdr,
      pixOnlineCustoMin: mdrData.cminonline || prev.pixOnlineCustoMin,
      pixOnlineCustoMax: mdrData.cmaxonline || prev.pixOnlineCustoMax,
      pixOnlineAntecipacao: mdrData.antecipacaoonline || prev.pixOnlineAntecipacao,
    }));
  }, [mdrData, isEditing]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = transformToApiFormat();
      console.log("Payload transformado:", payload);
      await onSubmit(payload);
      console.log("MDR salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao submeter MDR:", error);
    } finally {
      setLoading(false);
    }
  };

  



  return (
    <div className="w-full max-w-[1600px] mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-6 w-6 bg-black rounded flex items-center justify-center text-white text-sm">
          $
        </div>
        <h1 className="text-xl font-semibold">
          {isEditing ? "Editar" : "Cadastrar"} MDR do Fornecedor
        </h1>
      </div>

      <Card className="w-full">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Taxas POS */}
            <div className="w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className="min-w-0">
                <h3 className="text-lg font-medium mb-4 text-foreground border-b border-border pb-2">
                  Taxas Transações na POS
                </h3>
                <Table className="w-full min-w-[600px] border border-border rounded-none">
                  <TableHeader>
                    <TableRow className="border-b border-border">
                      <TableHead className="sticky left-0 z-10 bg-background text-sm font-medium text-foreground border-r border-border">
                        Bandeiras
                      </TableHead>
                      {SolicitationFeeProductTypeList.map((productType, index) => (
                        <TableHead
                          key={`pos-header-${productType.value}-${index}`}
                          className="text-center min-w-[100px] text-sm font-medium text-foreground border-r border-border"
                        >
                          {productType.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brandList.map((brand) => (
                      <TableRow key={`pos-${brand.value}`} className="border-b border-border">
                        <TableCell className="font-medium sticky left-0 z-10 bg-background text-foreground border-r border-border">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{brand.label}</span>
                          </div>
                        </TableCell>
                        {SolicitationFeeProductTypeList.map((productType, typeIndex) => (
                          <TableCell
                            key={`pos-${brand.value}-${productType.value}-${typeIndex}`}
                            className="p-1 text-center border-r border-border"
                          >
                            <input
                              type="text"
                              value={mdrForm.taxasPos[brand.value]?.[productType.value] || ""}
                              onChange={(e) => handleTaxaChange('taxasPos', brand.value, productType.value, e.target.value)}
                              placeholder="0.00"
                              className="w-full px-2 py-1 text-center border border-border rounded-none bg-muted text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent text-sm"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Seção PIX POS */}
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium mb-4 text-foreground border-b border-border pb-2">PIX</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">MDR (%)</label>
                  <input
                    type="text"
                    name="pixPosMdr"
                    value={mdrForm.pixPosMdr}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Custo Mínimo (R$)</label>
                  <input
                    type="text"
                    name="pixPosCustoMin"
                    value={mdrForm.pixPosCustoMin}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Custo Máximo (R$)</label>
                  <input
                    type="text"
                    name="pixPosCustoMax"
                    value={mdrForm.pixPosCustoMax}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Antecipação (%)</label>
                  <input
                    type="text"
                    name="pixPosAntecipacao"
                    value={mdrForm.pixPosAntecipacao}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>

            {/* Taxas Online */}
            <div className="w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 mt-8">
              <div className="min-w-0">
                <h3 className="text-lg font-medium mb-4 text-foreground border-b border-border pb-2">
                  Taxas Transações Online
                </h3>
                <Table className="w-full min-w-[600px] border border-border rounded-none">
                  <TableHeader>
                    <TableRow className="border-b border-border">
                      <TableHead className="sticky left-0 z-10 bg-background text-sm font-medium text-foreground border-r border-border">
                        Bandeiras
                      </TableHead>
                      {SolicitationFeeProductTypeList.map((productType, index) => (
                        <TableHead
                          key={`online-header-${productType.value}-${index}`}
                          className="text-center min-w-[100px] text-sm font-medium text-foreground border-r border-border"
                        >
                          {productType.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brandList.map((brand) => (
                      <TableRow key={`online-${brand.value}`} className="border-b border-border">
                        <TableCell className="font-medium sticky left-0 z-10 bg-background text-foreground border-r border-border">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{brand.label}</span>
                          </div>
                        </TableCell>
                        {SolicitationFeeProductTypeList.map((productType, typeIndex) => (
                          <TableCell
                            key={`online-${brand.value}-${productType.value}-${typeIndex}`}
                            className="p-1 text-center border-r border-border"
                          >
                            <input
                              type="text"
                              value={mdrForm.taxasOnline[brand.value]?.[productType.value] || ""}
                              onChange={(e) => handleTaxaChange('taxasOnline', brand.value, productType.value, e.target.value)}
                              placeholder="0.00"
                              className="w-full px-2 py-1 text-center border border-border rounded-none bg-muted text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent text-sm"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Seção PIX Online (sem Cartão) */}
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium mb-4 text-foreground border-b border-border pb-2">PIX sem Cartão</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">MDR (%)</label>
                  <input
                    type="text"
                    name="pixOnlineMdr"
                    value={mdrForm.pixOnlineMdr}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Custo Mínimo (R$)</label>
                  <input
                    type="text"
                    name="pixOnlineCustoMin"
                    value={mdrForm.pixOnlineCustoMin}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Custo Máximo (R$)</label>
                  <input
                    type="text"
                    name="pixOnlineCustoMax"
                    value={mdrForm.pixOnlineCustoMax}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Antecipação (%)</label>
                  <input
                    type="text"
                    name="pixOnlineAntecipacao"
                    value={mdrForm.pixOnlineAntecipacao}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-border">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-none transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-none transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Salvando..." : isEditing ? "Atualizar" : "Salvar MDR"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
