'use client';
import { FornecedorMDRForm } from "@/types/fornecedor";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import Image from "next/image";

interface MdrProps {
  onSubmit: (data: FornecedorMDRForm) => Promise<void>;
  onAdd: () => Promise<void>;
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
  
  // State com taxas por bandeira
  const [mdrForm, setMdrForm] = useState({
    bandeiras: mdrData?.bandeiras || "",
    antecipacao: mdrData?.antecipacao || "",
    antecipacaoonline: mdrData?.antecipacaoonline || "",
    cmaxonline: mdrData?.cmaxonline || "",
    cmaxpos: mdrData?.cmaxpos || "",
    cminonline: mdrData?.cminonline || "",
    cminpos: mdrData?.cminpos || "",
    mdronline: mdrData?.mdronline || "",
    mdrpos: mdrData?.mdrpos || "",
    preonline: mdrData?.preonline || "",
    prepos: mdrData?.prepos || "",
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
    }
  });

  // Para campos simples (como antes)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMdrForm((prev) => ({ ...prev, [name]: value }));
  };

  // Para taxas das bandeiras
  const handleTaxaChange = (tipo: 'taxasPos' | 'taxasOnline', bandeira: string, campo: string, value: string) => {
    setMdrForm(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [bandeira]: {
          ...prev[tipo][bandeira],
          [campo]: value
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(mdrForm as any);
      console.log("AAAAAAAAAAAAAAAAAAAAAAA")
    } catch (error) {
      console.log("Erro ao submeter MDR:", error);
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

  const BANDEIRAS = ["Visa", "Mastercard", "Elo", "Amex", "Hipercard"];

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
    <div className="w-full mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-6 w-6 bg-black rounded flex items-center justify-center text-white text-sm">
          $
        </div>
        <h1 className="text-xl font-semibold">
          {isEditing ? "Editar" : "Cadastrar"} MDR do Fornecedor
        </h1>
      </div>

      <Card className="w-full mx-auto">
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit}>
            <div className="w-full">
              {/* CNAE Selector */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* CNAE */}
                  <div ref={dropdownRef} className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNAE *</label>
                    <div
                      className="w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent flex flex-wrap items-center gap-2 cursor-text"
                      onClick={() => setShowDropdown(true)}
                    >
                      {mdrForm.mcc?.map((mccId: string) => {
                        const cnae = categories.find((c) => c.id === mccId);
                        if (!cnae) return null;
                        return (
                          <div
                            key={mccId}
                            className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
                            title={cnae.label}
                          >
                            <span>{getCnaeCode(cnae.label)}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCnae(mccId);
                              }}
                              className="hover:bg-blue-200 rounded-full"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
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
                        className="flex-1 min-w-[120px] outline-none border-0 p-0 text-sm"
                      />
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

                  {/* MCC */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">MCC</label>
                    <div className="w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex flex-wrap items-center gap-2">
                      {mdrForm.mcc?.map((mccId: string) => {
                        const cnae = categories.find((c) => c.id === mccId);
                        if (!cnae || !cnae.mcc) return null;
                        return (
                          <div
                            key={mccId}
                            className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium"
                          >
                            {cnae.mcc}
                          </div>
                        );
                      })}
                      {(!mdrForm.mcc || mdrForm.mcc.length === 0) && (
                        <span className="text-gray-400 text-sm">Selecione um CNAE</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* POS Table */}
              <h3 className="text-sm font-semibold text-gray-700 mb-3 bg-gray-100 p-2 rounded">
                Taxas Transações POS
              </h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left py-3 px-4 border-b border-gray-300 font-semibold text-sm min-w-[180px]">Bandeira</th>
                      <th className="text-left py-3 px-4 border-b border-gray-300 font-semibold text-sm">Débito</th>
                      <th className="text-left py-3 px-4 border-b border-gray-300 font-semibold text-sm">Crédito à vista</th>
                      <th className="text-left py-3 px-4 border-b border-gray-300 font-semibold text-sm">Crédito 2x</th>
                      <th className="text-left py-3 px-4 border-b border-gray-300 font-semibold text-sm">Crédito 7x</th>
                      <th className="text-left py-3 px-4 border-b border-gray-300 font-semibold text-sm">Voucher</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BANDEIRAS.map((bandeira, index) => (
                      <tr key={index} className="border-b border-gray-200 bg-white hover:bg-gray-50">
                        <td className="py-3 px-4 min-w-[180px]">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            {getCardImage(bandeira) && (
                              <Image src={getCardImage(bandeira)} alt={bandeira} width={40} height={24} className="object-contain flex-shrink-0" />
                            )}
                            <span className="font-medium text-sm">{bandeira}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="relative w-28">
                            <Input
                              type="text"
                              value={mdrForm.taxasPos[bandeira].debito}
                              onChange={(e) => handleTaxaChange('taxasPos', bandeira, 'debito', e.target.value)}
                              placeholder="0.00"
                              className="pr-8 text-sm h-9"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="relative w-28">
                            <Input
                              type="text"
                              value={mdrForm.taxasPos[bandeira].credito}
                              onChange={(e) => handleTaxaChange('taxasPos', bandeira, 'credito', e.target.value)}
                              placeholder="0.00"
                              className="pr-8 text-sm h-9"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="relative w-28">
                            <Input
                              type="text"
                              value={mdrForm.taxasPos[bandeira].credito2x}
                              onChange={(e) => handleTaxaChange('taxasPos', bandeira, 'credito2x', e.target.value)}
                              placeholder="0.00"
                              className="pr-8 text-sm h-9"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="relative w-28">
                            <Input
                              type="text"
                              value={mdrForm.taxasPos[bandeira].credito7x}
                              onChange={(e) => handleTaxaChange('taxasPos', bandeira, 'credito7x', e.target.value)}
                              placeholder="0.00"
                              className="pr-8 text-sm h-9"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="relative w-28">
                            <Input
                              type="text"
                              value={mdrForm.taxasPos[bandeira].voucher}
                              onChange={(e) => handleTaxaChange('taxasPos', bandeira, 'voucher', e.target.value)}
                              placeholder="0.00"
                              className="pr-8 text-sm h-9"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* POS Other Fees */}
              <div className="mt-8 bg-white rounded-lg p-4 border border-gray-200">
                <h2 className="text-lg font-semibold mb-6 text-gray-800">Outras Taxas POS</h2>
                <div className="flex flex-wrap gap-6">
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-600 mb-2">Pré-Pago</p>
                    <div className="relative w-28">
                      <Input type="text" name="prepos" value={mdrForm.prepos || ""} onChange={handleInputChange} placeholder="0.00" className="pr-8 text-sm h-9" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-600 mb-2">MDR</p>
                    <div className="relative w-28">
                      <Input type="text" name="mdrpos" value={mdrForm.mdrpos || ""} onChange={handleInputChange} placeholder="0.00" className="pr-8 text-sm h-9" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-600 mb-2">Custo Mínimo (R$)</p>
                    <Input type="text" name="cminpos" value={mdrForm.cminpos || ""} onChange={handleInputChange} placeholder="0.00" className="text-sm h-9 w-28" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-600 mb-2">Custo Máximo (R$)</p>
                    <Input type="text" name="cmaxpos" value={mdrForm.cmaxpos || ""} onChange={handleInputChange} placeholder="0.00" className="text-sm h-9 w-28" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-600 mb-2">Antecipação</p>
                    <div className="relative w-28">
                      <Input type="text" name="antecipacao" value={mdrForm.antecipacao || ""} onChange={handleInputChange} placeholder="0.00" className="pr-8 text-sm h-9" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Online Table */}
              <h3 className="text-sm font-semibold text-gray-700 mb-3 bg-gray-100 p-2 rounded mt-8">
                Taxas Transações Online
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse table-fixed">
                    <colgroup>
                      <col style={{ width: '180px' }} />
                      <col />
                      <col />
                      <col />
                      <col />
                      <col />
                    </colgroup>
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left py-3 px-4 border-b border-gray-300 font-semibold text-sm">Bandeira</th>
                        <th className="text-left py-3 px-4 border-b border-gray-300 font-semibold text-sm">Débito</th>
                        <th className="text-left py-3 px-4 border-b border-gray-300 font-semibold text-sm">Crédito à vista</th>
                        <th className="text-left py-3 px-4 border-b border-gray-300 font-semibold text-sm">Crédito 2x</th>
                        <th className="text-left py-3 px-4 border-b border-gray-300 font-semibold text-sm">Crédito 7x</th>
                        <th className="text-left py-3 px-4 border-b border-gray-300 font-semibold text-sm">Voucher</th>
                      </tr>
                    </thead>
                    <tbody>
                      {BANDEIRAS.map((bandeira, index) => (
                        <tr key={index} className="border-b border-gray-200 bg-white hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              {getCardImage(bandeira) && (
                                <Image src={getCardImage(bandeira)} alt={bandeira} width={40} height={24} className="object-contain flex-shrink-0" />
                              )}
                              <span className="font-medium text-sm">{bandeira}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="relative w-28">
                              <Input
                                type="text"
                                value={mdrForm.taxasOnline[bandeira].debito}
                                onChange={(e) => handleTaxaChange('taxasOnline', bandeira, 'debito', e.target.value)}
                                placeholder="0.00"
                                className="pr-8 text-sm h-9"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="relative w-28">
                              <Input
                                type="text"
                                value={mdrForm.taxasOnline[bandeira].credito}
                                onChange={(e) => handleTaxaChange('taxasOnline', bandeira, 'credito', e.target.value)}
                                placeholder="0.00"
                                className="pr-8 text-sm h-9"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="relative w-28">
                              <Input
                                type="text"
                                value={mdrForm.taxasOnline[bandeira].credito2x}
                                onChange={(e) => handleTaxaChange('taxasOnline', bandeira, 'credito2x', e.target.value)}
                                placeholder="0.00"
                                className="pr-8 text-sm h-9"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="relative w-28">
                              <Input
                                type="text"
                                value={mdrForm.taxasOnline[bandeira].credito7x}
                                onChange={(e) => handleTaxaChange('taxasOnline', bandeira, 'credito7x', e.target.value)}
                                placeholder="0.00"
                                className="pr-8 text-sm h-9"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="relative w-28">
                              <Input
                                type="text"
                                value={mdrForm.taxasOnline[bandeira].voucher}
                                onChange={(e) => handleTaxaChange('taxasOnline', bandeira, 'voucher', e.target.value)}
                                placeholder="0.00"
                                className="pr-8 text-sm h-9"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Online Other Fees */}
                <div className="mt-8 bg-white rounded-lg p-4 border border-gray-200">
                  <h2 className="text-lg font-semibold mb-6 text-gray-800">Outras Taxas Online</h2>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-600 mb-2">Pré-Pago</p>
                      <div className="relative w-28">
                        <Input type="text" name="preonline" value={mdrForm.preonline || ""} onChange={handleInputChange} placeholder="0.00" className="pr-8 text-sm h-9" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-600 mb-2">MDR</p>
                      <div className="relative w-28">
                        <Input type="text" name="mdronline" value={mdrForm.mdronline || ""} onChange={handleInputChange} placeholder="0.00" className="pr-8 text-sm h-9" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-600 mb-2">Custo Mínimo (R$)</p>
                      <Input type="text" name="cminonline" value={mdrForm.cminonline || ""} onChange={handleInputChange} placeholder="0.00" className="text-sm h-9 w-28" />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-600 mb-2">Custo Máximo (R$)</p>
                      <Input type="text" name="cmaxonline" value={mdrForm.cmaxonline || ""} onChange={handleInputChange} placeholder="0.00" className="text-sm h-9 w-28" />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm text-gray-600 mb-2">Antecipação</p>
                      <div className="relative w-28">
                        <Input type="text" name="antecipacaoonline" value={mdrForm.antecipacaoonline || ""} onChange={handleInputChange} placeholder="0.00" className="pr-8 text-sm h-9" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={onCancel}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? "Salvando..." : isEditing ? "Atualizar" : "Cadastrar"}
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}