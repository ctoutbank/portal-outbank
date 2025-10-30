'use client';
import { FornecedorMDRForm } from "@/types/fornecedor";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Card, CardContent } from "../ui/card";
import Image from "next/image";

// Tipos locais para corrigir erros de tipagem sem alterar lógica
const BANDEIRAS = ["Visa", "Mastercard", "Elo", "Amex", "Hipercard"] as const;
type Bandeira = (typeof BANDEIRAS)[number];

type TaxaFields = {
  debito: string;
  credito: string;
  credito2x: string;
  credito7x: string;
  voucher: string;
};
//test for need
type TaxasPorBandeira = Record<Bandeira, TaxaFields>;

interface MdrFormState {
  mcc: string[];
  taxasPos: TaxasPorBandeira;
  taxasOnline: TaxasPorBandeira;
  prepos: string;
  mdrpos: string;
  cminpos: string;
  cmaxpos: string;
  antecipacao: string;
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; label: string; mcc?: string }>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [mdrForm, setMdrForm] = useState<MdrFormState>({
    mcc: mdrData?.mcc || [],
    
    // Taxas POS por bandeira
    taxasPos: {
      Visa: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
      Mastercard: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
      Elo: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
      Amex: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
      Hipercard: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
    },
    
    // Taxas Online por bandeira
    taxasOnline: {
      Visa: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
      Mastercard: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
      Elo: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
      Amex: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
      Hipercard: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
    },
    
    // Outras taxas
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
    // Atualiza apenas campos top-level string conhecidos — evita indexação insegura
    setMdrForm((prev) => {
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
    bandeira: Bandeira,
    campo: keyof TaxaFields,
    value: string
  ) => {
    setMdrForm(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [bandeira]: {
          ...prev[tipo][bandeira],
          [campo]: value
        }
      }
    } as MdrFormState));
  };

  // 🔥 FUNÇÃO QUE TRANSFORMA OS DADOS POR BANDEIRA EM DADOS POR TIPO
  const transformToApiFormat = (): FornecedorMDRForm => {
    const bandeiras = BANDEIRAS.join(',');
    
    // Concatenar valores de todas as bandeiras separados por vírgula
    const debitopos = BANDEIRAS.map(b => mdrForm.taxasPos[b].debito || "0").join(',');
    const creditopos = BANDEIRAS.map(b => mdrForm.taxasPos[b].credito || "0").join(',');
    const credito2xpos = BANDEIRAS.map(b => mdrForm.taxasPos[b].credito2x || "0").join(',');
    const credito7xpos = BANDEIRAS.map(b => mdrForm.taxasPos[b].credito7x || "0").join(',');
    const voucherpos = BANDEIRAS.map(b => mdrForm.taxasPos[b].voucher || "0").join(',');
    
    const debitoonline = BANDEIRAS.map(b => mdrForm.taxasOnline[b].debito || "0").join(',');
    const creditoonline = BANDEIRAS.map(b => mdrForm.taxasOnline[b].credito || "0").join(',');
    const credito2xonline = BANDEIRAS.map(b => mdrForm.taxasOnline[b].credito2x || "0").join(',');
    const credito7xonline = BANDEIRAS.map(b => mdrForm.taxasOnline[b].credito7x || "0").join(',');
    const voucheronline = BANDEIRAS.map(b => mdrForm.taxasOnline[b].voucher || "0").join(',');

    return {
      bandeiras,
      debitopos,
      creditopos,
      credito2xpos,
      credito7xpos,
      voucherpos,
      prepos: mdrForm.prepos,
      mdrpos: mdrForm.mdrpos,
      cminpos: mdrForm.cminpos,
      cmaxpos: mdrForm.cmaxpos,
      antecipacao: mdrForm.antecipacao,
      debitoonline,
      creditoonline,
      credito2xonline,
      credito7xonline,
      voucheronline,
      preonline: mdrForm.preonline,
      mdronline: mdrForm.mdronline,
      cminonline: mdrForm.cminonline,
      cmaxonline: mdrForm.cmaxonline,
      antecipacaoonline: mdrForm.antecipacaoonline,
      mcc: mdrForm.mcc,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addCnae = (cnaeId: string) => {
    const currentMcc = mdrForm.mcc || [];
    if (!currentMcc.includes(cnaeId)) {
      setMdrForm((prev) => ({ ...prev, mcc: [...currentMcc, cnaeId] }));
    }
    setSearchTerm("");
  };

  const removeCnae = (cnaeId: string) => {
    setMdrForm((prev) => ({ ...prev, mcc: prev.mcc.filter((id) => id !== cnaeId) }));
  };

  const getCnaeCode = (label: string) => {
    const match = label.match(/\(([^)]+)\)/);
    return match ? match[1] : label.substring(0, 10);
  };

  async function fetchCnaeOptions(q = "") {
    const res = await fetch(`/api/cnaes?q=${encodeURIComponent(q)}`);
    return res.json() as Promise<Array<{ id: string; name: string; cnae: string; mcc: string }>>;
  }

  useEffect(() => {
    if (categoriesProp && categoriesProp.length > 0) {
      setCategories(categoriesProp);
    } else {
      fetchCnaeOptions().then((data) =>
        setCategories(data.map((d) => ({ 
          id: String(d.id), 
          label: `${d.name} (${d.cnae})`,
          mcc: d.mcc 
        })))
      );
    }
  }, [categoriesProp]);

  

  const getCardImage = (brandName: string): string => {
    const brandMap: Record<string, string> = {
      Visa: "/visa.svg",
      Mastercard: "/mastercard.svg",
      Elo: "/elo.svg",
      Amex: "/amex.svg",
      Hipercard: "/hipercard.svg",
    };
    return brandMap[brandName] || "";
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* CNAE e MCC Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* CNAE */}
              <div ref={dropdownRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">CNAE *</label>
                <div
                  className="min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 bg-white cursor-text"
                  onClick={() => setShowDropdown(true)}
                >
                  <div className="flex flex-wrap gap-2">
                    {mdrForm.mcc?.map((mccId: string) => {
                      const cnae = categories.find((c) => c.id === mccId);
                      if (!cnae) return null;
                      return (
                        <span
                          key={mccId}
                          className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                        >
                          {getCnaeCode(cnae.label)}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCnae(mccId);
                            }}
                            className="hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder={mdrForm.mcc?.length === 0 ? "Buscar CNAEs..." : ""}
                      className="flex-1 min-w-[120px] outline-none border-0 p-0 text-sm bg-transparent"
                    />
                  </div>
                </div>
                {showDropdown && categories.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {categories
                      .filter(
                        (c) =>
                          c.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
                          !mdrForm.mcc?.includes(c.id)
                      )
                      .map((cnae) => (
                        <div
                          key={cnae.id}
                          onClick={() => addCnae(cnae.id)}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                        >
                          {cnae.label}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* MCC Display */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">MCC (Gerado automaticamente)</label>
                <div className="min-h-[44px] px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex flex-wrap gap-2">
                    {mdrForm.mcc?.map((mccId: string) => {
                      const cnae = categories.find((c) => c.id === mccId);
                      if (!cnae || !cnae.mcc) return null;
                      return (
                        <span
                          key={mccId}
                          className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded text-sm"
                        >
                          {cnae.mcc}
                        </span>
                      );
                    })}
                    {(!mdrForm.mcc || mdrForm.mcc.length === 0) && (
                      <span className="text-gray-400 text-sm">Selecione um CNAE</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Taxas POS */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 bg-gray-100 px-4 py-2 rounded-lg">
                Taxas Transações POS
              </h3>
              
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 w-[140px]">Bandeira</th>
                      <th className="text-center py-2 px-2 font-semibold text-gray-700">Débito</th>
                      <th className="text-center py-2 px-2 font-semibold text-gray-700">Créd. Vista</th>
                      <th className="text-center py-2 px-2 font-semibold text-gray-700">Créd. 2x</th>
                      <th className="text-center py-2 px-2 font-semibold text-gray-700">Créd. 7x</th>
                      <th className="text-center py-2 px-2 font-semibold text-gray-700">Voucher</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {BANDEIRAS.map((bandeira) => (
                      <tr key={bandeira} className="hover:bg-gray-50">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            {getCardImage(bandeira) && (
                              <Image src={getCardImage(bandeira)} alt={bandeira} width={32} height={20} className="object-contain flex-shrink-0" />
                            )}
                            <span className="font-medium text-gray-800">{bandeira}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={mdrForm.taxasPos[bandeira].debito}
                            onChange={(e) => handleTaxaChange('taxasPos', bandeira, 'debito', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={mdrForm.taxasPos[bandeira].credito}
                            onChange={(e) => handleTaxaChange('taxasPos', bandeira, 'credito', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={mdrForm.taxasPos[bandeira].credito2x}
                            onChange={(e) => handleTaxaChange('taxasPos', bandeira, 'credito2x', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={mdrForm.taxasPos[bandeira].credito7x}
                            onChange={(e) => handleTaxaChange('taxasPos', bandeira, 'credito7x', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={mdrForm.taxasPos[bandeira].voucher}
                            onChange={(e) => handleTaxaChange('taxasPos', bandeira, 'voucher', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Outras Taxas POS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Pré-Pago (%)</label>
                  <input type="text" name="prepos" value={mdrForm.prepos} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">MDR (%)</label>
                  <input type="text" name="mdrpos" value={mdrForm.mdrpos} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Custo Mín (R$)</label>
                  <input type="text" name="cminpos" value={mdrForm.cminpos} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Custo Máx (R$)</label>
                  <input type="text" name="cmaxpos" value={mdrForm.cmaxpos} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Antecipação (%)</label>
                  <input type="text" name="antecipacao" value={mdrForm.antecipacao} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            {/* Taxas Online */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 bg-gray-100 px-4 py-2 rounded-lg">
                Taxas Transações Online
              </h3>
              
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-3 font-semibold text-gray-700 w-[140px]">Bandeira</th>
                      <th className="text-center py-2 px-2 font-semibold text-gray-700">Débito</th>
                      <th className="text-center py-2 px-2 font-semibold text-gray-700">Créd. Vista</th>
                      <th className="text-center py-2 px-2 font-semibold text-gray-700">Créd. 2x</th>
                      <th className="text-center py-2 px-2 font-semibold text-gray-700">Créd. 7x</th>
                      <th className="text-center py-2 px-2 font-semibold text-gray-700">Voucher</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {BANDEIRAS.map((bandeira) => (
                      <tr key={bandeira} className="hover:bg-gray-50">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            {getCardImage(bandeira) && (
                              <Image src={getCardImage(bandeira)} alt={bandeira} width={32} height={20} className="object-contain flex-shrink-0" />
                            )}
                            <span className="font-medium text-gray-800">{bandeira}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={mdrForm.taxasOnline[bandeira].debito}
                            onChange={(e) => handleTaxaChange('taxasOnline', bandeira, 'debito', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={mdrForm.taxasOnline[bandeira].credito}
                            onChange={(e) => handleTaxaChange('taxasOnline', bandeira, 'credito', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={mdrForm.taxasOnline[bandeira].credito2x}
                            onChange={(e) => handleTaxaChange('taxasOnline', bandeira, 'credito2x', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={mdrForm.taxasOnline[bandeira].credito7x}
                            onChange={(e) => handleTaxaChange('taxasOnline', bandeira, 'credito7x', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={mdrForm.taxasOnline[bandeira].voucher}
                            onChange={(e) => handleTaxaChange('taxasOnline', bandeira, 'voucher', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Outras Taxas Online */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Pré-Pago (%)</label>
                  <input type="text" name="preonline" value={mdrForm.preonline} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">MDR (%)</label>
                  <input type="text" name="mdronline" value={mdrForm.mdronline} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Custo Mín (R$)</label>
                  <input type="text" name="cminonline" value={mdrForm.cminonline} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Custo Máx (R$)</label>
                  <input type="text" name="cmaxonline" value={mdrForm.cmaxonline} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Antecipação (%)</label>
                  <input type="text" name="antecipacaoonline" value={mdrForm.antecipacaoonline} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
                        </div>
            
                        {/* Buttons */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? "Salvando..." : isEditing ? "Atualizar" : "Salvar MDR"}
                          </button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              );
            }