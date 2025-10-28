import { FornecedorMDRForm } from "@/types/fornecedor";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  

                        // Fecha dropdown ao clicar fora
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
            if (!mdrData.mcc.includes(cnaeId)) {
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
            console.log('🖱️ Clicou no input');
            console.log('📚 Categories disponíveis:', categories);
            setShowDropdown(true);
        };

 
        
        return (
            <>
            <div ref={dropdownRef} className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">CNAE *</label>
                
                                    {/* Container que parece um input */}
                                    <div 
                                        className="w-full min-h-[42px] px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent flex flex-wrap items-center gap-2 cursor-text"
                                        onClick={handleInputClick}
                                    >
                                        {/* Chips dos selecionados */}
                                        {mdrForm.mcc && mdrForm.mcc.length > 0 && mdrForm.mcc.map(mccId => {
                                            const cnae = categories.find(c => c.id === mccId);
                                            if (!cnae) return null;
                                            
                                            const code = getCnaeCode(cnae.label);
                                            
                                            return (
                                                <div
                                                    key={mccId}
                                                    className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
                                                    title={cnae.label} // mostra completo no hover
                                                >
                                                    <span>{code}</span>
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
                                            placeholder={mdrForm.mcc.length === 0 ? "Buscar CNAEs..." : ""}
                                            className="flex-1 min-w-[120px] outline-none border-0 p-0 text-sm"
                                        />
                                    </div>
                                    
                                    {/* Dropdown */}
                                    {showDropdown && categories.length > 0 &&(
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {categories
                                                .filter(c => 
                                                    c.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                                    !mdrForm.mcc.includes(c.id)
                                                )
                                                .map(cnae => (
                                                    <div
                                                        key={cnae.id}
                                                        onClick={() => addCnae(cnae.id)}
                                                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                                                    >
                                                        {cnae.label}
                                                    </div>
                                                ))
                                            }
                                            {categories.filter(c => 
                                                c.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                                !mdrForm.mcc.includes(c.id)
                                            ).length === 0 && (
                                                <div className="px-3 py-2 text-sm text-gray-500">
                                                    {searchTerm ? 'Nenhum CNAE encontrado' : 'Todos os CNAEs selecionados'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                type="button"
                                onClick={onCancel}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleSubmitMDR}
                            >
                                {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
                            </button>
                        </div>
            </>
        )
        

}