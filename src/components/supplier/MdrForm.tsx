'use client';
import { FornecedorMDRForm } from "@/types/fornecedor";
import { useEffect, useState } from "react";
import { FileImage } from "lucide-react";

import { Card, CardContent } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { SolicitationFeeProductTypeList } from "@/lib/lookuptables/lookuptables";
import { brandList } from "@/lib/lookuptables/lookuptables-transactions";
import { OcrUploadModal } from "./OcrUploadModal";
import { ClearMdrModal } from "./ClearMdrModal";
import { Trash2 } from "lucide-react";

type ExtractType = 'pos' | 'online' | 'both';

interface ExtractedRate {
  brand: string;
  productType: string;
  rate: string;
}

type BrandValue = typeof brandList[number]['value'];

type TaxaFields = {
  [key: string]: string;
};

interface MdrFormState {
  mcc: string[];
  taxasPos: Record<BrandValue, TaxaFields>;
  taxasOnline: Record<BrandValue, TaxaFields>;
  pixPosCusto: string;
  pixOnlineCusto: string;
  antecipacaoPos: string;
  antecipacaoOnline: string;
}

interface MdrProps {
  onSubmit: (data: FornecedorMDRForm) => Promise<void>;
  onSaveAndRedirect?: (data: FornecedorMDRForm) => Promise<void>;
  isOpen: boolean;
  mdrData?: Partial<FornecedorMDRForm>;
  categories?: Array<{ id: string; label: string }>;
  onCancel: () => void;
  onClear?: () => Promise<void>;
  isEditing: boolean;
  suportaPos?: boolean;
  suportaOnline?: boolean;
  onChannelChange?: (channel: 'pos' | 'online', value: boolean) => void;
}

