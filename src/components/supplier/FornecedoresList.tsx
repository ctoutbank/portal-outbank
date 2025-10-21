'use client';
import {useState, useEffect, useCallback} from 'react';
import { Fornecedor } from '@/types/fornecedor';
import { FornecedorCard } from './FornecedorCard';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface FornecedoresListProps {
    role: 'admin' | 'user' | 'viewer';
    onEdit: (fornecedor: Fornecedor) => void;
    onDelete: (id: string) => void;
    // optional key to force reload from parent
    refreshKey?: number;

}

export function FornecedoresList({ role, onEdit, onDelete, refreshKey }: FornecedoresListProps) {
    const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const canEdit = role === 'admin' || role === 'user';
    const canDelete = role === 'admin';

    const loadFornecedores = useCallback(async () => {
        setLoading(true);
        try{
            const params = new URLSearchParams();
            params.append('page', page.toString());
            if (search) params.append('search', search);
            if (statusFilter !== 'all') {
                
                params.append('status', statusFilter);
            }
            const res = await fetch(`/api/supplier?${params}`,
                {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                   
                }
            );
            if (!res.ok) {
                const text = await res.text();
                console.error('Error response from /api/supplier', res.status, text);
                
                setFornecedores([]);
                setTotalPages(1);
                return;
            }
            let data: any;
            try {
                data = await res.json();
            } catch {
                // body wasn't valid JSON — capture raw text to help debugging
                const text = await res.clone().text();
                console.error('Invalid JSON from /api/supplier:', text);
                setFornecedores([]);
                setTotalPages(1);
                return;
            }
            setFornecedores(data.data);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Error loading fornecedores:', error);
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => {
        loadFornecedores();
    }, [loadFornecedores, refreshKey]);

    // loadFornecedores is declared above with useCallback

    return (
        <div className='space-y-6'>
            <div className='bg-white p-4 rounded-lg shadow-sm'>
                <div className='flex flex-col md:flex-row gap-4'>
                    <div className='flex-1 relative'>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"/>
                        <input
                            type="text"
                            placeholder="Nome, CNPJ..."
                            value={search}
                            onChange={(e) => {setSearch(e.target.value); setPage(1);}}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transaparent"
                        />
                    </div>
                    <select 
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value as any);
                        setPage(1);
                    }}
                    className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    >
                        <option value="all">Todos</option>
                        <option value="active">Ativos</option>
                        <option value="inactive">Inativos</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-200 animate-pulse h-64 rounded-lg" />
                    ))}
                </div>
            ) : fornecedores.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <p className="text-gray-500">Nenhum fornecedor encontrado.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">  
                        {fornecedores.map((fornecedor) => (
                            <FornecedorCard 
                            key={fornecedor.id}
                            fornecedor={fornecedor}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            canDelete={canDelete}
                            canEdit={canEdit}
                            />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className='flex justify-center items-center gap-4 pt-6'>
                            <button
                            onClick={() => setPage(p => Math.max(1, p - 1 ))}
                            disabled={page === 1}
                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"/>
                            <ChevronLeft className="h-5 h-5"/>
                            <span className='text-sm text-gray-600'>Página {page} de {totalPages}</span>
                            <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1 ))}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"/>
                            <ChevronRight className="h-5 h-5"/>
                        </div>
                        
                    )}
                </>
            )}
        </div>
    )


}