'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { RotateCcw, History, Pencil, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface Override {
  id: string;
  valorOriginal: number;
  valorOverride: number;
  overrideMode?: string;
  marginOutbankOverride?: number;
  marginExecutivoOverride?: number;
  marginCoreOverride?: number;
}

interface HistoryEntry {
  id: string;
  userName: string;
  valorAnterior: number;
  valorNovo: number;
  acao: string;
  createdAt: string;
  overrideMode?: string;
}

interface EditableRateCellProps {
  customerId: number;
  fornecedorCategoryId: string;
  bandeira: string;
  produto: string;
  canal: 'pos' | 'online';
  custoBase: number;
  taxaFinalCalculada: number;
  marginOutbank: number;
  marginExecutivo: number;
  marginCore: number;
  override?: Override;
  canEdit: boolean;
  isSuperAdmin: boolean;
  isCore?: boolean;
  onOverrideChange: () => void;
}

export function EditableRateCell({
  customerId,
  fornecedorCategoryId,
  bandeira,
  produto,
  canal,
  custoBase,
  taxaFinalCalculada,
  marginOutbank,
  marginExecutivo,
  marginCore,
  override,
  canEdit,
  isSuperAdmin,
  isCore = false,
  onOverrideChange
}: EditableRateCellProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [overrideMode, setOverrideMode] = useState<'proporcional' | 'apenas_outbank'>('proporcional');
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);

  const hasOverride = !!override;
  const safeCustoBase = typeof custoBase === 'number' ? custoBase : parseFloat(String(custoBase)) || 0;
  const safeTaxaFinal = typeof taxaFinalCalculada === 'number' ? taxaFinalCalculada : parseFloat(String(taxaFinalCalculada)) || 0;
  const safeMarginOutbank = typeof marginOutbank === 'number' ? marginOutbank : parseFloat(String(marginOutbank)) || 0;
  const safeMarginExecutivo = typeof marginExecutivo === 'number' ? marginExecutivo : parseFloat(String(marginExecutivo)) || 0;
  const safeMarginCore = typeof marginCore === 'number' ? marginCore : parseFloat(String(marginCore)) || 0;
  
  const rawDisplayValue = hasOverride ? override.valorOverride : safeTaxaFinal;
  const displayValue = typeof rawDisplayValue === 'number' ? rawDisplayValue : parseFloat(String(rawDisplayValue)) || 0;

  // Para CORE: "Custo" é a soma de Dock + Outbank + Executivo (tudo antes de CORE)
  const custoCoreView = safeCustoBase + safeMarginOutbank + safeMarginExecutivo;

  const handleStartEdit = () => {
    if (!canEdit) return;
    setEditValue(displayValue.toFixed(2));
    setOverrideMode(override?.overrideMode as 'proporcional' | 'apenas_outbank' || 'proporcional');
    setShowEditModal(true);
  };

  const calculateMarginPreview = () => {
    const newValue = parseFloat(editValue.replace(',', '.'));
    
    // Para CORE: o custo base é Dock+Outbank+Executivo
    const minValue = isCore ? custoCoreView : safeCustoBase;
    
    if (isNaN(newValue) || newValue < minValue) {
      return null;
    }

    // Para CORE: delta é apenas a diferença entre nova taxa e taxa atual
    // Toda alteração vai para a margem CORE, mantendo Outbank e Executivo fixos
    if (isCore) {
      const delta = newValue - displayValue;
      return {
        outbank: safeMarginOutbank,
        executivo: safeMarginExecutivo,
        core: safeMarginCore + delta
      };
    }

    const delta = newValue - safeTaxaFinal;
    const totalMargin = safeMarginOutbank + safeMarginExecutivo + safeMarginCore;
    
    if (overrideMode === 'apenas_outbank') {
      return {
        outbank: safeMarginOutbank + delta,
        executivo: safeMarginExecutivo,
        core: safeMarginCore
      };
    } else {
      if (totalMargin === 0) {
        return {
          outbank: delta,
          executivo: 0,
          core: 0
        };
      }
      const ratio = {
        outbank: safeMarginOutbank / totalMargin,
        executivo: safeMarginExecutivo / totalMargin,
        core: safeMarginCore / totalMargin
      };
      return {
        outbank: safeMarginOutbank + (delta * ratio.outbank),
        executivo: safeMarginExecutivo + (delta * ratio.executivo),
        core: safeMarginCore + (delta * ratio.core)
      };
    }
  };

  const handleSave = async () => {
    const newValue = parseFloat(editValue.replace(',', '.'));
    if (isNaN(newValue) || newValue < 0) {
      toast.error('Valor inválido');
      return;
    }

    const normalizedNew = parseFloat(newValue.toFixed(4));
    const normalizedCurrent = parseFloat(displayValue.toFixed(4));
    
    if (normalizedNew === normalizedCurrent) {
      setShowEditModal(false);
      return;
    }

    // Para CORE: custo mínimo é Dock+Outbank+Executivo
    const minValue = isCore ? custoCoreView : safeCustoBase;
    if (newValue < minValue) {
      toast.error(`A taxa final não pode ser menor que o custo base (${minValue.toFixed(2)}%)`);
      return;
    }

    const preview = calculateMarginPreview();
    if (!preview) {
      toast.error('Erro ao calcular margens');
      return;
    }

    if (preview.outbank < 0 || preview.executivo < 0 || preview.core < 0) {
      toast.error('As margens resultantes não podem ser negativas');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/margens/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          customerId,
          fornecedorCategoryId,
          bandeira,
          produto,
          canal,
          valorOriginal: taxaFinalCalculada,
          valorOverride: newValue,
          overrideMode,
          marginOutbank: safeMarginOutbank,
          marginExecutivo: safeMarginExecutivo,
          marginCore: safeMarginCore,
          marginOutbankOverride: preview.outbank,
          marginExecutivoOverride: preview.executivo,
          marginCoreOverride: preview.core
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar');
      }

      toast.success('Taxa alterada com sucesso!');
      setShowEditModal(false);
      onOverrideChange();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = async () => {
    setSaving(true);
    try {
      const params = new URLSearchParams({
        customerId: String(customerId),
        fornecedorCategoryId,
        bandeira,
        produto,
        canal
      });
      const response = await fetch(`/api/margens/overrides?${params}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao reverter');
      }

      toast.success('Taxa revertida ao valor original!');
      setShowRevertConfirm(false);
      onOverrideChange();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao reverter');
    } finally {
      setSaving(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams({
        customerId: String(customerId),
        fornecedorCategoryId,
        bandeira,
        produto,
        canal
      });
      const response = await fetch(`/api/margens/overrides/history?${params}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleShowHistory = () => {
    setShowHistory(true);
    loadHistory();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(',', '.');
    value = value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    setEditValue(value);
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAcaoLabel = (acao: string) => {
    switch (acao) {
      case 'CRIADO': return 'Criado';
      case 'ATUALIZADO': return 'Atualizado';
      case 'REVERTIDO': return 'Revertido';
      default: return acao;
    }
  };

  const getModeLabel = (mode: string | undefined) => {
    if (!mode) return '';
    return mode === 'apenas_outbank' ? '(Apenas Outbank)' : '(Proporcional)';
  };

  const preview = showEditModal ? calculateMarginPreview() : null;

  // Visualização para CORE: mostrar "Custo" (Dock+Outbank+Executivo) → Taxa Final
  if (isCore) {
    return (
      <>
        <div className="flex items-center justify-center gap-1 group relative">
          <span className="text-orange-400 text-xs">{custoCoreView.toFixed(2)}%</span>
          <span className="text-[#616161] text-xs mx-0.5">→</span>
          
          <div className="flex items-center gap-0.5">
            <span 
              className={`text-xs font-medium cursor-pointer hover:underline ${
                hasOverride ? 'text-yellow-400' : 'text-emerald-400'
              }`}
              onClick={canEdit ? handleStartEdit : undefined}
              title={canEdit ? 'Clique para editar' : undefined}
            >
              {displayValue.toFixed(2)}%
            </span>
            {hasOverride && (
              <span className="text-[10px] text-yellow-500" title="Valor editado manualmente">*</span>
            )}
          </div>

          {canEdit && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0 pb-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#2E2E2E] rounded-md px-2 py-1 shadow-lg">
                <button
                  onClick={handleStartEdit}
                  className="p-0.5 hover:bg-[#2E2E2E] rounded"
                  title="Editar"
                >
                  <Pencil className="w-3 h-3 text-[#808080] hover:text-white" />
                </button>
                {hasOverride && (
                  <button
                    onClick={() => setShowRevertConfirm(true)}
                    className="p-0.5 hover:bg-[#2E2E2E] rounded"
                    title="Reverter"
                  >
                    <RotateCcw className="w-3 h-3 text-[#808080] hover:text-white" />
                  </button>
                )}
                <button
                  onClick={handleShowHistory}
                  className="p-0.5 hover:bg-[#2E2E2E] rounded"
                  title="Histórico"
                >
                  <History className="w-3 h-3 text-[#808080] hover:text-white" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal de edição para CORE - sem seleção de modo, apenas edita taxa CORE */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="bg-[#1a1a1a] border-[#2E2E2E] text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Taxa Final</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-[#808080]">Custo Base</Label>
                  <p className="text-orange-400 font-medium">{custoCoreView.toFixed(2)}%</p>
                </div>
                <div>
                  <Label className="text-[#808080]">Taxa Atual</Label>
                  <p className="text-emerald-400 font-medium">{displayValue.toFixed(2)}%</p>
                </div>
              </div>
              
              <div>
                <Label>Nova Taxa Final (%)</Label>
                <Input
                  type="text"
                  value={editValue}
                  onChange={handleInputChange}
                  className="bg-[#0a0a0a] border-[#2E2E2E] text-white mt-1"
                  placeholder="0.00"
                />
                <p className="text-[10px] text-[#616161] mt-1">
                  Valor mínimo: {custoCoreView.toFixed(2)}%
                </p>
              </div>

              {preview && (
                <div className="bg-[#0a0a0a] p-3 rounded-lg border border-[#2E2E2E]">
                  <Label className="text-[#808080] text-xs">Prévia da sua Margem CORE</Label>
                  <p className="text-emerald-400 font-medium mt-1">
                    {preview.core.toFixed(2)}%
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !preview}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de confirmação de reversão */}
        <Dialog open={showRevertConfirm} onOpenChange={setShowRevertConfirm}>
          <DialogContent className="bg-[#1a1a1a] border-[#2E2E2E] text-white max-w-sm">
            <DialogHeader>
              <DialogTitle>Reverter Alteração</DialogTitle>
            </DialogHeader>
            <p className="text-[#a0a0a0] text-sm">
              Tem certeza que deseja reverter esta taxa para o valor original calculado automaticamente?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRevertConfirm(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleRevert} disabled={saving}>
                {saving ? 'Revertendo...' : 'Reverter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de histórico */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="bg-[#1a1a1a] border-[#2E2E2E] text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>Histórico de Alterações</DialogTitle>
            </DialogHeader>
            <div className="max-h-[300px] overflow-y-auto">
              {loadingHistory ? (
                <p className="text-center py-4 text-[#808080]">Carregando...</p>
              ) : history.length === 0 ? (
                <p className="text-center py-4 text-[#808080]">Nenhuma alteração registrada</p>
              ) : (
                <div className="space-y-2">
                  {history.map((entry) => (
                    <div key={entry.id} className="bg-[#0a0a0a] p-3 rounded-lg border border-[#2E2E2E]">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">{entry.userName}</p>
                          <p className="text-xs text-[#808080]">{formatDateTime(entry.createdAt)}</p>
                        </div>
                        <span className="text-xs bg-[#2E2E2E] px-2 py-1 rounded">
                          {getAcaoLabel(entry.acao)} {getModeLabel(entry.overrideMode)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <span className="text-orange-400">{entry.valorAnterior.toFixed(2)}%</span>
                        <ArrowRight className="w-3 h-3 text-[#616161]" />
                        <span className="text-emerald-400">{entry.valorNovo.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Visualização padrão (Super Admin e Executivo): mostrar Custo Base (Dock) → Taxa Final
  return (
    <>
      <div className="flex items-center justify-center gap-1 group relative">
        <span className="text-orange-400 text-xs">{safeCustoBase.toFixed(2)}%</span>
        <span className="text-[#616161] text-xs mx-0.5">→</span>
        
        <div className="flex items-center gap-0.5">
          <span 
            className={`text-xs font-medium cursor-pointer hover:underline ${
              hasOverride ? 'text-yellow-400' : 'text-emerald-400'
            }`}
            onClick={canEdit ? handleStartEdit : undefined}
            title={canEdit ? 'Clique para editar' : undefined}
          >
            {displayValue.toFixed(2)}%
          </span>
          {hasOverride && (
            <span className="text-[10px] text-yellow-500" title="Valor editado manualmente">*</span>
          )}
        </div>

        {canEdit && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-0 pb-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#2E2E2E] rounded-md px-2 py-1 shadow-lg">
              <button
                onClick={handleStartEdit}
                className="p-0.5 hover:bg-[#2E2E2E] rounded"
                title="Editar"
              >
                <Pencil className="w-3 h-3 text-[#808080] hover:text-white" />
              </button>
              {hasOverride && (
                <button
                  onClick={() => setShowRevertConfirm(true)}
                  className="p-0.5 hover:bg-[#2E2E2E] rounded"
                  title="Reverter ao valor original"
                >
                  <RotateCcw className="w-3 h-3 text-[#808080] hover:text-yellow-400" />
                </button>
              )}
              <button
                onClick={handleShowHistory}
                className="p-0.5 hover:bg-[#2E2E2E] rounded"
                title="Ver histórico"
              >
                <History className="w-3 h-3 text-[#808080] hover:text-white" />
              </button>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1a1a1a] border-r border-b border-[#2E2E2E] rotate-45"></div>
          </div>
        )}
      </div>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-[#141414] border-[#2E2E2E] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Taxa Final</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="text-xs text-[#616161] mb-2">
              <span className="font-medium text-white">{bandeira}</span> • {produto} • {canal.toUpperCase()}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label className="text-[#b0b0b0] text-xs mb-1 block">Custo Base</Label>
                <div className="text-orange-400 font-medium">{safeCustoBase.toFixed(2)}%</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#616161]" />
              <div className="flex-1">
                <Label className="text-[#b0b0b0] text-xs mb-1 block">Nova Taxa Final</Label>
                <Input
                  value={editValue}
                  onChange={handleInputChange}
                  className="bg-[#0a0a0a] border-[#2E2E2E] text-emerald-400 text-center"
                  placeholder="0.00"
                />
              </div>
            </div>

            {isSuperAdmin && (
              <div className="border-t border-[#2E2E2E] pt-4">
                <Label className="text-[#b0b0b0] text-xs mb-3 block">Modo de Distribuição</Label>
                <RadioGroup 
                  value={overrideMode} 
                  onValueChange={(v) => setOverrideMode(v as 'proporcional' | 'apenas_outbank')}
                  className="space-y-2"
                >
                  <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-[#1a1a1a]">
                    <RadioGroupItem value="proporcional" id="proporcional" className="mt-0.5" />
                    <div>
                      <Label htmlFor="proporcional" className="text-white text-sm cursor-pointer">Proporcional</Label>
                      <p className="text-[#616161] text-xs">Distribui a diferença proporcionalmente entre Outbank, Executivo e Core</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-[#1a1a1a]">
                    <RadioGroupItem value="apenas_outbank" id="apenas_outbank" className="mt-0.5" />
                    <div>
                      <Label htmlFor="apenas_outbank" className="text-white text-sm cursor-pointer">Apenas Outbank</Label>
                      <p className="text-[#616161] text-xs">Toda a diferença vai para a margem Outbank (Executivo e Core ficam iguais)</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}

            {preview && (
              <div className="border-t border-[#2E2E2E] pt-4">
                <Label className="text-[#b0b0b0] text-xs mb-3 block">Preview das Margens</Label>
                <div className="bg-[#0a0a0a] rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#616161]">Margem Outbank:</span>
                    <span>
                      <span className="text-[#505050]">{safeMarginOutbank.toFixed(2)}%</span>
                      <span className="text-[#3a3a3a] mx-1">→</span>
                      <span className={preview.outbank !== safeMarginOutbank ? 'text-yellow-400' : 'text-white'}>
                        {preview.outbank.toFixed(2)}%
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#616161]">Margem Executivo:</span>
                    <span>
                      <span className="text-[#505050]">{safeMarginExecutivo.toFixed(2)}%</span>
                      <span className="text-[#3a3a3a] mx-1">→</span>
                      <span className={preview.executivo !== safeMarginExecutivo ? 'text-yellow-400' : 'text-white'}>
                        {preview.executivo.toFixed(2)}%
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#616161]">Margem Core:</span>
                    <span>
                      <span className="text-[#505050]">{safeMarginCore.toFixed(2)}%</span>
                      <span className="text-[#3a3a3a] mx-1">→</span>
                      <span className={preview.core !== safeMarginCore ? 'text-yellow-400' : 'text-white'}>
                        {preview.core.toFixed(2)}%
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setShowEditModal(false)}
              className="border-[#2E2E2E] text-white hover:bg-[#2E2E2E]"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving || !preview || preview.outbank < 0 || preview.executivo < 0 || preview.core < 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRevertConfirm} onOpenChange={setShowRevertConfirm}>
        <DialogContent className="bg-[#141414] border-[#2E2E2E] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Reverter Alteração</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[#b0b0b0] text-sm">
              Deseja reverter a taxa de <span className="text-yellow-400 font-medium">{displayValue.toFixed(2)}%</span> para o valor proporcional original de <span className="text-emerald-400 font-medium">{safeTaxaFinal.toFixed(2)}%</span>?
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setShowRevertConfirm(false)}
              className="border-[#2E2E2E] text-white hover:bg-[#2E2E2E]"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleRevert}
              disabled={saving}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {saving ? 'Revertendo...' : 'Reverter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="bg-[#141414] border-[#2E2E2E] max-w-lg max-h-[70vh]">
          <DialogHeader>
            <DialogTitle className="text-white">Histórico de Alterações</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="text-xs text-[#616161] mb-3">
              <span className="font-medium text-white">{bandeira}</span> • {produto} • {canal.toUpperCase()}
            </div>
            
            {loadingHistory ? (
              <div className="text-center text-[#616161] py-8">Carregando...</div>
            ) : history.length === 0 ? (
              <div className="text-center text-[#616161] py-8">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma alteração registrada</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {history.map(entry => (
                  <div 
                    key={entry.id} 
                    className="p-3 bg-[#0a0a0a] rounded-lg border border-[#2E2E2E]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium">{entry.userName}</span>
                      <div className="flex items-center gap-2">
                        {entry.overrideMode && (
                          <span className="text-[10px] text-[#505050]">
                            {getModeLabel(entry.overrideMode)}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          entry.acao === 'REVERTIDO' 
                            ? 'bg-yellow-900/30 text-yellow-400' 
                            : 'bg-emerald-900/30 text-emerald-400'
                        }`}>
                          {getAcaoLabel(entry.acao)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[#616161]">
                        {entry.valorAnterior !== null ? `${Number(entry.valorAnterior).toFixed(2)}%` : '-'}
                      </span>
                      <span className="text-[#3a3a3a]">→</span>
                      <span className="text-white">{Number(entry.valorNovo).toFixed(2)}%</span>
                    </div>
                    <div className="text-[10px] text-[#505050] mt-1">
                      {formatDateTime(entry.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