export default function MdrForm({
  mdrData,
  onSubmit,
  onSaveAndRedirect,
  isEditing = false,
  onCancel,
  onClear,
  suportaPos = true,
  suportaOnline = true,
  onChannelChange,
}: MdrProps) {
  const [loading, setLoading] = useState(false);
  const [loadingRedirect, setLoadingRedirect] = useState(false);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [localSuportaPos, setLocalSuportaPos] = useState(suportaPos);
  const [localSuportaOnline, setLocalSuportaOnline] = useState(suportaOnline);

  useEffect(() => {
    setLocalSuportaPos(suportaPos);
  }, [suportaPos]);

  useEffect(() => {
    setLocalSuportaOnline(suportaOnline);
  }, [suportaOnline]);

  const handleChannelToggle = (channel: 'pos' | 'online', value: boolean) => {
    if (channel === 'pos') {
      setLocalSuportaPos(value);
    } else {
      setLocalSuportaOnline(value);
    }
    onChannelChange?.(channel, value);
  };

  const sanitizeNumericInput = (value: string): string => {
    let cleaned = value.replace(/[^0-9.,]/g, "");
    cleaned = cleaned.replace(/,/g, ".");
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts.slice(1).join("");
    }
    return cleaned;
  };

  const formatWithDecimalMask = (value: string): string => {
    if (!value || value.trim() === '') return '';
    
    // If user already has a decimal point, respect it and just normalize
    if (value.includes('.') || value.includes(',')) {
      const normalized = value.replace(',', '.');
      const num = parseFloat(normalized);
      if (isNaN(num)) return '';
      return num.toFixed(2);
    }
    
    // No decimal point - treat as cents (e.g., 123 → 1.23)
    const digits = value.replace(/[^0-9]/g, "");
    if (digits === "") return "";
    if (digits.length === 1) return "0.0" + digits;
    if (digits.length === 2) return "0." + digits;
    const intPart = digits.slice(0, -2).replace(/^0+/, "") || "0";
    const decPart = digits.slice(-2);
    return intPart + "." + decPart;
  };

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
    taxasPos: initializeTaxasStructure(),
    taxasOnline: initializeTaxasStructure(),
    pixPosCusto: mdrData?.custo_pix_pos || "",
    pixOnlineCusto: mdrData?.custo_pix_online || "",
    antecipacaoPos: mdrData?.antecipacao || "",
    antecipacaoOnline: mdrData?.antecipacaoonline || "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMdrForm((prev) => ({ ...prev, [name]: value } as MdrFormState));
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

  const transformToApiFormat = (): FornecedorMDRForm => {
    const bandeiras = brandList.map(b => b.label).join(',');
    
    const getTaxa = (taxas: Record<BrandValue, TaxaFields>, brandValue: BrandValue, productType: string): string => {
      return taxas[brandValue]?.[productType] || "";
    };
    
    const debitopos = brandList.map(b => getTaxa(mdrForm.taxasPos, b.value, 'DEBIT')).join(',');
    const creditopos = brandList.map(b => getTaxa(mdrForm.taxasPos, b.value, 'CREDIT')).join(',');
    const credito2xpos = brandList.map(b => getTaxa(mdrForm.taxasPos, b.value, 'CREDIT_INSTALLMENTS_2_TO_6')).join(',');
    const credito7xpos = brandList.map(b => getTaxa(mdrForm.taxasPos, b.value, 'CREDIT_INSTALLMENTS_7_TO_12')).join(',');
    const voucherpos = brandList.map(b => getTaxa(mdrForm.taxasPos, b.value, 'VOUCHER')).join(',');
    const prepos = brandList.map(b => getTaxa(mdrForm.taxasPos, b.value, 'PREPAID_CREDIT')).join(',');
    
    const debitoonline = brandList.map(b => getTaxa(mdrForm.taxasOnline, b.value, 'DEBIT')).join(',');
    const creditoonline = brandList.map(b => getTaxa(mdrForm.taxasOnline, b.value, 'CREDIT')).join(',');
    const credito2xonline = brandList.map(b => getTaxa(mdrForm.taxasOnline, b.value, 'CREDIT_INSTALLMENTS_2_TO_6')).join(',');
    const credito7xonline = brandList.map(b => getTaxa(mdrForm.taxasOnline, b.value, 'CREDIT_INSTALLMENTS_7_TO_12')).join(',');
    const voucheronline = brandList.map(b => getTaxa(mdrForm.taxasOnline, b.value, 'VOUCHER')).join(',');
    const preonline = brandList.map(b => getTaxa(mdrForm.taxasOnline, b.value, 'PREPAID_CREDIT')).join(',');

    return {
      bandeiras,
      debitopos,
      creditopos,
      credito2xpos,
      credito7xpos,
      voucherpos,
      prepos,
      mdrpos: "",
      cminpos: "",
      cmaxpos: "",
      antecipacao: mdrForm.antecipacaoPos || "",
      debitoonline,
      creditoonline,
      credito2xonline,
      credito7xonline,
      voucheronline,
      preonline,
      mdronline: "",
      cminonline: "",
      cmaxonline: "",
      antecipacaoonline: mdrForm.antecipacaoOnline || "",
      mcc: mdrForm.mcc,
      custoPixPos: mdrForm.pixPosCusto,
      margemPixPos: "",
      custoPixOnline: mdrForm.pixOnlineCusto,
      margemPixOnline: "",
    };
  };

  useEffect(() => {
    if (!mdrData || !isEditing) return;

    const parseCommaSeparatedValues = (value: string | undefined, brandIndex: number): string => {
      if (!value) return "";
      const values = value.split(',');
      return values[brandIndex]?.trim() || "";
    };

    const updatedTaxasPos = initializeTaxasStructure();
    const updatedTaxasOnline = initializeTaxasStructure();
    
    brandList.forEach((brand, brandIndex) => {
      SolicitationFeeProductTypeList.forEach((productType) => {
        const oldKeyMapPos: Record<string, string> = {
          'DEBIT': 'debitopos',
          'CREDIT': 'creditopos',
          'CREDIT_INSTALLMENTS_2_TO_6': 'credito2xpos',
          'CREDIT_INSTALLMENTS_7_TO_12': 'credito7xpos',
          'VOUCHER': 'voucherpos',
          'PREPAID_CREDIT': 'prepos',
        };
        const oldKeyMapOnline: Record<string, string> = {
          'DEBIT': 'debitoonline',
          'CREDIT': 'creditoonline',
          'CREDIT_INSTALLMENTS_2_TO_6': 'credito2xonline',
          'CREDIT_INSTALLMENTS_7_TO_12': 'credito7xonline',
          'VOUCHER': 'voucheronline',
          'PREPAID_CREDIT': 'preonline',
        };
        
        const oldKeyPos = oldKeyMapPos[productType.value];
        const oldKeyOnline = oldKeyMapOnline[productType.value];
        
        if (oldKeyPos && mdrData[oldKeyPos as keyof FornecedorMDRForm]) {
          const value = parseCommaSeparatedValues(
            mdrData[oldKeyPos as keyof FornecedorMDRForm] as string,
            brandIndex
          );
          if (value) {
            updatedTaxasPos[brand.value][productType.value] = value;
          }
        }
        
        if (oldKeyOnline && mdrData[oldKeyOnline as keyof FornecedorMDRForm]) {
          const value = parseCommaSeparatedValues(
            mdrData[oldKeyOnline as keyof FornecedorMDRForm] as string,
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
      pixPosCusto: mdrData.custo_pix_pos || prev.pixPosCusto,
      pixOnlineCusto: mdrData.custo_pix_online || prev.pixOnlineCusto,
      antecipacaoPos: mdrData.antecipacao || prev.antecipacaoPos,
      antecipacaoOnline: mdrData.antecipacaoonline || prev.antecipacaoOnline,
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

  const handleSaveAndRedirect = async () => {
    if (!onSaveAndRedirect) return;
    setLoadingRedirect(true);
    try {
      const payload = transformToApiFormat();
      console.log("Payload transformado (redirect):", payload);
      await onSaveAndRedirect(payload);
      console.log("MDR salvo e redirecionando!");
    } catch (error) {
      console.error("Erro ao submeter MDR:", error);
    } finally {
      setLoadingRedirect(false);
    }
  };

  const handleClearConfirm = async () => {
    if (!onClear) return;
    
    await onClear();
    setMdrForm({
      mcc: mdrData?.mcc || [],
      taxasPos: initializeTaxasStructure(),
      taxasOnline: initializeTaxasStructure(),
      pixPosCusto: "",
      pixOnlineCusto: "",
      antecipacaoPos: "",
      antecipacaoOnline: "",
    });
  };

  const handleOcrData = (data: { pos?: ExtractedRate[]; online?: ExtractedRate[]; pixPos?: string; pixOnline?: string; antecipacaoPos?: string; antecipacaoOnline?: string }, extractType: ExtractType) => {
    setMdrForm(prev => {
      const newTaxasPos = extractType === 'online' ? prev.taxasPos : { ...prev.taxasPos };
      const newTaxasOnline = extractType === 'pos' ? prev.taxasOnline : { ...prev.taxasOnline };

      if (data.pos && (extractType === 'pos' || extractType === 'both')) {
        data.pos.forEach(rate => {
          if (newTaxasPos[rate.brand]) {
            newTaxasPos[rate.brand][rate.productType] = rate.rate;
          }
        });
      }

      if (data.online && (extractType === 'online' || extractType === 'both')) {
        data.online.forEach(rate => {
          if (newTaxasOnline[rate.brand]) {
            newTaxasOnline[rate.brand][rate.productType] = rate.rate;
          }
        });
      }

      return {
        ...prev,
        taxasPos: newTaxasPos,
        taxasOnline: newTaxasOnline,
        pixPosCusto: data.pixPos || prev.pixPosCusto,
        pixOnlineCusto: data.pixOnline || prev.pixOnlineCusto,
        antecipacaoPos: data.antecipacaoPos || prev.antecipacaoPos,
        antecipacaoOnline: data.antecipacaoOnline || prev.antecipacaoOnline,
      };
    });
  };

  const formatDecimalInput = (value: string): string => {
    let cleaned = sanitizeNumericInput(value);
    if (cleaned && !cleaned.includes('.') && cleaned.length > 2) {
      const intPart = cleaned.slice(0, -2);
      const decPart = cleaned.slice(-2);
      cleaned = `${intPart}.${decPart}`;
    }
    return cleaned;
  };

  const renderTaxaCell = (
    tipo: 'taxasPos' | 'taxasOnline',
    brand: typeof brandList[number],
    productType: typeof SolicitationFeeProductTypeList[number]
  ) => {
    const taxa = mdrForm[tipo][brand.value]?.[productType.value] || "";
    const isEmpty = taxa.trim() === '';

    return (
      <TableCell
        key={`${tipo}-${brand.value}-${productType.value}`}
        className="text-center bg-[#121212] border-l border-[#1f1f1f] p-2 text-sm"
      >
        <div className="relative">
          <input
            type="text"
            value={taxa}
            onChange={(e) => {
              const cleanValue = sanitizeNumericInput(e.target.value);
              handleTaxaChange(tipo, brand.value, productType.value, cleanValue);
            }}
            onBlur={(e) => {
              const formatted = formatWithDecimalMask(e.target.value);
              if (formatted !== taxa) {
                handleTaxaChange(tipo, brand.value, productType.value, formatted);
              }
            }}
            placeholder="0.00"
            className={`w-full text-center border rounded bg-[#1a1a1a] placeholder:text-[#555] focus-visible:outline-none text-sm pl-2 pr-6 py-2 text-[#ff9800] ${
              isEmpty ? 'border-red-500/50 bg-red-950/20' : 'border-[#2a2a2a]'
            }`}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#555] text-sm pointer-events-none">%</span>
        </div>
      </TableCell>
    );
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto overflow-x-hidden bg-[#0a0a0a]">
      <OcrUploadModal
        isOpen={ocrModalOpen}
        onClose={() => setOcrModalOpen(false)}
        onDataExtracted={handleOcrData}
      />
      
      <ClearMdrModal
        isOpen={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        onConfirm={handleClearConfirm}
      />
      
      <Card className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-[12px]">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <label className="text-sm text-[#a0a0a0]">Canais:</label>
                <button
                  type="button"
                  onClick={() => handleChannelToggle('pos', !localSuportaPos)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer ${
                    localSuportaPos 
                      ? 'bg-green-900/50 text-green-400 border border-green-700' 
                      : 'bg-[#1a1a1a] text-[#616161] border border-[#2a2a2a]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${localSuportaPos ? 'bg-green-400' : 'bg-[#616161]'}`} />
                  POS
                </button>
                <button
                  type="button"
                  onClick={() => handleChannelToggle('online', !localSuportaOnline)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer ${
                    localSuportaOnline 
                      ? 'bg-green-900/50 text-green-400 border border-green-700' 
                      : 'bg-[#1a1a1a] text-[#616161] border border-[#2a2a2a]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${localSuportaOnline ? 'bg-green-400' : 'bg-[#616161]'}`} />
                  Online
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOcrModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#616161] bg-[#1a1a1a] border border-[#2a2a2a] rounded-md hover:bg-[#252525] hover:text-[#a0a0a0] transition cursor-pointer"
              title="Importar taxas de uma imagem"
            >
              <FileImage className="w-3.5 h-3.5" />
              Importar via Imagem
            </button>
          </div>
          
          <div className="space-y-10">
            {localSuportaPos && (
            <>
            <div className="w-full overflow-x-auto">
              <div className="min-w-0">
                <h3 className="text-xl font-semibold mb-6 text-[#FFFFFF] border-b border-[#1f1f1f] pb-4">
                  Custo Dock - Transações POS
                </h3>
                <div className="overflow-x-auto mb-4">
                  <Table className="w-full min-w-[900px] border-collapse border-spacing-0">
                    <TableHeader>
                      <TableRow className="h-[52px]">
                        <TableHead className="sticky left-0 z-10 bg-[#0a0a0a] text-sm font-medium text-[#FFFFFF] p-4 text-left border-b border-[#2a2a2a] min-w-[100px]">
                          Bandeiras
                        </TableHead>
                        {SolicitationFeeProductTypeList.map((productType) => (
                          <TableHead
                            key={`pos-header-${productType.value}`}
                            className="text-center min-w-[120px] text-sm font-medium text-[#FFFFFF] bg-transparent p-4 border-b border-[#2a2a2a] border-l border-[#2a2a2a]"
                          >
                            {productType.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brandList.map((brand) => (
                        <TableRow 
                          key={`pos-${brand.value}`} 
                          className="border-b border-[#1f1f1f]"
                        >
                          <TableCell className="font-medium sticky left-0 z-10 bg-[#0a0a0a] text-[#FFFFFF] px-4 py-3 text-left border-r border-[#1f1f1f]">
                            <span className="font-medium text-[#FFFFFF]">{brand.label}</span>
                          </TableCell>
                          {SolicitationFeeProductTypeList.map((productType) => 
                            renderTaxaCell('taxasPos', brand, productType)
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-medium text-white mb-4">PIX POS - Custo Dock</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0f0f0f] rounded-[8px] p-6 border border-[#1a1a1a]">
                <div className="flex flex-col">
                  <label className={`text-[13px] mb-2 font-normal ${mdrForm.pixPosCusto ? 'text-[#ff9800]' : 'text-[#5C5C5C]'}`}>Custo PIX (R$)</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="pixPosCusto"
                      value={mdrForm.pixPosCusto}
                      onChange={(e) => {
                        const cleanValue = sanitizeNumericInput(e.target.value);
                        setMdrForm(prev => ({ ...prev, pixPosCusto: cleanValue }));
                      }}
                      onBlur={(e) => {
                        const formatted = formatWithDecimalMask(e.target.value);
                        if (formatted !== mdrForm.pixPosCusto) {
                          setMdrForm(prev => ({ ...prev, pixPosCusto: formatted }));
                        }
                      }}
                      placeholder="0.14"
                      className={`w-full h-[48px] px-4 pr-10 text-sm border border-[#2a2a2a] rounded-[6px] bg-[#1a1a1a] placeholder:text-[#555] focus:border-[#ff9800] focus:outline-none ${mdrForm.pixPosCusto ? 'text-[#ff9800]' : 'text-white'}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] text-sm pointer-events-none">R$</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className={`text-[13px] mb-2 font-normal ${mdrForm.antecipacaoPos ? 'text-[#ff9800]' : 'text-[#5C5C5C]'}`}>Antecipação (%)</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="antecipacaoPos"
                      value={mdrForm.antecipacaoPos}
                      onChange={(e) => {
                        const cleanValue = sanitizeNumericInput(e.target.value);
                        setMdrForm(prev => ({ ...prev, antecipacaoPos: cleanValue }));
                      }}
                      onBlur={(e) => {
                        const formatted = formatWithDecimalMask(e.target.value);
                        if (formatted !== mdrForm.antecipacaoPos) {
                          setMdrForm(prev => ({ ...prev, antecipacaoPos: formatted }));
                        }
                      }}
                      placeholder="0.00"
                      className={`w-full h-[48px] px-4 pr-8 text-sm border border-[#2a2a2a] rounded-[6px] bg-[#1a1a1a] placeholder:text-[#555] focus:border-[#ff9800] focus:outline-none ${mdrForm.antecipacaoPos ? 'text-[#ff9800]' : 'text-white'}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] text-sm pointer-events-none">%</span>
                  </div>
                </div>
              </div>
            </div>
            </>
            )}

            {localSuportaOnline && (
            <>
            <div className="w-full overflow-x-auto mt-10">
              <div className="min-w-0">
                <h3 className="text-xl font-semibold mb-6 text-[#FFFFFF] border-b border-[#1f1f1f] pb-4">
                  Custo Dock - Transações Online
                </h3>
                <div className="overflow-x-auto mb-4">
                  <Table className="w-full min-w-[900px] border-collapse border-spacing-0">
                    <TableHeader>
                      <TableRow className="h-[52px]">
                        <TableHead className="sticky left-0 z-10 bg-[#0a0a0a] text-sm font-medium text-[#FFFFFF] p-4 text-left border-b border-[#2a2a2a] min-w-[100px]">
                          Bandeiras
                        </TableHead>
                        {SolicitationFeeProductTypeList.map((productType) => (
                          <TableHead
                            key={`online-header-${productType.value}`}
                            className="text-center min-w-[120px] text-sm font-medium text-[#FFFFFF] bg-transparent p-4 border-b border-[#2a2a2a] border-l border-[#2a2a2a]"
                          >
                            {productType.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brandList.map((brand) => (
                        <TableRow 
                          key={`online-${brand.value}`} 
                          className="border-b border-[#1f1f1f]"
                        >
                          <TableCell className="font-medium sticky left-0 z-10 bg-[#0a0a0a] text-[#FFFFFF] px-4 py-3 text-left border-r border-[#1f1f1f]">
                            <span className="font-medium text-[#FFFFFF]">{brand.label}</span>
                          </TableCell>
                          {SolicitationFeeProductTypeList.map((productType) => 
                            renderTaxaCell('taxasOnline', brand, productType)
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-medium text-white mb-4">PIX Online - Custo Dock</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0f0f0f] rounded-[8px] p-6 border border-[#1a1a1a]">
                <div className="flex flex-col">
                  <label className={`text-[13px] mb-2 font-normal ${mdrForm.pixOnlineCusto ? 'text-[#ff9800]' : 'text-[#5C5C5C]'}`}>Custo PIX (R$)</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="pixOnlineCusto"
                      value={mdrForm.pixOnlineCusto}
                      onChange={(e) => {
                        const cleanValue = sanitizeNumericInput(e.target.value);
                        setMdrForm(prev => ({ ...prev, pixOnlineCusto: cleanValue }));
                      }}
                      onBlur={(e) => {
                        const formatted = formatWithDecimalMask(e.target.value);
                        if (formatted !== mdrForm.pixOnlineCusto) {
                          setMdrForm(prev => ({ ...prev, pixOnlineCusto: formatted }));
                        }
                      }}
                      placeholder="0.14"
                      className={`w-full h-[48px] px-4 pr-10 text-sm border border-[#2a2a2a] rounded-[6px] bg-[#1a1a1a] placeholder:text-[#555] focus:border-[#ff9800] focus:outline-none ${mdrForm.pixOnlineCusto ? 'text-[#ff9800]' : 'text-white'}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] text-sm pointer-events-none">R$</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className={`text-[13px] mb-2 font-normal ${mdrForm.antecipacaoOnline ? 'text-[#ff9800]' : 'text-[#5C5C5C]'}`}>Antecipação (%)</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="antecipacaoOnline"
                      value={mdrForm.antecipacaoOnline}
                      onChange={(e) => {
                        const cleanValue = sanitizeNumericInput(e.target.value);
                        setMdrForm(prev => ({ ...prev, antecipacaoOnline: cleanValue }));
                      }}
                      onBlur={(e) => {
                        const formatted = formatWithDecimalMask(e.target.value);
                        if (formatted !== mdrForm.antecipacaoOnline) {
                          setMdrForm(prev => ({ ...prev, antecipacaoOnline: formatted }));
                        }
                      }}
                      placeholder="0.00"
                      className={`w-full h-[48px] px-4 pr-8 text-sm border border-[#2a2a2a] rounded-[6px] bg-[#1a1a1a] placeholder:text-[#555] focus:border-[#ff9800] focus:outline-none ${mdrForm.antecipacaoOnline ? 'text-[#ff9800]' : 'text-white'}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] text-sm pointer-events-none">%</span>
                  </div>
                </div>
              </div>
            </div>
            </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-8">
        <div>
          {isEditing && onClear && (
            <button
              type="button"
              onClick={() => setClearModalOpen(true)}
              className="h-[48px] px-6 text-sm font-medium text-red-400 bg-[#1a1a1a] border border-red-900/50 rounded-[8px] hover:bg-red-950/30 hover:border-red-800 transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Taxas
            </button>
          )}
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="h-[48px] px-6 text-sm font-medium text-[#a0a0a0] bg-[#1a1a1a] border border-[#2a2a2a] rounded-[8px] hover:bg-[#252525] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || loadingRedirect}
            className="h-[48px] px-6 text-sm font-medium text-[#ff9800] bg-[#1a1a1a] border border-[#ff9800]/50 rounded-[8px] hover:bg-[#252525] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Salvando..." : "Salvar Rascunho"}
          </button>
          <button
            type="button"
            onClick={handleSaveAndRedirect}
            disabled={loading || loadingRedirect}
            className="h-[48px] px-8 text-sm font-medium text-white bg-[#ff9800] rounded-[8px] hover:bg-[#e68a00] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingRedirect ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
