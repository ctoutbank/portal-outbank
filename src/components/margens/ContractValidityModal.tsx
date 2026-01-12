'use client';

import { useState } from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface ContractValidityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkId: string;
  currentValidFrom?: string | null;
  currentValidUntil?: string | null;
  currentAutoRenew?: boolean;
  onSuccess?: () => void;
}

export function ContractValidityModal({
  open,
  onOpenChange,
  linkId,
  currentValidFrom,
  currentValidUntil,
  currentAutoRenew = true,
  onSuccess
}: ContractValidityModalProps) {
  const [validFrom, setValidFrom] = useState(currentValidFrom || new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(currentValidUntil || '');
  const [autoRenew, setAutoRenew] = useState(currentAutoRenew);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!validUntil) {
      toast.error('Data de término é obrigatória');
      return;
    }

    if (new Date(validUntil) <= new Date(validFrom)) {
      toast.error('Data de término deve ser posterior à data de início');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/iso-links/${linkId}/validity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validFrom, validUntil, autoRenew })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao salvar');
      }

      toast.success('Validade do contrato definida com sucesso');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar validade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Validade do Contrato
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="validFrom">Data de Início</Label>
            <Input
              id="validFrom"
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="validUntil">Data de Término</Label>
            <Input
              id="validUntil"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Renovação Automática</Label>
              <p className="text-xs text-muted-foreground">
                Aplica nova versão automaticamente no vencimento
              </p>
            </div>
            <Switch
              checked={autoRenew}
              onCheckedChange={setAutoRenew}
            />
          </div>

          {autoRenew && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-md border border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <p className="text-xs text-yellow-800">
                Com renovação automática, se houver uma nova versão de taxas disponível, 
                ela será aplicada automaticamente quando o contrato vencer.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
