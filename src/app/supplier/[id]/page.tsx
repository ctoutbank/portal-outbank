'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Fornecedor, FornecedorFormData } from '@/types/fornecedor';
import { Loader2, Building2, CreditCard, Landmark, Check, AlertCircle, Pencil, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { FornecedorForm } from '@/components/supplier/FornecedorForm';
import { FornecedorModal } from '@/components/supplier/FornecedorModal';
import { Input } from '@/components/ui/input';
import { MdrCompletionBadge } from '@/components/supplier/MdrCompletionBadge';
import { getMdrCompletionStatus } from '@/lib/utils/mdr-completion';
import BaseHeader from '@/components/layout/base-header';
import BaseBody from '@/components/layout/base-body';

interface CategoryWithMdr {
  id: number | string;
  name: string;
  cnae: string | null;
  mcc: string;
  slug: string;
  active: boolean;
  has_mdr: boolean;
  mdr_id: string | null;
  suporta_pos?: boolean;
  suporta_online?: boolean;
  mdr_data?: Record<string, string | null> | null;
}

interface FornecedorWithCategories extends Omit<Fornecedor, 'categories'> {
  categories: CategoryWithMdr[];
}

type TabType = 'dados' | 'adquirencia' | 'banking' | 'cards';
type StatusFilter = 'all' | 'with_mdr' | 'without_mdr';

export default function FornecedorDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [fornecedor, setFornecedor] = useState<FornecedorWithCategories | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('adquirencia');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const supplierRes = await fetch(`/api/supplier/${params.id}`);
        if (!supplierRes.ok) {
          toast.error('Fornecedor não encontrado');
          router.push('/supplier');
          return;
        }
        const supplierData = await supplierRes.json();
        setFornecedor(supplierData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar fornecedor');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchData();
    }
  }, [params.id, router]);

  const handleEditSubmit = async (formData: FornecedorFormData) => {
    try {
      setEditLoading(true);
      const response = await fetch(`/api/supplier/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const result = await response.json();
        toast.error(result.error || 'Erro ao atualizar fornecedor');
        return;
      }

      const updated = await response.json();
      setFornecedor(prev => prev ? { ...prev, ...updated } : null);
      setIsEditModalOpen(false);
      toast.success('Fornecedor atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      toast.error('Erro de conexão. Tente novamente');
    } finally {
      setEditLoading(false);
    }
  };

  const toBoolean = (val: unknown, defaultValue = true): boolean => {
    if (val === undefined || val === null) return defaultValue;
    if (val === false || val === 'false') return false;
    if (val === true || val === 'true') return true;
    return defaultValue;
  };

  const allCnaes = useMemo(() => {
    if (!fornecedor?.categories || !Array.isArray(fornecedor.categories)) {
      return [];
    }

    return fornecedor.categories.map((cat) => {
      const completionInfo = getMdrCompletionStatus(
        cat.mdr_data,
        toBoolean(cat.suporta_pos),
        toBoolean(cat.suporta_online)
      );

      return {
        id: cat.id,
        codigo: cat.cnae || '',
        nome: cat.name || '',
        mcc: cat.mcc || String(cat.id),
        cnae: cat.cnae,
        name: cat.name,
        hasMdr: cat.has_mdr || false,
        completionStatus: completionInfo.status,
        completionPercentage: completionInfo.percentage,
      };
    });
  }, [fornecedor?.categories]);

  const filteredCnaes = useMemo(() => {
    let result = allCnaes;

    if (statusFilter === 'with_mdr') {
      result = result.filter(c => c.hasMdr);
    } else if (statusFilter === 'without_mdr') {
      result = result.filter(c => !c.hasMdr);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        (c.nome || '').toLowerCase().includes(term) ||
        (c.codigo || '').toLowerCase().includes(term) ||
        String(c.mcc || '').toLowerCase().includes(term)
      );
    }

    result = [...result].sort((a, b) => {
      if (a.hasMdr && !b.hasMdr) return -1;
      if (!a.hasMdr && b.hasMdr) return 1;
      const aHasCnae = !!((a.codigo ?? '').trim());
      const bHasCnae = !!((b.codigo ?? '').trim());
      if (aHasCnae && !bHasCnae) return -1;
      if (!aHasCnae && bHasCnae) return 1;
      const aId = typeof a.id === 'number' ? a.id : parseInt(String(a.id), 10);
      const bId = typeof b.id === 'number' ? b.id : parseInt(String(b.id), 10);
      if (!isNaN(aId) && !isNaN(bId)) {
        return bId - aId;
      }
      return 0;
    });

    return result;
  }, [allCnaes, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredCnaes.length / itemsPerPage);

  const paginatedCnaes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCnaes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCnaes, currentPage, itemsPerPage]);

  const prevSearchTerm = useRef(searchTerm);
  const prevStatusFilter = useRef(statusFilter);
  const prevItemsPerPage = useRef(itemsPerPage);

  useEffect(() => {
    if (
      prevSearchTerm.current !== searchTerm ||
      prevStatusFilter.current !== statusFilter ||
      prevItemsPerPage.current !== itemsPerPage
    ) {
      setCurrentPage(1);
      prevSearchTerm.current = searchTerm;
      prevStatusFilter.current = statusFilter;
      prevItemsPerPage.current = itemsPerPage;
    }
  }, [searchTerm, statusFilter, itemsPerPage]);

  const tabelasComTaxas = allCnaes.filter(c => c.hasMdr).length;
  const tabelasSemTaxas = allCnaes.filter(c => !c.hasMdr).length;

  const tabs = [
    { id: 'dados' as TabType, label: 'Dados', icon: Building2 },
    { id: 'adquirencia' as TabType, label: 'Adquirência', icon: CreditCard },
    { id: 'banking' as TabType, label: 'Banking', icon: Landmark },
    { id: 'cards' as TabType, label: 'Cards & Credits', icon: CreditCard },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  if (!fornecedor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <BaseHeader
        breadcrumbItems={[
          { title: 'Fornecedores', url: '/supplier' },
          { title: fornecedor.nome }
        ]}
        showBackButton={true}
        backHref="/supplier"
      />
      <BaseBody
        title={fornecedor.nome}
        subtitle={`CNPJ: ${fornecedor.cnpj}`}
        actions={
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#212121] border border-[#2E2E2E] text-white rounded-[6px] hover:bg-[#2E2E2E] transition cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
            Editar
          </button>
        }
      >
        <div className="border-b border-[rgba(255,255,255,0.1)] mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition cursor-pointer ${activeTab === tab.id
                      ? 'border-white text-white'
                      : 'border-transparent text-[#5C5C5C] hover:text-white'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {activeTab === 'dados' && (
          <div className="bg-[#171717] rounded-[6px] border border-[rgba(255,255,255,0.1)] p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Informações do Fornecedor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#5C5C5C] mb-1">Nome</label>
                <p className="text-white">{fornecedor.nome}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5C5C5C] mb-1">CNPJ</label>
                <p className="text-white">{fornecedor.cnpj}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5C5C5C] mb-1">Email</label>
                <p className="text-white">{fornecedor.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5C5C5C] mb-1">Telefone</label>
                <p className="text-white">{fornecedor.telefone || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5C5C5C] mb-1">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-[6px] ${fornecedor.ativo
                    ? 'bg-green-900 text-green-200'
                    : 'bg-red-900 text-red-200'
                  }`}>
                  {fornecedor.ativo ? 'ATIVO' : 'INATIVO'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'adquirencia' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#171717] rounded-[6px] border border-[rgba(255,255,255,0.1)] p-4">
                <div className="text-2xl font-bold text-white">{allCnaes.length}</div>
                <div className="text-sm text-[#5C5C5C]">Total de Tabelas</div>
              </div>
              <div className="bg-[#171717] rounded-[6px] border border-green-800 p-4">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <div className="text-2xl font-bold text-green-500">{tabelasComTaxas}</div>
                </div>
                <div className="text-sm text-[#5C5C5C]">Com Taxas (Prontas para Margem)</div>
              </div>
              <div className="bg-[#171717] rounded-[6px] border border-orange-800 p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <div className="text-2xl font-bold text-orange-500">{tabelasSemTaxas}</div>
                </div>
                <div className="text-sm text-[#5C5C5C]">Sem Taxas (Pendentes)</div>
              </div>
            </div>

            <div className="bg-[#171717] rounded-[6px] border border-[rgba(255,255,255,0.1)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)]">
                <h3 className="text-lg font-semibold text-white">
                  Tabelas de MDR (MCCs)
                </h3>
                <p className="text-sm text-[#5C5C5C] mt-1">
                  Lista de MCCs vinculados a este fornecedor
                </p>
              </div>

              <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.1)] flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#616161] z-10" />
                  <Input
                    type="text"
                    placeholder="Buscar por MCC, CNAE ou nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 h-[42px] bg-[#212121] border border-[#2E2E2E] rounded-[6px] text-white placeholder:text-[#616161] focus-visible:ring-2 focus-visible:ring-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#616161]" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="h-[42px] px-4 bg-[#212121] border border-[#2E2E2E] rounded-[6px] text-white text-sm cursor-pointer"
                  >
                    <option value="all">Todos</option>
                    <option value="with_mdr">Com Taxas</option>
                    <option value="without_mdr">Sem Taxas</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1D1D1D] border-b border-[rgba(255,255,255,0.1)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#5C5C5C] uppercase tracking-wider">
                        MDR
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#5C5C5C] uppercase tracking-wider">
                        CNAE
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#5C5C5C] uppercase tracking-wider">
                        MCC
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#5C5C5C] uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[#5C5C5C] uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                    {paginatedCnaes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-[#5C5C5C]">
                          {searchTerm || statusFilter !== 'all'
                            ? 'Nenhum MCC encontrado com os filtros aplicados'
                            : 'Nenhum MCC associado a este fornecedor'}
                        </td>
                      </tr>
                    ) : (
                      paginatedCnaes.map((cnae) => (
                        <tr key={cnae.id} className="hover:bg-[#1D1D1D] transition cursor-pointer" onClick={() => router.push(`/supplier/${params.id}/cnae/${cnae.id}`)}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <MdrCompletionBadge
                              status={cnae.completionStatus}
                              percentage={cnae.completionPercentage}
                              showPercentage={cnae.completionStatus === 'incompleta'}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {cnae.codigo || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {cnae.mcc || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-white max-w-[300px] truncate">
                            {cnae.nome || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/supplier/${params.id}/cnae/${cnae.id}`); }}
                              className="px-3 py-1.5 text-sm font-medium rounded-[6px] bg-[#212121] border border-[#2E2E2E] text-white hover:bg-[#2E2E2E] transition cursor-pointer"
                            >
                              {cnae.hasMdr ? 'Editar' : 'Configurar'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredCnaes.length > 0 && (
                <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.1)] flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="h-[36px] px-3 bg-[#212121] border border-[#2E2E2E] rounded-[6px] text-white text-sm cursor-pointer"
                      title="Itens por página"
                    >
                      <option value={20}>20 por página</option>
                      <option value={50}>50 por página</option>
                      <option value={100}>100 por página</option>
                    </select>
                    <span className="text-sm text-[#5C5C5C]">
                      Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, filteredCnaes.length)} - {Math.min(currentPage * itemsPerPage, filteredCnaes.length)} de {filteredCnaes.length} tabelas
                    </span>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-[6px] border border-[#2E2E2E] bg-[#212121] hover:bg-[#2E2E2E] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                        aria-label="Página anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <span className="text-sm text-[#5C5C5C]">
                        Página {currentPage} de {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-[6px] border border-[#2E2E2E] bg-[#212121] hover:bg-[#2E2E2E] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                        aria-label="Próxima página"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'banking' && (
          <div className="bg-[#171717] rounded-[6px] border border-[rgba(255,255,255,0.1)] p-12 text-center">
            <Landmark className="w-16 h-16 text-[#2E2E2E] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Banking
            </h3>
            <p className="text-[#5C5C5C]">
              Em breve: configurações de banking e serviços bancários
            </p>
          </div>
        )}

        {activeTab === 'cards' && (
          <div className="bg-[#171717] rounded-[6px] border border-[rgba(255,255,255,0.1)] p-12 text-center">
            <CreditCard className="w-16 h-16 text-[#2E2E2E] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Cards & Credits
            </h3>
            <p className="text-[#5C5C5C]">
              Em breve: configurações de cartões e crédito
            </p>
          </div>
        )}
      </BaseBody>

      <FornecedorModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Fornecedor"
      >
        {editLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Salvando...</span>
          </div>
        ) : (
          <FornecedorForm
            initialData={{
              nome: fornecedor.nome,
              cnpj: fornecedor.cnpj,
              email: fornecedor.email,
              telefone: fornecedor.telefone,
              ativo: fornecedor.ativo,
            }}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditModalOpen(false)}
            isEditing={true}
          />
        )}
      </FornecedorModal>
    </div>
  );
}
