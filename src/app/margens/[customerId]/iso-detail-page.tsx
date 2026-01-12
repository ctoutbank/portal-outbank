'use client';

import { useState, useMemo, useEffect } from 'react';
import { IsoMarginConfig, LinkedMdrTable, MdrTableWithCost } from '@/lib/db/iso-margins';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Plus, Trash2, Layers, Search, X, ChevronDown, ChevronRight, Users, Percent, AlertTriangle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { updateIsoMargins, linkTableToIso, unlinkTableFromIso } from '../actions-new';
import { EditableRateCell } from './editable-rate-cell';
import { MdrStatusBadge, MdrStatus } from '@/components/supplier/MdrStatusBadge';
import { IsoMdrValidationModal } from '@/components/margens/IsoMdrValidationModal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface MdrOverride {
  id: string;
  fornecedorCategoryId: string;
  bandeira: string;
  produto: string;
  canal: string;
  valorOriginal: number;
  valorOverride: number;
  overrideMode?: string;
  marginOutbankOverride?: number;
  marginExecutivoOverride?: number;
  marginCoreOverride?: number;
}

interface IsoDetailPageProps {
  customerId: number;
  config: IsoMarginConfig | null;
  linkedTables: LinkedMdrTable[];
  availableTables: MdrTableWithCost[];
  fornecedores: Array<{ id: string; nome: string }>;
  userRole: 'super_admin' | 'executivo' | 'core' | null;
  canValidateMdr: boolean;
  isSuperAdmin: boolean;
  isSimulating?: boolean;
}

