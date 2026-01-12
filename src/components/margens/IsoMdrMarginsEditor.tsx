'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { LinkedMdrTableWithIsoMargin } from '@/lib/db/iso-margins';

interface IsoMdrMarginsEditorProps {
  customerId: number;
  linkedTables: LinkedMdrTableWithIsoMargin[];
  onMarginsUpdated?: () => void;
}

export function IsoMdrMarginsEditor({ 
  customerId, 
  linkedTables,
  onMarginsUpdated 
}: IsoMdrMarginsEditorProps) {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [marginChanges, setMarginChanges] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);

  const toggleTable = (linkId: string) => {
    setExpandedTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(linkId)) {
        newSet.delete(linkId);
      } else {
        newSet.add(linkId);
      }
      return newSet;
    });
  };

  const modalidadeLabels: Record<string, string> = {
    debito: 'Débito',
    credito: 'Crédito à Vista',
    credito2x: 'Crédito 2-6x',
    credito7x: 'Crédito 7-12x',
    voucher: 'Voucher',
    pre: 'Pré-Pago',
    pix: 'PIX'
  };

  const getMarginKey = (bandeira: string, modalidade: string) => `${bandeira}:${modalidade}`;

  const getMarginValue = (table: LinkedMdrTableWithIsoMargin, bandeira: string, modalidade: string): string => {
    const key = getMarginKey(bandeira, modalidade);
    if (marginChanges[table.linkId]?.[key] !== undefined) {
      return marginChanges[table.linkId][key];
    }
    const margin = table.isoMargins.find(m => m.bandeira === bandeira && m.modalidade === modalidade);
    return margin?.marginIso || '0';
  };

  const handleMarginChange = (linkId: string, bandeira: string, modalidade: string, value: string) => {
    const key = getMarginKey(bandeira, modalidade);
    setMarginChanges(prev => ({
      ...prev,
      [linkId]: {
        ...(prev[linkId] || {}),
        [key]: value
      }
    }));
  };

  const getCostBase = (table: LinkedMdrTableWithIsoMargin, modalidade: string): number => {
    const mdrValue = getMdrValue(table, modalidade);
    const outbank = parseFloat(table.marginOutbank) || 0;
    const executivo = parseFloat(table.marginExecutivo) || 0;
    const core = parseFloat(table.marginCore) || 0;
    return mdrValue + outbank + executivo + core;
  };

  const getMdrValue = (table: LinkedMdrTableWithIsoMargin, modalidade: string): number => {
    switch (modalidade) {
      case 'debito': return parseFloat(table.debitoPos) || 0;
      case 'credito': return parseFloat(table.creditoPos) || 0;
      case 'credito2x': return parseFloat(table.credito2xPos) || 0;
      case 'credito7x': return parseFloat(table.credito7xPos) || 0;
      case 'voucher': return parseFloat(table.voucherPos) || 0;
      case 'pre': return parseFloat(table.prePos) || 0;
      case 'pix': return parseFloat(table.custoPixPos) || 0;
      default: return 0;
    }
  };

  const getFinalRate = (table: LinkedMdrTableWithIsoMargin, bandeira: string, modalidade: string): number => {
    const costBase = getCostBase(table, modalidade);
    const marginIso = parseFloat(getMarginValue(table, bandeira, modalidade)) || 0;
    return costBase + marginIso;
  };

  const hasUnsavedChanges = useMemo(() => {
    return Object.keys(marginChanges).some(linkId => 
      Object.keys(marginChanges[linkId]).length > 0
    );
  }, [marginChanges]);

  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      toast.info('Nenhuma alteração para salvar');
      return;
    }

    setSaving(true);
    try {
      const margins: Array<{ linkId: string; bandeira: string; modalidade: string; marginIso: string }> = [];
      
      for (const [linkId, changes] of Object.entries(marginChanges)) {
        for (const [key, value] of Object.entries(changes)) {
          const [bandeira, modalidade] = key.split(':');
          margins.push({ linkId, bandeira, modalidade, marginIso: value });
        }
      }

      const response = await fetch(`/api/margens/iso/${customerId}/margins`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ margins })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar margens');
      }

      toast.success('Margens ISO salvas com sucesso!');
      setMarginChanges({});
      onMarginsUpdated?.();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar margens ISO');
    } finally {
      setSaving(false);
    }
  };

  const parseBandeiras = (bandeirasStr: string): string[] => {
    if (!bandeirasStr) return [];
    return bandeirasStr.split(',').map(b => b.trim()).filter(Boolean);
  };

  if (linkedTables.length === 0) {
    return (
      <Card className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
        <CardContent className="p-6 text-center text-[#808080]">
          Nenhuma tabela aprovada encontrada. Aprove tabelas vinculadas para configurar margens.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg text-white font-medium flex items-center gap-2">
          Margens ISO por Tabela
          <Badge variant="outline" className="ml-2 text-xs">
            {linkedTables.length} tabela{linkedTables.length !== 1 ? 's' : ''} aprovada{linkedTables.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        {hasUnsavedChanges && (
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-[#478EF7] hover:bg-[#478EF7]/90 text-white"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Salvar Margens ISO</>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {linkedTables.map(table => {
          const isExpanded = expandedTables.has(table.linkId);
          const bandeiras = parseBandeiras(table.bandeiras);
          
          return (
            <div key={table.linkId} className="border border-[#2a2a2a] rounded-lg overflow-hidden">
              <button
                onClick={() => toggleTable(table.linkId)}
                className="w-full flex items-center justify-between p-4 bg-[#2a2a2a]/50 hover:bg-[#2a2a2a] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-[#478EF7]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#808080]" />
                  )}
                  <div>
                    <span className="text-white font-medium">{table.fornecedorNome}</span>
                    <span className="text-[#808080] text-sm ml-3">
                      MCC: {table.mcc} - {table.categoryName}
                    </span>
                  </div>
                </div>
                <Badge variant="success" className="text-xs">
                  Aprovada
                </Badge>
              </button>
              
              {isExpanded && (
                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[#808080] text-left">
                        <th className="py-2 px-3 font-medium">Bandeira</th>
                        {Object.entries(modalidadeLabels).map(([key, label]) => (
                          <th key={key} className="py-2 px-3 font-medium text-center" colSpan={3}>
                            {label}
                          </th>
                        ))}
                      </tr>
                      <tr className="text-[#606060] text-xs border-b border-[#2a2a2a]">
                        <th></th>
                        {Object.keys(modalidadeLabels).map(modalidade => (
                          <>
                            <th key={`${modalidade}-custo`} className="py-1 px-1 text-center">Custo</th>
                            <th key={`${modalidade}-margem`} className="py-1 px-1 text-center">Margem</th>
                            <th key={`${modalidade}-final`} className="py-1 px-1 text-center">Final</th>
                          </>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bandeiras.map(bandeira => (
                        <tr key={bandeira} className="border-b border-[#2a2a2a]/50 hover:bg-[#2a2a2a]/30">
                          <td className="py-2 px-3 text-white font-medium">{bandeira}</td>
                          {Object.keys(modalidadeLabels).map(modalidade => {
                            const costBase = getCostBase(table, modalidade);
                            const marginIso = getMarginValue(table, bandeira, modalidade);
                            const finalRate = getFinalRate(table, bandeira, modalidade);
                            
                            return (
                              <>
                                <td key={`${modalidade}-custo`} className="py-2 px-1 text-center text-[#808080]">
                                  {costBase.toFixed(2)}%
                                </td>
                                <td key={`${modalidade}-margem`} className="py-2 px-1 text-center">
                                  <Input
                                    type="text"
                                    value={marginIso}
                                    onChange={(e) => handleMarginChange(table.linkId, bandeira, modalidade, e.target.value)}
                                    className="w-16 h-7 text-center text-xs bg-[#1a1a1a] border-[#3a3a3a] text-white"
                                  />
                                </td>
                                <td key={`${modalidade}-final`} className="py-2 px-1 text-center text-[#478EF7] font-medium">
                                  {finalRate.toFixed(2)}%
                                </td>
                              </>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="mt-4 p-3 bg-[#1a1a1a] rounded-lg text-xs text-[#808080] flex gap-6">
                    <div>
                      <span className="font-medium">Custo Base:</span> Valor consolidado definido pelo Portal
                    </div>
                    <div>
                      <span className="font-medium">Taxa Final:</span> Custo Base + Margem ISO
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
