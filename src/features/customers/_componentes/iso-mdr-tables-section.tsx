'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Table, RefreshCw, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type TableStatus = 'rascunho' | 'validada';

interface LinkedMdrTable {
  id: string;
  linkId: string;
  fornecedorCategoryId: string;
  mcc: string;
  cnae: string;
  categoryName: string;
  status: TableStatus;
  custoConsolidado: {
    debito: string;
    credito: string;
    credito2x: string;
    pix: string;
    antecipacao: string;
  };
  margemIso: {
    debito: string;
    credito: string;
    credito2x: string;
    pix: string;
    antecipacao: string;
  };
  allMarginsComplete: boolean;
  bandeira: string;
}

interface IsoMdrTablesSectionProps {
  customerId: number;
}

type MargemKey = 'debito' | 'credito' | 'credito2x' | 'pix';

const MODALIDADES: { key: MargemKey; label: string }[] = [
  { key: 'debito', label: 'Débito' },
  { key: 'credito', label: 'Crédito' },
  { key: 'credito2x', label: 'Créd 2-6x' },
  { key: 'pix', label: 'PIX' }
];

export function IsoMdrTablesSection({ customerId }: IsoMdrTablesSectionProps) {
  const [tables, setTables] = useState<LinkedMdrTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editedMargins, setEditedMargins] = useState<Record<string, Record<string, string>>>({});

  const fetchTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/margens/iso/${customerId}/tables`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Erro ao buscar tabelas');
      }
      const data = await response.json();
      setTables(data.tables || []);
      setEditedMargins({});
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar tabelas');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchTables();
    }
  }, [customerId, fetchTables]);

  const handleMarginChange = (linkId: string, field: MargemKey, value: string) => {
    const cleanValue = value.replace(/[^0-9.,]/g, '').replace(',', '.');
    
    setEditedMargins(prev => ({
      ...prev,
      [linkId]: {
        ...(prev[linkId] || {}),
        [field]: cleanValue
      }
    }));
  };

  const getDisplayValue = (table: LinkedMdrTable, field: MargemKey): string => {
    if (editedMargins[table.linkId]?.[field] !== undefined) {
      return editedMargins[table.linkId][field];
    }
    return table.margemIso[field] || '';
  };

  const hasChanges = (linkId: string): boolean => {
    return Object.keys(editedMargins[linkId] || {}).length > 0;
  };

  const saveMargins = async (table: LinkedMdrTable) => {
    if (!hasChanges(table.linkId)) return;

    setSaving(table.linkId);
    try {
      const changes = editedMargins[table.linkId] || {};
      const margins = Object.entries(changes).map(([modalidade, marginIso]) => ({
        linkId: table.linkId,
        bandeira: table.bandeira,
        modalidade: `${modalidade}_pos`,
        marginIso
      }));

      const response = await fetch(`/api/margens/iso/${customerId}/margins`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ margins })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar');
      }

      toast.success('Margens salvas com sucesso');
      await fetchTables();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar margens');
    } finally {
      setSaving(null);
    }
  };

  const formatCurrency = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    return `${num.toFixed(2)}%`;
  };

  const StatusBadge = ({ status, allComplete }: { status: TableStatus; allComplete: boolean }) => {
    if (allComplete) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
          <CheckCircle className="w-3 h-3" />
          Aprovada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
        <AlertCircle className="w-3 h-3" />
        Pendente
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando tabelas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
        <p className="text-red-400">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchTables}
          className="mt-2"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="bg-[#1D1D1D] rounded-lg p-6 text-center border border-[#2E2E2E]">
        <Table className="w-12 h-12 mx-auto text-[#5C5C5C] mb-3" />
        <h4 className="text-white font-medium mb-1">Nenhuma tabela vinculada</h4>
        <p className="text-[#A0A0A0] text-sm mb-4">
          Aguarde a vinculação de tabelas de taxas pelo Portal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-white font-medium">{tables.length} tabela(s) vinculada(s)</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTables}
          disabled={loading}
          className="bg-transparent border-[#2E2E2E] text-white hover:bg-[#2E2E2E]"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="text-xs text-[#A0A0A0] flex items-center gap-4 mb-2">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-orange-500/30 border border-orange-500/50"></span>
          Custo Consolidado (somente leitura)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50"></span>
          Sua Margem (editável)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#1D1D1D] border-b border-[#2E2E2E]">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-[#A0A0A0] uppercase">MCC</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-[#A0A0A0] uppercase">Categoria</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-[#A0A0A0] uppercase">Status</th>
              {MODALIDADES.map(mod => (
                <th key={mod.key} className="px-2 py-2 text-center text-xs font-medium uppercase" colSpan={2}>
                  <span className="text-orange-400">{mod.label}</span>
                </th>
              ))}
              <th className="px-3 py-3 text-center text-xs font-medium text-[#A0A0A0] uppercase">Ação</th>
            </tr>
            <tr className="bg-[#1a1a1a] border-b border-[#2E2E2E]">
              <th colSpan={3}></th>
              {MODALIDADES.map(mod => (
                <React.Fragment key={`sub-${mod.key}`}>
                  <th className="px-1 py-1 text-center text-[10px] font-normal text-orange-400/70">Custo</th>
                  <th className="px-1 py-1 text-center text-[10px] font-normal text-green-400/70">Margem</th>
                </React.Fragment>
              ))}
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E2E2E]">
            {tables.map((table) => (
              <tr key={table.id} className="hover:bg-[#1D1D1D] transition">
                <td className="px-3 py-3 text-sm text-white font-mono">{table.mcc}</td>
                <td className="px-3 py-3 text-sm text-[#A0A0A0] max-w-[150px] truncate" title={table.categoryName}>
                  {table.categoryName}
                </td>
                <td className="px-3 py-3">
                  <StatusBadge status={table.status} allComplete={table.allMarginsComplete} />
                </td>
                
                {MODALIDADES.map(mod => (
                  <React.Fragment key={`${table.id}-${mod.key}`}>
                    <td className="px-1 py-2">
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded px-1 py-1.5 text-center min-w-[60px]">
                        <span className="text-orange-300 text-xs font-medium">
                          {formatCurrency(table.custoConsolidado[mod.key])}
                        </span>
                      </div>
                    </td>
                    <td className="px-1 py-2">
                      <Input
                        type="text"
                        value={getDisplayValue(table, mod.key)}
                        onChange={(e) => handleMarginChange(table.linkId, mod.key, e.target.value)}
                        placeholder="0.00"
                        className="w-16 h-8 text-center text-xs bg-green-500/10 border-green-500/30 text-green-300 placeholder:text-green-500/40 focus:border-green-500"
                      />
                    </td>
                  </React.Fragment>
                ))}

                <td className="px-2 py-2 text-center">
                  <Button
                    size="sm"
                    onClick={() => saveMargins(table)}
                    disabled={!hasChanges(table.linkId) || saving === table.linkId}
                    className={`${
                      hasChanges(table.linkId) 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-[#2E2E2E] text-[#5C5C5C]'
                    }`}
                  >
                    {saving === table.linkId ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#1D1D1D] rounded-lg p-4 border border-[#2E2E2E]">
        <p className="text-[#A0A0A0] text-sm">
          <strong className="text-white">Como funciona:</strong> Preencha sua margem em cada modalidade. 
          Quando todos os campos estiverem preenchidos, o status mudará para <span className="text-green-400">Aprovada</span> e 
          as taxas estarão disponíveis para uso no cadastro de estabelecimentos.
        </p>
      </div>
    </div>
  );
}
