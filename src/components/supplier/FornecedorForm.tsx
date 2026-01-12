'use client';

import { useState, useEffect } from 'react';
import { FornecedorFormData } from '@/types/fornecedor';
import { toast } from 'sonner';

interface FornecedorFormProps {
    initialData?: Partial<FornecedorFormData>;
    onSubmit: (data: FornecedorFormData) => Promise<void>;
    onCancel: () => void;
    isEditing: boolean;
}

export function FornecedorForm({
    initialData,
    onSubmit,
    onCancel,
    isEditing = false,
}: FornecedorFormProps) {
    
    const [formData, setFormData] = useState<FornecedorFormData>({
        nome: initialData?.nome || '',
        cnpj: initialData?.cnpj || '',
        email: initialData?.email || '',
        telefone: initialData?.telefone || '',
        ativo: initialData?.ativo ?? true,
    });
  
    const [loading, setLoading] = useState(false);
    const [cnpjError, setCnpjError] = useState<string | null>(null);

    const normalizeCNPJ = (input: string) => (input ?? '').replace(/\D/g, '');

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

    const formatTelefone = (digits: string) => {
        const d = digits.replace(/\D/g, '').slice(0, 11);
        if (d.length <= 2) return `(${d}`;
        if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
        if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
        return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;

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

        if (name === 'telefone') {
            const masked = formatTelefone(value);
            setFormData(prev => ({ ...prev, telefone: masked }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    }

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
            
            await onSubmit(payload);
            
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
            <div className='bg-white dark:bg-[#171717] border border-gray-100 dark:border-gray-700 shadow-sm p-6 rounded-lg'>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {isEditing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nome *
                        </label>
                        <input
                            type="text"
                            name="nome"
                            value={formData.nome}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100"
                            required
                            placeholder="Nome do fornecedor"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            CNPJ *
                        </label>
                        <input
                            type="text"
                            name="cnpj"
                            value={formData.cnpj}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100"
                            required
                            placeholder="00.000.000/0000-00"
                        />
                        {cnpjError && <p className="text-sm text-red-600 mt-1">{cnpjError}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100"
                            required
                            placeholder="email@fornecedor.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Telefone *
                        </label>
                        <input
                            type="text"
                            name="telefone"
                            value={formData.telefone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100"
                            required
                            placeholder="(00) 00000-0000"
                        />
                    </div>

                    <div className="flex items-center col-span-2">
                        <input
                            type="checkbox"
                            name="ativo"
                            checked={formData.ativo}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="ativo" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Fornecedor ativo
                        </label>
                    </div>

                    <div className="col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg transition cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    )
}
