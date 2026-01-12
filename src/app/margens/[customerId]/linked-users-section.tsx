'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Users, Plus, Trash2, UserPlus, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface LinkedUser {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  categoryType: string;
  categoryName: string;
  inheritedPercent: number;
}

interface AvailableUser {
  id: number;
  name: string;
  email: string;
  categoryType: string;
  categoryName: string;
}

interface LinkedUsersSectionProps {
  customerId: number;
  isSuperAdmin: boolean;
  marginExecutivo: string;
  marginCore: string;
}

export function LinkedUsersSection({ 
  customerId, 
  isSuperAdmin,
  marginExecutivo,
  marginCore 
}: LinkedUsersSectionProps) {
  const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [confirmUnlinkOpen, setConfirmUnlinkOpen] = useState(false);
  const [pendingUnlinkUserId, setPendingUnlinkUserId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [customerId]);

  const loadData = async () => {
    setLoading(true);
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
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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

    // Obter o categoryType do usuário selecionado para usar como commissionType
    const user = availableUsers.find(u => String(u.id) === selectedUser);
    const commissionType = user?.categoryType;

    setSaving(true);
    try {
      const response = await fetch('/api/margens/linked-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: Number(selectedUser),
          customerId,
          commissionType
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao vincular usuário');
      }

      toast.success('Usuário vinculado com sucesso!');
      setShowAddDialog(false);
      setSelectedUser('');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao vincular usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlinkUserRequest = (userId: number) => {
    setPendingUnlinkUserId(userId);
    setConfirmUnlinkOpen(true);
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
      loadData();
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

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <Card className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-white">
          <UserPlus className="w-5 h-5 text-[#ff9800]" />
          Usuários Vinculados
        </CardTitle>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
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
                onClick={() => setShowAddDialog(false)}
                className="border-[#2E2E2E] text-white hover:bg-[#2E2E2E]"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleLinkUser} 
                disabled={saving || !selectedUser}
                className="bg-[#2E2E2E] hover:bg-[#3a3a3a] text-white border border-[#3a3a3a]"
              >
                {saving ? 'Vinculando...' : 'Vincular'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-[#616161] py-8">Carregando...</div>
        ) : linkedUsers.length === 0 ? (
          <div className="text-center text-[#616161] py-8">
            Nenhum usuário vinculado a este ISO
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
      </CardContent>

      <ConfirmDialog
        open={confirmUnlinkOpen}
        onOpenChange={setConfirmUnlinkOpen}
        title="Desvincular Usuário"
        description="Tem certeza que deseja desvincular este usuário? Esta ação não pode ser desfeita."
        confirmText="Desvincular"
        cancelText="Cancelar"
        onConfirm={handleUnlinkUserConfirm}
        variant="destructive"
      />
    </Card>
  );
}
