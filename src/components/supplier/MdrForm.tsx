'use client';
import { FornecedorMDRForm } from "@/types/fornecedor";
import { X } from "lucide-react";
import { JSX, useEffect, useRef, useState } from "react";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import Image from "next/image";


interface MdrProps{
    onSubmit: (data: FornecedorMDRForm) => Promise<void>;
    onAdd: () => Promise<void>;
    isOpen: boolean;
    mdrData?: Partial<FornecedorMDRForm>,
    categories?: Array<{id: string; label: string}>
    onCancel: () => void;
    isEditing: boolean;
}


export default function MdrForm({
    mdrData,
    onSubmit,
    isEditing = false,
    onCancel, 
    categories: categoriesProp,
}: MdrProps){

        const dropdownRef = useRef<HTMLDivElement>(null);
        const [showDropdown, setShowDropdown] = useState(false);
        const [loading, setLoading] = useState(false);
        const [categories, setCategories] = useState<Array<{id: string; label: string}>>([]);
        const [searchTerm, setSearchTerm] = useState('');
        const [mdrForm, setMdrForm] = useState<FornecedorMDRForm>({
            bandeiras: mdrData?.bandeiras || '',
            antecipacao: mdrData?.antecipacao || '',
            antecipacaoonline: mdrData?.antecipacaoonline || '',
            cmaxonline: mdrData?.cmaxonline || '',
            cmaxpos: mdrData?.cmaxpos || '',
            cminonline: mdrData?.cmaxonline || '',
            cminpos: mdrData?.cminpos || '',
            credito2xonline: mdrData?.credito2xonline || '',
            credito2xpos: mdrData?.credito2xpos || '',
            credito7xonline: mdrData?.credito7xonline || '',
            credito7xpos: mdrData?.credito7xpos || '',
            creditoonline: mdrData?.creditoonline || '',
            creditopos: mdrData?.creditopos || '',
            debitoonline: mdrData?.debitoonline || '',
            debitopos: mdrData?.creditopos || '',
            mdronline: mdrData?.mdronline || '',
            mdrpos: mdrData?.mdrpos || '',
            preonline: mdrData?.preonline || '',
            prepos: mdrData?.prepos || '',
            voucheronline: mdrData?.voucheronline || '',
            voucherpos: mdrData?.voucherpos || '',
            mcc: mdrData?.mcc || [],
    
        })

        const handleSubmitMDR = async(e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload2: FornecedorMDRForm = {...mdrForm } as FornecedorMDRForm;
            await onSubmit(payload2)
        } catch (error){
            console.log("Erro while submiting MDR table: ", error)
        } finally {
            setLoading(false);
        }
    }
  

        // CNAES SECTION 
            useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setShowDropdown(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

 

        // Adiciona CNAE
        const addCnae = (cnaeId: string) => {
            if (!mdrData?.mcc?.includes(cnaeId)) {
                setMdrForm(prev => ({ ...prev, mccs: [...prev.mcc, cnaeId] }));
            }
            setSearchTerm('');
        };

        // Remove CNAE
        const removeCnae = (cnaeId: string) => {
            setMdrForm(prev => ({ ...prev, mcc: prev.mcc.filter(id => id !== cnaeId) }));
        };

        const getCnaeCode = (label: string) => {
        const match = label.match(/\(([^)]+)\)/);
        return match ? match[1] : label.substring(0, 10);
    };


  // Wrapper para adicionar CNAE que atualiza o estado local também
  const handleAddCnae = (cnaeId: string) => {
    // Atualiza o estado local
    const currentMcc = mdrForm.mcc || [];
    if (!currentMcc.includes(cnaeId)) {
      setMdrForm({ ...mdrForm, mcc: [...currentMcc, cnaeId] });
    }
    // Chama a função externa
    addCnae(cnaeId);
  };

  // Wrapper para remover CNAE que atualiza o estado local também
  const handleRemoveCnae = (cnaeId: string) => {
    // Atualiza o estado local
    const currentMcc = mdrForm.mcc || [];
    setMdrForm({ ...mdrForm, mcc: currentMcc.filter((id) => id !== cnaeId) });
    // Chama a função externa
    removeCnae(cnaeId);
  };

 

    async function fetchCnaeOptions(q = ''){
        const res = await fetch(`/api/cnaes?q=${encodeURIComponent(q)}`);
        return res.json() as Promise<Array<{id: string; name: string; cnae: string}>>;
    }


        useEffect(() => {
            if(categoriesProp && categoriesProp.length > 0){
                setCategories(categoriesProp)
            } else { 
                fetchCnaeOptions().then(data => setCategories(data.map(d => ({
                    id: String(d.id),
                    label: `${d.name} (${d.cnae})`
                }))))
            }
        }, [categoriesProp])

    
          

            const handleInputClick = () => {
            setShowDropdown(true);
        };

    const handleInputChange = (field: keyof FornecedorMDRForm, e: React.ChangeEvent <HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            const { name, value, type } = e.target;
        if (name === 'mcc' && e.target instanceof HTMLSelectElement && e.target.multiple) {
        const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
            setMdrForm(prev => ({ ...prev, mcc: selectedOptions }));
            return
        }
        setMdrForm(prev => ({...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }) );
  };

  const handleSubmit = async (e: React.FormEvent) =>{
    e.preventDefault();
    setLoading(true);
    const payload = {...mdrForm} as FornecedorMDRForm;
    await onSubmit(mdrForm);
    setLoading(false);

  }


    // Bandeiras fixas
    const BANDEIRAS = ["Visa", "Mastercard", "Elo", "Amex", "Hipercard"];

    // Função para pegar a imagem da bandeira (crie se não existir)
    const getCardImage = (brandName: string): string => {
    const brandMap: Record<string, string> = {
        'Visa': "./../../../public/visa.svg",
        'Mastercard': "./../../../public/mastercard.svg",
        'Elo': "./../../../public/elo.svg",
        'Amex': "./../../../public/visa.svg",
        'Hipercard': "./../../../public/visa.svg",
    };
    return brandMap[brandName] || '';
    };


        
  const renderMDRForm = () => {
    return (
    <form onSubmit={handleSubmit}>
      <div className="w-full">
        {/* Seletor de CNAE */}
        <div className="mb-6">
          <div ref={dropdownRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CNAE *
            </label>

            <div
              className="w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent flex flex-wrap items-center gap-2 cursor-text"
              onClick={handleInputClick}
            >
              {/* Chips dos selecionados */}
              {mdrForm.mcc &&
                mdrForm.mcc.length > 0 &&
                mdrForm.mcc.map((mccId: string) => {
                  const cnae = categories.find((c) => c.id === mccId);
                  if (!cnae) return null;

                  const code = getCnaeCode(cnae.label);

                  return (
                    <div
                      key={mccId}
                      className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
                      title={cnae.label}
                    >
                      <span>{code}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCnae(mccId);
                        }}
                        className="hover:bg-blue-200 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
                    

              {/* Input de busca inline */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(true);
                }}
                placeholder={
                  mdrForm.mcc && mdrForm.mcc.length === 0 ? "Buscar CNAEs..." : ""
                }
                className="flex-1 min-w-[120px] outline-none border-0 p-0 text-sm"
              />
            </div>

            {/* Dropdown */}
            {showDropdown && categories.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {categories
                  .filter(
                    (c) =>
                      c.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
                      (!mdrForm.mcc || !mdrForm.mcc.includes(c.id))
                  )
                  .map((cnae) => (
                    <div
                      key={cnae.id}
                      onClick={() => handleAddCnae(cnae.id)}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                    >
                      {cnae.label}
                    </div>
                  ))}
                {categories.filter(
                  (c) =>
                    c.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
                    (!mdrForm.mcc || !mdrForm.mcc.includes(c.id))
                ).length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    {searchTerm
                      ? "Nenhum CNAE encontrado"
                      : "Todos os CNAEs selecionados"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
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
                          <div className="flex items-center gap-2">
                            {getCardImage(bandeira) && (
                              <Image
                                src={getCardImage(bandeira)}
                                alt={bandeira}
                                width={40}
                                height={24}
                                className="object-contain"
                              /> 
                            )}
                            <span className="font-medium text-sm">{bandeira}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="relative w-28">
                            <input
                            type="text"
                            name="nome"
                            value={mdrForm.debitopos}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="relative w-28">
                            <Input
                              type="text"
                              value={mdrForm?.creditopos || ""}
                              onChange={handleInputChange}
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
                              value={mdrForm?.credito2xpos || ""}
                              onChange={handleInputChange}
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
                              value={mdrForm.credito7xpos || ""}
                              onChange={handleInputChange}
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
                              value={mdrForm.voucherpos || ""}
                              onChange={handleInputChange}
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

              <div className="mt-8 bg-white rounded-lg p-4 border border-gray-200">
                <h2 className="text-lg font-semibold mb-6 text-gray-800">
                  Outras Taxas POS
                </h2>
                <div className="flex flex-wrap gap-6">
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-600 mb-2">Pré-Pago</p>
                    <div className="relative w-28">
                      <Input
                        type="text"
                        value={mdrForm.prepos || ""}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="pr-8 text-sm h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-600 mb-2">MDR</p>
                    <div className="relative w-28">
                      <Input
                        type="text"
                        value={mdrForm.mdrpos || ""}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="pr-8 text-sm h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-600 mb-2">Custo Mínimo (R$)</p>
                    <div className="relative w-28">
                      <Input
                        type="text"
                        value={mdrForm.cminpos || ""}
                        onChange={(e) => handleInputChange("cminpos", e.target.value)}
                        placeholder="0.00"
                        className="text-sm h-9"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-600 mb-2">Custo Máximo (R$)</p>
                    <div className="relative w-28">
                      <Input
                        type="text"
                        value={mdrForm.cmaxpos || ""}
                        onChange={(e) => handleInputChange("cmaxpos", e.target.value)}
                        placeholder="0.00"
                        className="text-sm h-9"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-600 mb-2">Antecipação</p>
                    <div className="relative w-28">
                      <Input
                        type="text"
                        value={mdrForm.antecipacao || ""}
                        onChange={(e) => handleInputChange("antecipacao", e.target.value)}
                        placeholder="0.00"
                        className="pr-8 text-sm h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-700 mb-3 bg-gray-100 p-2 rounded">
              Taxas Transações Online
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
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
                        <div className="flex items-center gap-2">
                            {getCardImage(bandeira) && (
                              <Image
                                src={getCardImage(bandeira)}
                                alt={bandeira}
                                width={40}
                                height={24}
                                className="object-contain"
                              />
                            )}
                            <span className="font-medium text-sm">{bandeira}</span>
                          </div>
                        <td className="py-3 px-4">
                          <div className="relative w-28">
                            <Input
                              type="text"
                              value={mdrForm.debitoonline || ""}
                              onChange={(e) => handleInputChange("debitoonline", e.target.value)}
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
                              value={mdrForm.creditoonline || ""}
                              onChange={(e) => handleInputChange("creditoonline", e.target.value)}
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
                              value={mdrForm.credito2xonline || ""}
                              onChange={(e) => handleInputChange("credito2xonline", e.target.value)}
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
                              value={mdrForm.credito7xonline || ""}
                              onChange={(e) => handleInputChange("credito7xonline", e.target.value)}
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
                              value={mdrForm.voucheronline || ""}
                              onChange={(e) => handleInputChange("voucheronline", e.target.value)}
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

              <div className="mt-8 bg-white rounded-lg p-4 border border-gray-200">
                <h2 className="text-lg font-semibold mb-6 text-gray-800">
                  Outras Taxas Online
                </h2>
                <div className="flex flex-wrap gap-6">
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-600 mb-2">Pré-Pago</p>
                    <div className="relative w-28">
                      <Input
                        type="text"
                        value={mdrForm.preonline || ""}
                        onChange={(e) => handleInputChange("preonline", e.target.value)}
                        placeholder="0.00"
                        className="pr-8 text-sm h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-600 mb-2">MDR</p>
                    <div className="relative w-28">
                      <Input
                        type="text"
                        value={mdrForm.mdronline || ""}
                        onChange={(e) => handleInputChange("mdronline", e.target.value)}
                        placeholder="0.00"
                        className="pr-8 text-sm h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-600 mb-2">Custo Mínimo (R$)</p>
                    <div className="relative w-28">
                      <Input
                        type="text"
                        value={mdrForm.cminonline || ""}
                        onChange={(e) => handleInputChange("cminonline", e.target.value)}
                        placeholder="0.00"
                        className="text-sm h-9"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-600 mb-2">Custo Máximo (R$)</p>
                    <div className="relative w-28">
                      <Input
                        type="text"
                        value={mdrForm.cmaxonline || ""}
                        onChange={(e) => handleInputChange("cmaxonline", e.target.value)}
                        placeholder="0.00"
                        className="text-sm h-9"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-600 mb-2">Antecipação</p>
                    <div className="relative w-28">
                      <Input
                        type="text"
                        value={mdrForm.antecipacaoonline || ""}
                        onChange={(e) => handleInputChange("antecipacaoonline", e.target.value)}
                        placeholder="0.00"
                        className="pr-8 text-sm h-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">%</span>
                    </div>
                    </div>
                </div>
              </div>
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
                    onClick={handleSubmitMDR}
                >
                    {loading ? "Salvando..." : isEditing ? "Atualizar" : "Cadastrar"}
                </button>
                </div>
            </div>
      </form>

    );
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
                <CardContent className="space-y-6">{renderMDRForm()}</CardContent>
            </Card>
            </div>
 
        )
        

}