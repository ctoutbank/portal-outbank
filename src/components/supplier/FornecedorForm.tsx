'use client';

import {useState, useEffect, useRef} from 'react';
import { FornecedorFormData, FornecedorMDRForm } from '@/types/fornecedor';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface FornecedorFormProps {
    initialData?: Partial<FornecedorFormData>;
    onSubmit: (data: FornecedorFormData, files: File[], mdr?: FornecedorMDRForm) => Promise<void>;
    mdrData?: Partial<FornecedorMDRForm>;
    onCancel: () => void;
    isEditing: boolean;
    categories: Array<{ id: string; label: string; mcc?: string }>;
}

export function FornecedorForm({
    initialData,
    onSubmit,
    onCancel,
    isEditing = false,
    categories: categoriesProp,
}: FornecedorFormProps) {
    
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [categories, setCategories] = useState<Array<{ id: string; label: string; mcc?: string }>>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    
    const [formData, setFormData] = useState<FornecedorFormData>({
        nome: initialData?.nome || '',
        cnpj: initialData?.cnpj || '',
        email: initialData?.email || '',
        telefone: initialData?.telefone || '',
        cidade: initialData?.cidade || '',
        estado: initialData?.estado || '',
        contato_principal: initialData?.contato_principal || '',
        endereco: initialData?.endereco || '',
        cep: initialData?.cep || '',
        observacoes: initialData?.observacoes || '',
        mcc: initialData?.mcc || [],
        ativo: initialData?.ativo ?? true,
    });
  
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [cnpjError, setCnpjError] = useState<string | null>(null);
    const [mdrData, setMdrData] = useState<FornecedorMDRForm | null>(null);

    const normalizeCNPJ = (input: string) => (input ?? '').replace(/\D/g, '');

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
  // cnaeId aqui é o ID do CNAE (ex: "67"), NÃO o MCC
  const currentMcc = formData.mcc || [];
  if (!currentMcc.includes(cnaeId)) {
    setFormData((prev) => ({ ...prev, mcc: [...currentMcc, cnaeId] }));
  }
  setSearchTerm("");
};


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

    async function fetchCnaeOptions(q = "") {
        const res = await fetch(`/api/cnaes?q=${encodeURIComponent(q)}`);
        return res.json() as Promise<Array<{ id: string; name: string; cnae: string; mcc: string }>>;
    }

    useEffect(() => {
        if (initialData?.cnpj) {
            const masked = formatCNPJ(normalizeCNPJ(initialData.cnpj));
            setFormData(prev => ({ ...prev, cnpj: masked }));
        }
    }, [initialData?.cnpj]);

    const formatCNPJ = (digits: string) => {
        const d = digits.replace(/\D/g, '').slice(0, 14);
        if (d.length <= 2) return d;
        if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
        if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
        if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
        return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12,14)}`;
    }

    const validateCNPJ = (raw: string) => {
        const cnpj = normalizeCNPJ(raw);
        if (!cnpj || cnpj.length !== 14) return false;
        if (/^([0-9])\1+$/.test(cnpj)) return false;

        const calc = (cnpjSlice: string, factors: number[]) => {
            let sum = 0;
            for (let i = 0; i < factors.length; i++) {
                sum += parseInt(cnpjSlice.charAt(i), 10) * factors[i];
            }
            const remainder = sum % 11;
            return remainder < 2 ? 0 : 11 - remainder;
        }

        const base12 = cnpj.slice(0, 12);
        const factors1 = [5,4,3,2,9,8,7,6,5,4,3,2];
        const digit1 = calc(base12, factors1);
        if (digit1 !== parseInt(cnpj.charAt(12), 10)) return false;

        const base13 = base12 + String(digit1);
        const factors2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
        const digit2 = calc(base13, factors2);
        if (digit2 !== parseInt(cnpj.charAt(13), 10)) return false;

        return true;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (name === 'mcc' && e.target instanceof HTMLSelectElement && e.target.multiple) {
            const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
            setFormData(prev => ({ ...prev, mcc: selectedOptions }));
            return;
        }

        if (name === 'cnpj') {
            const digits = normalizeCNPJ(value);
            const masked = formatCNPJ(digits);
            setFormData(prev => ({ ...prev, cnpj: masked }));
            if (digits.length === 14) {
                setCnpjError(validateCNPJ(digits) ? null : 'CNPJ inválido');
            } else {
                setCnpjError(null);
            }
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files))
        }
    }

    const removeFile = (index: number) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
    };

    const removeCnae = (cnaeId: string) => {
        setFormData((prev) => ({ ...prev, mcc: (prev.mcc ?? []).filter((id) => id !== cnaeId) }));
    };
    
    const getCnaeCode = (label: string) => {
        const match = label.match(/\(([^)]+)\)/);
        return match ? match[1] : label.substring(0, 10);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const normalizedCNPJ = normalizeCNPJ(formData.cnpj);
            
            if (!validateCNPJ(normalizedCNPJ)) {
                setCnpjError('CNPJ inválido');
                setLoading(false);
                return;
            }

            const payload: FornecedorFormData = { 
                ...formData, 
                cnpj: normalizedCNPJ 
            };
            
            console.log('📤 Enviando dados:', payload);
            console.log('📤 MCCs selecionados:', payload.mcc);
            
            await onSubmit(payload, files, mdrData || undefined);
            
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            const maybeStatus = (error as { status?: number }).status;
            if (message.includes('CNPJ duplicado') || maybeStatus === 409) {
                setCnpjError('CNPJ já cadastrado');
                toast.error('CNPJ já cadastrado');
            } else {
                console.error('Unhandled error submitting fornecedor:', error);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6" onClick={(e) => e.stopPropagation()}>
            <div className='bg-card border border-border shadow-sm p-6 rounded-none'>
                <h3 className="font-semibold text-gray-900 mb-4">Cadastro</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                        <input
                            type="text"
                            name="nome"
                            value={formData.nome}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label>
                        <input
                            type="text"
                            name="cnpj"
                            value={formData.cnpj}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
                            required
                        />
                        {cnpjError && <p className="text-sm text-red-600 mt-1">{cnpjError}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                        <input
                            type="text"
                            name="telefone"
                            value={formData.telefone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
                            required
                            placeholder='(00) 0000-0000'
                        />
                    </div>

                    {/* CNAE */}
                    <div ref={dropdownRef} className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">CNAE *</label>
                        <div
                            className="min-h-[44px] px-3 py-2 border border-border rounded-none focus-within:ring-2 focus-within:ring-ring bg-background cursor-text"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDropdown(true);
                            }}
                        >
                            <div className="flex flex-wrap gap-2">
                                {formData.mcc?.map((mccId: string) => {
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
                                                className="hover:bg-muted rounded-none p-0.5"
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
                                    onFocus={(e) => {
                                        e.stopPropagation();
                                        setShowDropdown(true);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder={formData.mcc?.length === 0 ? "Buscar CNAEs..." : ""}
                                    className="flex-1 min-w-[120px] outline-none border-0 p-0 text-sm bg-transparent"
                                />
                            </div>
                        </div>
                        {showDropdown && categories.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-none shadow-lg max-h-60 overflow-y-auto">
                                {categories
                                    .filter(
                                        (c) =>
                                            c.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
                                            !formData.mcc?.includes(c.id)
                                    )
                                    .map((cnae) => (
                                        <div
                                            key={cnae.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                addCnae(cnae.id);
                                            }}
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
                        <div className="min-h-[44px] px-3 py-2 border border-border rounded-none bg-muted/50">
                            <div className="flex flex-wrap gap-2">
                                {formData.mcc?.map((mccId: string) => {
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
                                {(!formData.mcc || formData.mcc.length === 0) && (
                                    <span className="text-gray-400 text-sm">Selecione um CNAE</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contato Principal</label>
                        <input
                            type="text"
                            name="contato_principal"
                            value={formData.contato_principal}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Endereço *</label>
                        <input
                            type="text"
                            name="endereco"
                            value={formData.endereco}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CEP *</label>
                        <input
                            type="text"
                            name="cep"
                            value={formData.cep}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                        <input
                            type="text"
                            name="cidade"
                            value={formData.cidade}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                        <input
                            type="text"
                            name="estado"
                            value={formData.estado}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                        <textarea
                            name="observacoes"
                            value={formData.observacoes}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="ativo"
                            checked={formData.ativo}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="ativo" className="ml-2 text-sm text-gray-700">Ativo</label>
                    </div>

                    <div className="col-span-2">
                        <div className='bg-gray-50 p-4 rounded-lg'>
                            <h3 className="font-semibold text-gray-900 mb-4">Documentos</h3>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <label className="cursor-pointer">
                                    <span className="text-sm text-gray-700">Clique para fazer upload</span>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx, .jpg, .jpeg, .png"
                                        className="hidden"
                                        multiple
                                        onChange={handleFileChange}
                                    />
                                </label>
                                <p className="text-sm text-gray-500 mt-2">Tipos suportados: PDF, DOC, DOCX, JPG, JPEG, PNG</p>
                            </div>

                            {files.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {files.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg">
                                            <span className="text-sm text-gray-700">{file.name}</span>
                                            <button type="button" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700">
                                                <X className='w-5 h-5' />
                                            </button>
                                        </div>
                                    ))}
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
                            >
                                {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    )
}
