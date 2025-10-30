'use client';
import { useState, useEffect, useCallback } from 'react';
import { Fornecedor } from '@/types/fornecedor';
import { FornecedorCard } from './FornecedorCard';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface FornecedoresListProps {
  role: 'admin' | 'user' | 'viewer';
  onEdit: (fornecedor: Fornecedor) => void;
  onDelete: (id: string) => void;
  refreshKey?: number;
  onAdd: () => Promise<void>;
}

export function FornecedoresList({ role, onAdd, onEdit, onDelete, refreshKey }: FornecedoresListProps) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categories, setCategories] = useState<Array<{ id: string; label: string }>>([]);
  const canEdit = role === 'admin' || role === 'user';
  const canDelete = role === 'admin';

  interface CnaeResponse {
    id: string | number;
    name: string;
    cnae: string;
  }

  const loadFornecedores = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('ativo', statusFilter);

      const res = await fetch(`/api/supplier?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Error response from app/api/supplier', res.status, text);
        setFornecedores([]);
        setTotalPages(1);
        return;
      }

      let data: { data: Fornecedor[]; totalPages: number };
      try {
        data = await res.json();
      } catch {
        const text = await res.clone().text();
        console.error('Invalid JSON from ./app/api/supplier:', text);
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
    async function fetchCnaes() {
      try {
        const res = await fetch('/api/cnaes');
        const data = await res.json();
        setCategories(
          data.map((d: CnaeResponse) => ({
            id: String(d.id),
            label: `${d.name} (${d.cnae})`,
          }))
        );
      } catch (err) {
        console.error('Erro carregando CNAEs', err);
      }
    }
    fetchCnaes();
  }, []);

  useEffect(() => {
    loadFornecedores();
  }, [loadFornecedores, refreshKey]);

  return (
    <div className="space-y-6">
      {/* Topbar: busca pequena + filtro (left)  |  botão Novo (right) */}
      <div className="flex items-center dark:bg-[#171717] dark:text-white justify-between gap-4">
        {/* left group: busca pequena + filtro */}
        <div className="flex items-center gap-3">
          <div className="relative border border-gray-200 dark:bg-[#171717] text-white rounded-lg shadow-sm px-3 py-2 flex items-center gap-2 min-w-[320px]">
            <Search className="w-4 h-4 text-gray-400 dark:bg-[#171717] dark:text-white" />
            <input
              type="text"
              placeholder="Buscar fornecedores..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="outline-none text-sm w-full placeholder:text-gray-400"
            />
          </div>

          <select
            onChange={(e) => {
              // alterna o filtro simples (só visual) - você pode substituir por modal
              setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' );
              setPage(1);
            }}
            className="inline-flex items-center gap-2 bg-white text-black dark:bg-[#171717] dark:text-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm text-sm hover:shadow-md"
            title="Filtros"
          >
            
            
            <option value="all">Todos</option>
            <option value="active">Ativos </option>
            <option value="inactive">Inativos </option>
          </select>
        </div>

        {/* right: botão novo fornecedor */}
        <div>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm text-sm font-medium"
          >
            + Novo Fornecedor
          </button>
        </div>
      </div>

      {/* Grid de cards (sem o frame branco externo) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 animate-pulse h-40 rounded-lg" />
          ))}
        </div>
      ) : fornecedores.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum fornecedor encontrado.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fornecedores.map((fornecedor) => (
              <FornecedorCard
                key={fornecedor.id}
                fornecedor={fornecedor}
                categories={categories}
                onEdit={onEdit}
                onDelete={onDelete}
                canDelete={canDelete}
                canEdit={canEdit}
              />
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <span className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Próxima página"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
