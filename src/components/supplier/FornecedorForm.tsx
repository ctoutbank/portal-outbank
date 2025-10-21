'use client';

import {useState, useEffect} from 'react';
import { FornecedorFormData } from '@/types/fornecedor';
import {Upload, X } from 'lucide-react';

interface FornecedorFormProps {
    initialData?: Partial<FornecedorFormData>;
    onSubmit: (data: FornecedorFormData, files: File[]) => Promise<void>;
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
        cidade: initialData?.cidade || '',
        estado: initialData?.estado || '',
        contato_principal: initialData?.contato_principal || '',
        endereco: initialData?.endereco || '',
        cep: initialData?.cep || '',
        observacoes: initialData?.observacoes || '',
        ativo: initialData?.ativo ?? true,
    });

    const [cnpjError, setCnpjError] = useState<string | null>(null);

    // Helper: keep only digits
    const normalizeCNPJ = (input: string) => (input ?? '').replace(/\D/g, '');

    // Helper: format digits to 00.000.000/0000-00
    const formatCNPJ = (digits: string) => {
        const d = digits.replace(/\D/g, '').slice(0, 14);
        if (d.length <= 2) return d;
        if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
        if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
        if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
        return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12,14)}`;
    }

    // Helper: validate CNPJ checksum
    const validateCNPJ = (raw: string) => {
        const cnpj = normalizeCNPJ(raw);
        if (!cnpj || cnpj.length !== 14) return false;
        // reject same digits
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

    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent <HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (name === 'cnpj') {
            // apply mask while typing
            const digits = normalizeCNPJ(value);
            const masked = formatCNPJ(digits);
            setFormData(prev => ({ ...prev, cnpj: masked }));
            // validate when has full length
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

    const handleFileChange = (e: React.ChangeEvent <HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files))
        }
    }

    const removeFile = (index: number) =>{
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index))
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // normalize CNPJ to digits-only before submitting
            const normalizedCNPJ = normalizeCNPJ(formData.cnpj);
            if (!validateCNPJ(normalizedCNPJ)) {
                setCnpjError('CNPJ inválido');
                setLoading(false);
                return;
            }
            const payload: FornecedorFormData = { ...formData, cnpj: normalizedCNPJ } as FornecedorFormData;
            await onSubmit(payload, files);
        } finally{
            setLoading(false);
        }
    }

    
    useEffect(() => {
        if (initialData?.cnpj) {
            const masked = formatCNPJ(normalizeCNPJ(initialData.cnpj));
            setFormData(prev => ({ ...prev, cnpj: masked }));
        }
    }, [initialData?.cnpj]);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className='bg-white border border-gray-100 shadow-sm p-6 rounded-lg'>
                <h3 className="font-semibold text-gray-900 mb-4">Cadastro</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                        <input
                            type="text"
                            name="nome"
                            value={formData.nome}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            placeholder='(00) 0000-0000'
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contato Principal</label>
                        <input
                            type="text"
                            name="contato_principal"
                            value={formData.contato_principal}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Endereço *</label>
                        <input
                            type="text"
                            name="endereco"
                            value={formData.endereco}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                        <textarea
                            name="observacoes"
                            value={formData.observacoes}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                onClick={handleSubmit}
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