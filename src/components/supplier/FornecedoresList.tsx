'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Fornecedor } from '@/types/fornecedor';
import { FornecedorCard } from './FornecedorCard';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categories, setCategories] = useState<Array<{ id: string; label: string }>>([]);
  const canEdit = role === 'admin' || role === 'user';
  const canDelete = role === 'admin';
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Debounce para busca
  const handleSearchChange = (value: string) => {
    setSearchValue(value);

    // Limpar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Novo timer para debounce
    debounceTimerRef.current = setTimeout(() => {
      setSearch(value.trim());
      setPage(1); // Reset para primeira página ao buscar
    }, 300);
  };

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
    <div className="w-full overflow-x-hidden bg-[#161616] space-y-5">
      {/* Topbar: busca + filtro + botão novo */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* left group: busca + filtro */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Campo de busca com debounce */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#616161] z-10" />
            <Input
              type="text"
              placeholder="Buscar por nome, CNPJ..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 h-[42px] bg-[#424242] border border-[#353535] rounded-[6px] text-[#E0E0E0] placeholder:text-[#E0E0E0] focus-visible:ring-2 focus-visible:ring-[#555555] focus-visible:border-[#555555]"
            />
          </div>

          {/* Filtro de status */}
          <select
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
              setPage(1);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 h-[42px] border border-[#2E2E2E] bg-[#212121] hover:bg-[#2E2E2E] transition-colors rounded-[6px] text-sm font-normal text-[#E0E0E0] cursor-pointer"
            title="Filtros"
          >
            <option value="all" className="bg-[#212121] text-[#E0E0E0]">Todos</option>
            <option value="active" className="bg-[#212121] text-[#E0E0E0]">Ativos</option>
            <option value="inactive" className="bg-[#212121] text-[#E0E0E0]">Inativos</option>
          </select>
        </div>

        {/* right: botão novo fornecedor */}
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-4 py-2 h-[42px] bg-[#212121] border border-[#2E2E2E] hover:bg-[#2E2E2E] transition-colors rounded-[6px] text-sm font-normal text-[#E0E0E0] whitespace-nowrap"
        >
          + Novo Fornecedor
        </button>
      </div>

      {/* Lista horizontal de cards */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1D1D1D] border border-[rgba(255,255,255,0.1)] rounded-[6px] h-[72px] animate-pulse" />
          ))}
        </div>
      ) : fornecedores.length === 0 ? (
        <div className="w-full p-7 text-center border border-[rgba(255,255,255,0.1)] rounded-[6px] bg-[#1D1D1D]">
          <p className="text-[#5C5C5C] text-sm font-normal">Nenhum fornecedor encontrado.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
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
                className="p-2 rounded-[6px] border border-[#2E2E2E] bg-[#212121] hover:bg-[#2E2E2E] disabled:opacity-50 disabled:cursor-not-allowed text-[#E0E0E0] transition-colors"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <span className="text-sm text-[#5C5C5C] font-normal">
                Página {page} de {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-[6px] border border-[#2E2E2E] bg-[#212121] hover:bg-[#2E2E2E] disabled:opacity-50 disabled:cursor-not-allowed text-[#E0E0E0] transition-colors"
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