export function IsoDetailPage({ 
  customerId, 
  config, 
  linkedTables: initialLinkedTables, 
  availableTables,
  fornecedores,
  userRole,
  canValidateMdr,
  isSuperAdmin,
  isSimulating = false
}: IsoDetailPageProps) {
  const [marginOutbank, setMarginOutbank] = useState(config?.marginOutbank || '0');
  const [marginExecutivo, setMarginExecutivo] = useState(config?.marginExecutivo || '0');
  const [marginCore, setMarginCore] = useState(config?.marginCore || '0');
  const [saving, setSaving] = useState(false);
  const [linkedTables, setLinkedTables] = useState(initialLinkedTables);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState<string>('ALL_SUPPLIERS');
  const [tableSearch, setTableSearch] = useState('');
  const [expandedMccs, setExpandedMccs] = useState<Set<string>>(new Set());
  
  const [linkedUsers, setLinkedUsers] = useState<Array<{
    id: number;
    userId: number;
    userName: string;
    userEmail: string;
    categoryType: string;
    categoryName: string;
    inheritedPercent: number;
  }>>([]);
  const [availableUsers, setAvailableUsers] = useState<Array<{
    id: number;
    name: string;
    email: string;
    categoryType: string;
    categoryName: string;
  }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [savingUser, setSavingUser] = useState(false);
  const [showCoreWarningDialog, setShowCoreWarningDialog] = useState(false);
  const [overrides, setOverrides] = useState<MdrOverride[]>([]);
  const [confirmUnlinkUserOpen, setConfirmUnlinkUserOpen] = useState(false);
  const [pendingUnlinkUserId, setPendingUnlinkUserId] = useState<number | null>(null);
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    linkId: string;
    mcc: string;
    categoryName: string;
    fornecedorNome: string;
    currentStatus: MdrStatus;
  } | null>(null);

  const isCore = userRole === 'core';
  const canEditRates = isSuperAdmin || isCore;

  const toggleMccExpanded = (mccId: string) => {
    setExpandedMccs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mccId)) {
        newSet.delete(mccId);
      } else {
        newSet.add(mccId);
      }
      return newSet;
    });
  };

  const parseBandeiras = (bandeirasStr: string): string[] => {
    if (!bandeirasStr) return [];
    return bandeirasStr.split(',').map(b => b.trim()).filter(b => b.length > 0);
  };

  useEffect(() => {
    loadUsersData();
    loadOverrides();
  }, [customerId]);

  const loadOverrides = async () => {
    try {
      const response = await fetch(`/api/margens/overrides?customerId=${customerId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setOverrides(data);
      }
    } catch (error) {
      console.error('Erro ao carregar overrides:', error);
    }
  };

  const getOverride = (fornecedorCategoryId: string, bandeira: string, produto: string, canal: string): MdrOverride | undefined => {
    return overrides.find(o => 
      o.fornecedorCategoryId === fornecedorCategoryId && 
      o.bandeira === bandeira && 
      o.produto === produto && 
      o.canal === canal
    );
  };

  const loadUsersData = async () => {
    setLoadingUsers(true);
    try {
      const [linkedRes, availableRes] = await Promise.all([
        fetch(`/api/margens/linked-users?customerId=${customerId}`, { credentials: 'include' }),
        fetch(`/api/margens/linked-users/available?customerId=${customerId}`, { credentials: 'include' })
      ]);

      if (linkedRes.ok) {
        const data = await linkedRes.json();
        setLinkedUsers(data);
      }
      if (availableRes.ok) {
        const data = await availableRes.json();
        setAvailableUsers(data);
      }
    } catch (error) {
      console.error('Error loading users data:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const getInheritedPercent = (categoryType: string): number => {
    if (categoryType === 'EXECUTIVO') {
      return parseFloat(marginExecutivo) || 0;
    }
    if (categoryType === 'CORE') {
      return parseFloat(marginCore) || 0;
    }
    return 0;
  };

  const handleLinkUser = async () => {
    if (!selectedUser) {
      toast.error('Selecione um usuário');
      return;
    }

    setSavingUser(true);
    try {
      const response = await fetch('/api/margens/linked-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: Number(selectedUser),
          customerId
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao vincular usuário');
      }

      toast.success('Usuário vinculado com sucesso!');
      setShowAddUserDialog(false);
      setSelectedUser('');
      loadUsersData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao vincular usuário');
    } finally {
      setSavingUser(false);
    }
  };

  const handleUnlinkUserRequest = (userId: number) => {
    setPendingUnlinkUserId(userId);
    setConfirmUnlinkUserOpen(true);
  };

  const handleUnlinkUserConfirm = async () => {
    if (!pendingUnlinkUserId) return;
    const userId = pendingUnlinkUserId;

    try {
      const response = await fetch(`/api/margens/linked-users?userId=${userId}&customerId=${customerId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao desvincular usuário');
      }

      toast.success('Usuário desvinculado com sucesso!');
      loadUsersData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao desvincular usuário');
    } finally {
      setPendingUnlinkUserId(null);
    }
  };

  const getCategoryTypeBadge = (categoryType: string) => {
    switch (categoryType) {
      case 'EXECUTIVO':
        return <Badge className="bg-[#2E2E2E] text-[#808080] text-[11px]">Executivo</Badge>;
      case 'CORE':
        return <Badge className="bg-[#2E2E2E] text-[#808080] text-[11px]">Core</Badge>;
      default:
        return <Badge variant="outline" className="text-[11px] text-[#808080]">Outro</Badge>;
    }
  };

  const availableToLink = useMemo(() => {
    const linkedIds = new Set(linkedTables.map(t => t.fornecedorCategoryId));
    let filtered = availableTables.filter(t => !linkedIds.has(t.fornecedorCategoryId) && t.hasMdr);
    
    if (selectedFornecedor && selectedFornecedor !== 'ALL_SUPPLIERS') {
      filtered = filtered.filter(t => t.fornecedorId === selectedFornecedor);
    }
    
    if (tableSearch) {
      const term = tableSearch.toLowerCase();
      filtered = filtered.filter(t => 
        t.mcc.toLowerCase().includes(term) ||
        t.cnae.toLowerCase().includes(term) ||
        t.categoryName.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [availableTables, linkedTables, selectedFornecedor, tableSearch]);

  const handleSaveMargins = async (skipWarning = false) => {
    if (isCore && !skipWarning) {
      const coreValue = parseFloat(marginCore) || 0;
      if (coreValue === 0) {
        setShowCoreWarningDialog(true);
        return;
      }
    }
    
    setSaving(true);
    try {
      await updateIsoMargins(customerId, {
        marginOutbank,
        marginExecutivo,
        marginCore
      });
      toast.success('Margens salvas com sucesso!');
      setShowCoreWarningDialog(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar margens');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkTable = async (fornecedorCategoryId: string) => {
    try {
      await linkTableToIso(customerId, fornecedorCategoryId);
      const table = availableTables.find(t => t.fornecedorCategoryId === fornecedorCategoryId);
      if (table) {
        setLinkedTables([...linkedTables, {
          ...table,
          linkId: '',
          isActive: true,
          linkedAt: new Date(),
          status: 'rascunho' as const
        }]);
      }
      toast.success('Tabela vinculada com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao vincular tabela');
    }
  };

  const handleUnlinkTable = async (fornecedorCategoryId: string) => {
    try {
      await unlinkTableFromIso(customerId, fornecedorCategoryId);
      setLinkedTables(linkedTables.filter(t => t.fornecedorCategoryId !== fornecedorCategoryId));
      toast.success('Tabela desvinculada com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao desvincular tabela');
    }
  };

  const handleStatusChange = (linkId: string, newStatus: MdrStatus) => {
    setLinkedTables(prev => prev.map(t => 
      t.linkId === linkId ? { ...t, status: newStatus } : t
    ));
    setValidationModal(null);
  };

  const openValidationModal = (table: LinkedMdrTable) => {
    setValidationModal({
      isOpen: true,
      linkId: table.linkId,
      mcc: table.mcc,
      categoryName: table.categoryName,
      fornecedorNome: table.fornecedorNome,
      currentStatus: (table.status as MdrStatus) || 'rascunho'
    });
  };

  const parseRate = (value: string, index: number = 0): number => {
    if (!value) return 0;
    const values = value.split(',').map(v => v.trim());
    if (index >= values.length) return parseFloat(values[0] || '0') || 0;
    return parseFloat(values[index] || '0') || 0;
  };

  const calculateFinalRate = (custoRate: string, index: number = 0): number => {
    const custo = parseRate(custoRate, index);
    const outbank = parseFloat(marginOutbank) || 0;
    const executivo = parseFloat(marginExecutivo) || 0;
    const core = parseFloat(marginCore) || 0;
    return custo + outbank + executivo + core;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Configuração de Margens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="margens" className="w-full">
            <TabsList className="bg-[#0a0a0a] border border-[#2E2E2E] mb-6">
              <TabsTrigger value="margens" className="data-[state=active]:bg-[#2E2E2E]">
                <Layers className="w-4 h-4 mr-2" />
                Margens
              </TabsTrigger>
              {isSuperAdmin && (
                <TabsTrigger value="usuarios" className="data-[state=active]:bg-[#2E2E2E]">
                  <Users className="w-4 h-4 mr-2" />
                  Usuários ({linkedUsers.length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="margens">
              <div className="grid grid-cols-4 gap-6">
                {/* Margem Outbank - Apenas Super Admin vê e edita */}
                {isSuperAdmin && (
                  <div>
                    <Label className="text-[#616161] text-xs uppercase tracking-wide">Margem Outbank (%)</Label>
                    <Input
                      value={marginOutbank}
                      onChange={(e) => {
                        const val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
                        const parts = val.split('.');
                        setMarginOutbank(parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val);
                      }}
                      className="mt-1 bg-[#0a0a0a] border-[#2a2a2a] text-white font-medium text-lg"
                      placeholder="0.00"
                    />
                  </div>
                )}
                {/* Margem Executivo - Super Admin edita, Executivo apenas visualiza (desabilitado) */}
                {(isSuperAdmin || userRole === 'executivo') && (
                  <div>
                    <Label className="text-[#616161] text-xs uppercase tracking-wide">
                      {userRole === 'executivo' ? 'Sua Margem (%)' : 'Margem Executivo (%)'}
                    </Label>
                    <Input
                      value={marginExecutivo}
                      onChange={(e) => {
                        if (isSuperAdmin) {
                          const val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
                          const parts = val.split('.');
                          setMarginExecutivo(parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val);
                        }
                      }}
                      disabled={userRole === 'executivo'}
                      className={`mt-1 bg-[#0a0a0a] border-[#2a2a2a] text-white font-medium text-lg ${userRole === 'executivo' ? 'opacity-70 cursor-not-allowed' : ''}`}
                      placeholder="0.00"
                    />
                    {userRole === 'executivo' && (
                      <p className="text-xs text-[#616161] mt-1">Valor definido pelo administrador</p>
                    )}
                  </div>
                )}
                {/* Margem CORE - Super Admin edita, Core edita a própria */}
                {(isSuperAdmin || userRole === 'core') && (
                  <div>
                    <Label className="text-[#616161] text-xs uppercase tracking-wide">
                      {userRole === 'core' ? 'Sua Margem (%)' : 'Margem CORE (%)'}
                    </Label>
                    <Input
                      value={marginCore}
                      onChange={(e) => {
                        const val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
                        const parts = val.split('.');
                        setMarginCore(parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val);
                      }}
                      className="mt-1 bg-[#0a0a0a] border-[#2a2a2a] text-white font-medium text-lg"
                      placeholder="0.00"
                    />
                  </div>
                )}
                <div>
                  <Label className="text-[#616161] text-xs uppercase tracking-wide opacity-0">Ação</Label>
                  {/* Botão de salvar - Super Admin e Core podem salvar, Executivo não */}
                  {(isSuperAdmin || userRole === 'core') && (
                    <Button 
                      onClick={handleSaveMargins} 
                      disabled={saving}
                      className="mt-1 w-full h-10 bg-[#2E2E2E] hover:bg-[#3a3a3a] text-white font-medium border border-[#3a3a3a]"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Salvando...' : 'Salvar Margens'}
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            {isSuperAdmin && (
              <TabsContent value="usuarios">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-[#616161]">
                    Usuários vinculados herdam automaticamente a margem baseada em sua categoria
                  </p>
                  <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#2E2E2E] hover:bg-[#3a3a3a] text-white border border-[#3a3a3a]">
                        <Plus className="w-4 h-4 mr-2" />
                        Vincular Usuário
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#141414] border-[#2E2E2E] max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-white">Vincular Usuário ao ISO</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                          <SelectTrigger className="bg-[#0a0a0a] border-[#2E2E2E] text-white">
                            <SelectValue placeholder="Selecione um usuário" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#141414] border-[#2E2E2E]">
                            {availableUsers
                              .filter(user => user.categoryType === 'EXECUTIVO' || user.categoryType === 'CORE')
                              .map(user => (
                              <SelectItem key={user.id} value={String(user.id)} className="text-white">
                                <div className="flex items-center gap-2">
                                  <span>{user.name || user.email}</span>
                                  <Badge className="text-[10px] bg-[#2E2E2E] text-[#808080]">
                                    {user.categoryType === 'EXECUTIVO' ? 'Executivo' : 'Core'}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {availableUsers.filter(u => u.categoryType === 'EXECUTIVO' || u.categoryType === 'CORE').length === 0 && (
                          <p className="text-xs text-[#616161]">
                            Nenhum usuário Executivo ou Core disponível para vincular
                          </p>
                        )}
                        {selectedUser && (() => {
                          const user = availableUsers.find(u => String(u.id) === selectedUser);
                          if (!user) return null;
                          const percent = user.categoryType === 'EXECUTIVO' ? marginExecutivo : marginCore;
                          return (
                            <div className="p-3 bg-[#0a0a0a] border border-[#2E2E2E] rounded-lg">
                              <p className="text-sm text-white font-medium">{user.name || user.email}</p>
                              <p className="text-xs text-[#808080] mt-1">
                                Categoria: {user.categoryType === 'EXECUTIVO' ? 'Executivo' : 'Core'}
                              </p>
                              <p className="text-xs text-[#808080]">
                                Margem herdada: <span className="text-white font-medium">{percent}%</span>
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                      <DialogFooter className="mt-4">
                        <Button 
                          variant="outline"
                          onClick={() => setShowAddUserDialog(false)}
                          className="border-[#2E2E2E] text-white hover:bg-[#2E2E2E]"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleLinkUser} 
                          disabled={savingUser || !selectedUser}
                          className="bg-[#2E2E2E] hover:bg-[#3a3a3a] text-white border border-[#3a3a3a]"
                        >
                          {savingUser ? 'Vinculando...' : 'Vincular'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {loadingUsers ? (
                  <div className="text-center text-[#616161] py-8">Carregando...</div>
                ) : linkedUsers.length === 0 ? (
                  <div className="text-center text-[#616161] py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum usuário vinculado a este ISO</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkedUsers.map(user => {
                      const inheritedPercent = getInheritedPercent(user.categoryType);
                      return (
                        <div 
                          key={user.userId} 
                          className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-[#2E2E2E]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#2E2E2E] flex items-center justify-center">
                              <Users className="w-4 h-4 text-[#808080]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{user.userName}</span>
                                {getCategoryTypeBadge(user.categoryType)}
                              </div>
                              <span className="text-xs text-[#616161]">{user.userEmail}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {user.categoryType !== 'OUTRO' && (
                              <div className="flex items-center gap-1">
                                <Percent className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400 font-medium">
                                  {inheritedPercent.toFixed(4)}%
                                </span>
                                <span className="text-xs text-[#616161]">(herdado)</span>
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnlinkUserRequest(user.userId)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {isSuperAdmin && (
      <Card className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Tabelas MDR Vinculadas ({linkedTables.length})
          </CardTitle>
          {isSuperAdmin && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#ff9800] hover:bg-[#f57c00] text-black">
                  <Plus className="w-4 h-4 mr-2" />
                  Vincular Tabela
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#171717] border-[#2E2E2E] max-w-3xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle className="text-white">Vincular Tabela MDR</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label className="text-[#616161]">Fornecedor</Label>
                      <Select value={selectedFornecedor} onValueChange={setSelectedFornecedor}>
                        <SelectTrigger className="bg-[#0a0a0a] border-[#2E2E2E] text-white">
                          <SelectValue placeholder="Todos os fornecedores" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#171717] border-[#2E2E2E]">
                          <SelectItem value="ALL_SUPPLIERS">Todos os fornecedores</SelectItem>
                          {fornecedores.map(f => (
                            <SelectItem key={f.id} value={f.id || `fornecedor-${f.nome}`}>{f.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 relative">
                      <Label className="text-[#616161]">Buscar</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#616161]" />
                        <Input
                          value={tableSearch}
                          onChange={(e) => setTableSearch(e.target.value)}
                          className="pl-10 bg-[#0a0a0a] border-[#2E2E2E] text-white"
                          placeholder="MCC, CNAE ou descrição"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {availableToLink.length === 0 ? (
                      <p className="text-center text-[#616161] py-8">
                        Nenhuma tabela disponível para vincular
                      </p>
                    ) : (
                      availableToLink.map(table => (
                        <div 
                          key={table.fornecedorCategoryId}
                          className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-[#2E2E2E] hover:border-[#3E3E3E]"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-[#ff9800] text-[#ff9800] text-xs">
                                MCC {table.mcc}
                              </Badge>
                              <span className="text-white text-xs">{table.categoryName}</span>
                            </div>
                            <p className="text-xs text-[#616161] mt-3">
                              {isSuperAdmin ? `${table.fornecedorNome} | ` : ''}CNAE: {table.cnae}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleLinkTable(table.fornecedorCategoryId)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {linkedTables.length === 0 ? (
            <div className="text-center py-12 text-[#616161]">
              <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma tabela MDR vinculada a este ISO</p>
              {isSuperAdmin && (
                <p className="text-sm mt-2">Clique em "Vincular Tabela" para adicionar</p>
              )}
            </div>
          ) : (
            <Tabs defaultValue="pos" className="w-full">
              <TabsList className="bg-[#0a0a0a] border border-[#2E2E2E]">
                <TabsTrigger value="pos" className="data-[state=active]:bg-[#2E2E2E]">POS</TabsTrigger>
                <TabsTrigger value="online" className="data-[state=active]:bg-[#2E2E2E]">Online</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pos" className="mt-4">
                <div className="space-y-3">
                  {linkedTables.map(table => {
                    const isExpanded = expandedMccs.has(table.fornecedorCategoryId);
                    const bandeiras = parseBandeiras(table.bandeiras);
                    
                    return (
                      <div key={table.fornecedorCategoryId} className="border border-[#2E2E2E] rounded-lg overflow-hidden">
                        <div 
                          className="flex items-center justify-between p-3 bg-[#0a0a0a] hover:bg-[#1a1a1a] cursor-pointer"
                          onClick={() => toggleMccExpanded(table.fornecedorCategoryId)}
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-[#616161]" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-[#616161]" />
                            )}
                            <Badge variant="outline" className="border-[#ff9800] text-[#ff9800]">
                              {table.mcc}
                            </Badge>
                            <span className="text-white text-sm">{table.categoryName}</span>
                            <span className="text-xs text-[#616161]">({isSuperAdmin ? `${table.fornecedorNome} | ` : ''}{bandeiras.length} bandeiras)</span>
                            <MdrStatusBadge status={(table.status as MdrStatus) || 'rascunho'} size="sm" />
                          </div>
                          <div className="flex items-center gap-2">
                            {canValidateMdr && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); openValidationModal(table); }}
                                className="text-[#808080] hover:text-white hover:bg-[#2E2E2E]"
                              >
                                <Shield className="w-4 h-4" />
                              </Button>
                            )}
                            {isSuperAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleUnlinkTable(table.fornecedorCategoryId); }}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="bg-[#0f0f0f]">
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[900px] border-collapse">
                                <thead>
                                  <tr className="border-b border-[#2a2a2a]">
                                    <th className="sticky left-0 z-10 bg-[#0a0a0a] text-sm font-medium text-white p-3 text-left border-r border-[#2a2a2a] min-w-[100px]">
                                      Bandeiras
                                    </th>
                                    <th className="text-center min-w-[100px] text-xs font-medium text-[#616161] p-3 border-l border-[#2a2a2a]">Débito</th>
                                    <th className="text-center min-w-[100px] text-xs font-medium text-[#616161] p-3 border-l border-[#2a2a2a]">Crédito à vista</th>
                                    <th className="text-center min-w-[100px] text-xs font-medium text-[#616161] p-3 border-l border-[#2a2a2a]">Crédito 2-6x</th>
                                    <th className="text-center min-w-[100px] text-xs font-medium text-[#616161] p-3 border-l border-[#2a2a2a]">Crédito 7-12x</th>
                                    <th className="text-center min-w-[100px] text-xs font-medium text-[#616161] p-3 border-l border-[#2a2a2a]">Pré-pago</th>
                                    <th className="text-center min-w-[100px] text-xs font-medium text-[#616161] p-3 border-l border-[#2a2a2a]">Voucher</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bandeiras.map((bandeira, idx) => (
                                    <tr key={`pos-${table.fornecedorCategoryId}-${idx}`} className="border-b border-[#1f1f1f]">
                                      <td className="sticky left-0 z-10 bg-[#0a0a0a] text-white px-3 py-2 text-left border-r border-[#1f1f1f] font-medium text-sm">
                                        {bandeira}
                                      </td>
                                      <td className="text-center bg-[#121212] border-l border-[#1f1f1f] p-2">
                                        <EditableRateCell
                                          customerId={customerId}
                                          fornecedorCategoryId={table.fornecedorCategoryId}
                                          bandeira={bandeira}
                                          produto="debito"
                                          canal="pos"
                                          custoBase={parseRate(table.debitoPos, idx)}
                                          taxaFinalCalculada={calculateFinalRate(table.debitoPos, idx)}
                                          override={getOverride(table.fornecedorCategoryId, bandeira, 'debito', 'pos')}
                                          canEdit={canEditRates}
                                          isSuperAdmin={isSuperAdmin}
                                          isCore={isCore}
                                          marginOutbank={parseFloat(marginOutbank) || 0}
                                          marginExecutivo={parseFloat(marginExecutivo) || 0}
                                          marginCore={parseFloat(marginCore) || 0}
                                          onOverrideChange={loadOverrides}
                                        />
                                      </td>
                                      <td className="text-center bg-[#121212] border-l border-[#1f1f1f] p-2">
                                        <EditableRateCell
                                          customerId={customerId}
                                          fornecedorCategoryId={table.fornecedorCategoryId}
                                          bandeira={bandeira}
                                          produto="credito"
                                          canal="pos"
                                          custoBase={parseRate(table.creditoPos, idx)}
                                          taxaFinalCalculada={calculateFinalRate(table.creditoPos, idx)}
                                          override={getOverride(table.fornecedorCategoryId, bandeira, 'credito', 'pos')}
                                          canEdit={canEditRates}
                                          isSuperAdmin={isSuperAdmin}
                                          isCore={isCore}
                                          marginOutbank={parseFloat(marginOutbank) || 0}
                                          marginExecutivo={parseFloat(marginExecutivo) || 0}
                                          marginCore={parseFloat(marginCore) || 0}
                                          onOverrideChange={loadOverrides}
                                        />
                                      </td>
                                      <td className="text-center bg-[#121212] border-l border-[#1f1f1f] p-2">
                                        <EditableRateCell
                                          customerId={customerId}
                                          fornecedorCategoryId={table.fornecedorCategoryId}
                                          bandeira={bandeira}
                                          produto="credito2x"
                                          canal="pos"
                                          custoBase={parseRate(table.credito2xPos, idx)}
                                          taxaFinalCalculada={calculateFinalRate(table.credito2xPos, idx)}
                                          override={getOverride(table.fornecedorCategoryId, bandeira, 'credito2x', 'pos')}
                                          canEdit={canEditRates}
                                          isSuperAdmin={isSuperAdmin}
                                          isCore={isCore}
                                          marginOutbank={parseFloat(marginOutbank) || 0}
                                          marginExecutivo={parseFloat(marginExecutivo) || 0}
                                          marginCore={parseFloat(marginCore) || 0}
                                          onOverrideChange={loadOverrides}
                                        />
                                      </td>
                                      <td className="text-center bg-[#121212] border-l border-[#1f1f1f] p-2">
                                        <EditableRateCell
                                          customerId={customerId}
                                          fornecedorCategoryId={table.fornecedorCategoryId}
                                          bandeira={bandeira}
                                          produto="credito7x"
                                          canal="pos"
                                          custoBase={parseRate(table.credito7xPos, idx)}
                                          taxaFinalCalculada={calculateFinalRate(table.credito7xPos, idx)}
                                          override={getOverride(table.fornecedorCategoryId, bandeira, 'credito7x', 'pos')}
                                          canEdit={canEditRates}
                                          isSuperAdmin={isSuperAdmin}
                                          isCore={isCore}
                                          marginOutbank={parseFloat(marginOutbank) || 0}
                                          marginExecutivo={parseFloat(marginExecutivo) || 0}
                                          marginCore={parseFloat(marginCore) || 0}
                                          onOverrideChange={loadOverrides}
                                        />
                                      </td>
                                      <td className="text-center bg-[#121212] border-l border-[#1f1f1f] p-2">
                                        <EditableRateCell
                                          customerId={customerId}
                                          fornecedorCategoryId={table.fornecedorCategoryId}
                                          bandeira={bandeira}
                                          produto="pre"
                                          canal="pos"
                                          custoBase={parseRate(table.prePos, idx)}
                                          taxaFinalCalculada={calculateFinalRate(table.prePos, idx)}
                                          override={getOverride(table.fornecedorCategoryId, bandeira, 'pre', 'pos')}
                                          canEdit={canEditRates}
                                          isSuperAdmin={isSuperAdmin}
                                          isCore={isCore}
                                          marginOutbank={parseFloat(marginOutbank) || 0}
                                          marginExecutivo={parseFloat(marginExecutivo) || 0}
                                          marginCore={parseFloat(marginCore) || 0}
                                          onOverrideChange={loadOverrides}
                                        />
                                      </td>
                                      <td className="text-center bg-[#121212] border-l border-[#1f1f1f] p-2">
                                        <EditableRateCell
                                          customerId={customerId}
                                          fornecedorCategoryId={table.fornecedorCategoryId}
                                          bandeira={bandeira}
                                          produto="voucher"
                                          canal="pos"
                                          custoBase={parseRate(table.voucherPos, idx)}
                                          taxaFinalCalculada={calculateFinalRate(table.voucherPos, idx)}
                                          override={getOverride(table.fornecedorCategoryId, bandeira, 'voucher', 'pos')}
                                          canEdit={canEditRates}
                                          isSuperAdmin={isSuperAdmin}
                                          isCore={isCore}
                                          marginOutbank={parseFloat(marginOutbank) || 0}
                                          marginExecutivo={parseFloat(marginExecutivo) || 0}
                                          marginCore={parseFloat(marginCore) || 0}
                                          onOverrideChange={loadOverrides}
                                        />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="grid grid-cols-2 gap-4 p-4 border-t border-[#2a2a2a]">
                              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#2a2a2a]">
                                <div className="text-xs text-[#616161] mb-2">PIX</div>
                                <EditableRateCell
                                  customerId={customerId}
                                  fornecedorCategoryId={table.fornecedorCategoryId}
                                  bandeira="PIX"
                                  produto="pix"
                                  canal="pos"
                                  custoBase={parseRate(table.custoPixPos, 0)}
                                  taxaFinalCalculada={calculateFinalRate(table.custoPixPos, 0)}
                                  override={getOverride(table.fornecedorCategoryId, 'PIX', 'pix', 'pos')}
                                  canEdit={canEditRates}
                                  isSuperAdmin={isSuperAdmin}
                                  marginOutbank={parseFloat(marginOutbank) || 0}
                                  marginExecutivo={parseFloat(marginExecutivo) || 0}
                                  marginCore={parseFloat(marginCore) || 0}
                                  onOverrideChange={loadOverrides}
                                />
                              </div>
                              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#2a2a2a]">
                                <div className="text-xs text-[#616161] mb-2">Antecipação</div>
                                <EditableRateCell
                                  customerId={customerId}
                                  fornecedorCategoryId={table.fornecedorCategoryId}
                                  bandeira="ANTECIPACAO"
                                  produto="antecipacao"
                                  canal="pos"
                                  custoBase={parseRate(table.antecipacao, 0)}
                                  taxaFinalCalculada={calculateFinalRate(table.antecipacao, 0)}
                                  override={getOverride(table.fornecedorCategoryId, 'ANTECIPACAO', 'antecipacao', 'pos')}
                                  canEdit={canEditRates}
                                  isSuperAdmin={isSuperAdmin}
                                  marginOutbank={parseFloat(marginOutbank) || 0}
                                  marginExecutivo={parseFloat(marginExecutivo) || 0}
                                  marginCore={parseFloat(marginCore) || 0}
                                  onOverrideChange={loadOverrides}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
              
              <TabsContent value="online" className="mt-4">
                <div className="space-y-3">
                  {linkedTables.map(table => {
                    const isExpanded = expandedMccs.has(table.fornecedorCategoryId);
                    const bandeiras = parseBandeiras(table.bandeiras);
                    
                    return (
                      <div key={table.fornecedorCategoryId} className="border border-[#2E2E2E] rounded-lg overflow-hidden">
                        <div 
                          className="flex items-center justify-between p-3 bg-[#0a0a0a] hover:bg-[#1a1a1a] cursor-pointer"
                          onClick={() => toggleMccExpanded(table.fornecedorCategoryId)}
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-[#616161]" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-[#616161]" />
                            )}
                            <Badge variant="outline" className="border-[#ff9800] text-[#ff9800]">
                              {table.mcc}
                            </Badge>
                            <span className="text-white text-sm">{table.categoryName}</span>
                            <span className="text-xs text-[#616161]">({isSuperAdmin ? `${table.fornecedorNome} | ` : ''}{bandeiras.length} bandeiras)</span>
                            <MdrStatusBadge status={(table.status as MdrStatus) || 'rascunho'} size="sm" />
                          </div>
                          <div className="flex items-center gap-2">
                            {canValidateMdr && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); openValidationModal(table); }}
                                className="text-[#808080] hover:text-white hover:bg-[#2E2E2E]"
                              >
                                <Shield className="w-4 h-4" />
                              </Button>
                            )}
                            {isSuperAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleUnlinkTable(table.fornecedorCategoryId); }}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="bg-[#0f0f0f]">
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[900px] border-collapse">
                                <thead>
                                  <tr className="border-b border-[#2a2a2a]">
                                    <th className="sticky left-0 z-10 bg-[#0a0a0a] text-sm font-medium text-white p-3 text-left border-r border-[#2a2a2a] min-w-[100px]">
                                      Bandeiras
                                    </th>
                                    <th className="text-center min-w-[100px] text-xs font-medium text-[#616161] p-3 border-l border-[#2a2a2a]">Débito</th>
                                    <th className="text-center min-w-[100px] text-xs font-medium text-[#616161] p-3 border-l border-[#2a2a2a]">Crédito à vista</th>
                                    <th className="text-center min-w-[100px] text-xs font-medium text-[#616161] p-3 border-l border-[#2a2a2a]">Crédito 2-6x</th>
                                    <th className="text-center min-w-[100px] text-xs font-medium text-[#616161] p-3 border-l border-[#2a2a2a]">Crédito 7-12x</th>
                                    <th className="text-center min-w-[100px] text-xs font-medium text-[#616161] p-3 border-l border-[#2a2a2a]">Pré-pago</th>
                                    <th className="text-center min-w-[100px] text-xs font-medium text-[#616161] p-3 border-l border-[#2a2a2a]">Voucher</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bandeiras.map((bandeira, idx) => (
                                    <tr key={`online-${table.fornecedorCategoryId}-${idx}`} className="border-b border-[#1f1f1f]">
                                      <td className="sticky left-0 z-10 bg-[#0a0a0a] text-white px-3 py-2 text-left border-r border-[#1f1f1f] font-medium text-sm">
                                        {bandeira}
                                      </td>
                                      <td className="text-center bg-[#121212] border-l border-[#1f1f1f] p-2">
                                        <EditableRateCell
                                          customerId={customerId}
                                          fornecedorCategoryId={table.fornecedorCategoryId}
                                          bandeira={bandeira}
                                          produto="debito"
                                          canal="online"
                                          custoBase={parseRate(table.debitoOnline, idx)}
                                          taxaFinalCalculada={calculateFinalRate(table.debitoOnline, idx)}
                                          override={getOverride(table.fornecedorCategoryId, bandeira, 'debito', 'online')}
                                          canEdit={canEditRates}
                                          isSuperAdmin={isSuperAdmin}
                                          isCore={isCore}
                                          marginOutbank={parseFloat(marginOutbank) || 0}
                                          marginExecutivo={parseFloat(marginExecutivo) || 0}
                                          marginCore={parseFloat(marginCore) || 0}
                                          onOverrideChange={loadOverrides}
                                        />
                                      </td>
                                      <td className="text-center bg-[#121212] border-l border-[#1f1f1f] p-2">
                                        <EditableRateCell
                                          customerId={customerId}
                                          fornecedorCategoryId={table.fornecedorCategoryId}
                                          bandeira={bandeira}
                                          produto="credito"
                                          canal="online"
                                          custoBase={parseRate(table.creditoOnline, idx)}
                                          taxaFinalCalculada={calculateFinalRate(table.creditoOnline, idx)}
                                          override={getOverride(table.fornecedorCategoryId, bandeira, 'credito', 'online')}
                                          canEdit={canEditRates}
                                          isSuperAdmin={isSuperAdmin}
                                          isCore={isCore}
                                          marginOutbank={parseFloat(marginOutbank) || 0}
                                          marginExecutivo={parseFloat(marginExecutivo) || 0}
                                          marginCore={parseFloat(marginCore) || 0}
                                          onOverrideChange={loadOverrides}
                                        />
                                      </td>
                                      <td className="text-center bg-[#121212] border-l border-[#1f1f1f] p-2">
                                        <EditableRateCell
                                          customerId={customerId}
                                          fornecedorCategoryId={table.fornecedorCategoryId}
                                          bandeira={bandeira}
                                          produto="credito2x"
                                          canal="online"
                                          custoBase={parseRate(table.credito2xOnline, idx)}
                                          taxaFinalCalculada={calculateFinalRate(table.credito2xOnline, idx)}
                                          override={getOverride(table.fornecedorCategoryId, bandeira, 'credito2x', 'online')}
                                          canEdit={canEditRates}
                                          isSuperAdmin={isSuperAdmin}
                                          isCore={isCore}
                                          marginOutbank={parseFloat(marginOutbank) || 0}
                                          marginExecutivo={parseFloat(marginExecutivo) || 0}
                                          marginCore={parseFloat(marginCore) || 0}
                                          onOverrideChange={loadOverrides}
                                        />
                                      </td>
                                      <td className="text-center bg-[#121212] border-l border-[#1f1f1f] p-2">
                                        <EditableRateCell
                                          customerId={customerId}
                                          fornecedorCategoryId={table.fornecedorCategoryId}
                                          bandeira={bandeira}
                                          produto="credito7x"
                                          canal="online"
                                          custoBase={parseRate(table.credito7xOnline, idx)}
                                          taxaFinalCalculada={calculateFinalRate(table.credito7xOnline, idx)}
                                          override={getOverride(table.fornecedorCategoryId, bandeira, 'credito7x', 'online')}
                                          canEdit={canEditRates}
                                          isSuperAdmin={isSuperAdmin}
                                          isCore={isCore}
                                          marginOutbank={parseFloat(marginOutbank) || 0}
                                          marginExecutivo={parseFloat(marginExecutivo) || 0}
                                          marginCore={parseFloat(marginCore) || 0}
                                          onOverrideChange={loadOverrides}
                                        />
                                      </td>
                                      <td className="text-center bg-[#121212] border-l border-[#1f1f1f] p-2">
                                        <EditableRateCell
                                          customerId={customerId}
                                          fornecedorCategoryId={table.fornecedorCategoryId}
                                          bandeira={bandeira}
                                          produto="pre"
                                          canal="online"
                                          custoBase={parseRate(table.preOnline, idx)}
                                          taxaFinalCalculada={calculateFinalRate(table.preOnline, idx)}
                                          override={getOverride(table.fornecedorCategoryId, bandeira, 'pre', 'online')}
                                          canEdit={canEditRates}
                                          isSuperAdmin={isSuperAdmin}
                                          isCore={isCore}
                                          marginOutbank={parseFloat(marginOutbank) || 0}
                                          marginExecutivo={parseFloat(marginExecutivo) || 0}
                                          marginCore={parseFloat(marginCore) || 0}
                                          onOverrideChange={loadOverrides}
                                        />
                                      </td>
                                      <td className="text-center bg-[#121212] border-l border-[#1f1f1f] p-2">
                                        <EditableRateCell
                                          customerId={customerId}
                                          fornecedorCategoryId={table.fornecedorCategoryId}
                                          bandeira={bandeira}
                                          produto="voucher"
                                          canal="online"
                                          custoBase={parseRate(table.voucherOnline, idx)}
                                          taxaFinalCalculada={calculateFinalRate(table.voucherOnline, idx)}
                                          override={getOverride(table.fornecedorCategoryId, bandeira, 'voucher', 'online')}
                                          canEdit={canEditRates}
                                          isSuperAdmin={isSuperAdmin}
                                          isCore={isCore}
                                          marginOutbank={parseFloat(marginOutbank) || 0}
                                          marginExecutivo={parseFloat(marginExecutivo) || 0}
                                          marginCore={parseFloat(marginCore) || 0}
                                          onOverrideChange={loadOverrides}
                                        />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="grid grid-cols-2 gap-4 p-4 border-t border-[#2a2a2a]">
                              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#2a2a2a]">
                                <div className="text-xs text-[#616161] mb-2">PIX</div>
                                <EditableRateCell
                                  customerId={customerId}
                                  fornecedorCategoryId={table.fornecedorCategoryId}
                                  bandeira="PIX"
                                  produto="pix"
                                  canal="online"
                                  custoBase={parseRate(table.custoPixOnline, 0)}
                                  taxaFinalCalculada={calculateFinalRate(table.custoPixOnline, 0)}
                                  override={getOverride(table.fornecedorCategoryId, 'PIX', 'pix', 'online')}
                                  canEdit={canEditRates}
                                  isSuperAdmin={isSuperAdmin}
                                  marginOutbank={parseFloat(marginOutbank) || 0}
                                  marginExecutivo={parseFloat(marginExecutivo) || 0}
                                  marginCore={parseFloat(marginCore) || 0}
                                  onOverrideChange={loadOverrides}
                                />
                              </div>
                              <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#2a2a2a]">
                                <div className="text-xs text-[#616161] mb-2">Antecipação</div>
                                <EditableRateCell
                                  customerId={customerId}
                                  fornecedorCategoryId={table.fornecedorCategoryId}
                                  bandeira="ANTECIPACAO"
                                  produto="antecipacao"
                                  canal="online"
                                  custoBase={parseRate(table.antecipacaoOnline, 0)}
                                  taxaFinalCalculada={calculateFinalRate(table.antecipacaoOnline, 0)}
                                  override={getOverride(table.fornecedorCategoryId, 'ANTECIPACAO', 'antecipacao', 'online')}
                                  canEdit={canEditRates}
                                  isSuperAdmin={isSuperAdmin}
                                  marginOutbank={parseFloat(marginOutbank) || 0}
                                  marginExecutivo={parseFloat(marginExecutivo) || 0}
                                  marginCore={parseFloat(marginCore) || 0}
                                  onOverrideChange={loadOverrides}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
      )}

      <Dialog open={showCoreWarningDialog} onOpenChange={setShowCoreWarningDialog}>
        <DialogContent className="bg-[#141414] border-[#2E2E2E] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Atenção
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-[#b0b0b0] text-sm">
              Nenhuma margem foi atribuída. As taxas a partir de agora serão disponibilizadas para o ISO sem a sua margem.
            </p>
            <p className="text-[#808080] text-xs mt-3">
              Deseja continuar mesmo assim?
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setShowCoreWarningDialog(false)}
              className="border-[#2E2E2E] text-white hover:bg-[#2E2E2E]"
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => handleSaveMargins(true)}
              disabled={saving}
              className="bg-[#2E2E2E] hover:bg-[#3a3a3a] text-white border border-[#3a3a3a]"
            >
              {saving ? 'Salvando...' : 'Continuar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {validationModal && (
        <IsoMdrValidationModal
          isOpen={validationModal.isOpen}
          onClose={() => setValidationModal(null)}
          customerId={customerId}
          linkId={validationModal.linkId}
          mcc={validationModal.mcc}
          categoryName={validationModal.categoryName}
          fornecedorNome={validationModal.fornecedorNome}
          currentStatus={validationModal.currentStatus}
          onStatusChange={handleStatusChange}
          canValidate={canValidateMdr}
        />
      )}

      <ConfirmDialog
        open={confirmUnlinkUserOpen}
        onOpenChange={setConfirmUnlinkUserOpen}
        title="Desvincular Usuário"
        description="Tem certeza que deseja desvincular este usuário? Esta ação não pode ser desfeita."
        confirmText="Desvincular"
        cancelText="Cancelar"
        onConfirm={handleUnlinkUserConfirm}
        variant="destructive"
      />
    </div>
  );
}
