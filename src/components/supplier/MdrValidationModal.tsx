'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MdrStatusBadge, MdrStatus } from './MdrStatusBadge';

interface MdrValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  fornecedorId: string;
  categoryId: number;
  categoryName: string;
  mcc: string;
  currentStatus: MdrStatus;
  onStatusChange: (newStatus: MdrStatus) => void;
}

export function MdrValidationModal({
  isOpen,
  onClose,
  fornecedorId,
  categoryId,
  categoryName,
  mcc,
  currentStatus,
  onStatusChange
}: MdrValidationModalProps) {
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleAction = async (action: 'approve' | 'reject' | 'submit' | 'deactivate' | 'reactivate') => {
    if (action === 'reject' && !showRejectForm) {
      setShowRejectForm(true);
      return;
    }

    if (action === 'reject' && !rejectionReason.trim()) {
      toast.error('Por favor, informe o motivo da rejeição');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/supplier/${fornecedorId}/cnae/${categoryId}/validation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          reason: action === 'reject' ? rejectionReason : undefined 
        })
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Erro ao processar ação');
        return;
      }

      toast.success(result.message || 'Status atualizado com sucesso');
      onStatusChange(result.status);
      onClose();
      setShowRejectForm(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Erro ao processar validação:', error);
      toast.error('Erro ao processar validação');
    } finally {
      setLoading(false);
    }
  };

  const renderActions = () => {
    if (showRejectForm) {
      return (
        <div className="space-y-4">
          <Textarea
            placeholder="Informe o motivo da rejeição..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="bg-[#212121] border-[#2E2E2E] text-white placeholder:text-[#616161] min-h-[100px]"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectForm(false);
                setRejectionReason('');
              }}
              className="flex-1 bg-transparent border-[#2E2E2E] text-white hover:bg-[#2E2E2E]"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleAction('reject')}
              disabled={loading || !rejectionReason.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Rejeição'}
            </Button>
          </div>
        </div>
      );
    }

    switch (currentStatus) {
      case 'rascunho':
      case 'rejeitada':
        return (
          <Button
            onClick={() => handleAction('submit')}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Submeter para Validação
          </Button>
        );

      case 'pendente_validacao':
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => handleAction('approve')}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Aprovar
            </Button>
            <Button
              onClick={() => handleAction('reject')}
              disabled={loading}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Rejeitar
            </Button>
          </div>
        );

      case 'validada':
        return (
          <Button
            onClick={() => handleAction('deactivate')}
            disabled={loading}
            variant="outline"
            className="w-full bg-transparent border-[#2E2E2E] text-white hover:bg-[#2E2E2E]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Desativar Tabela
          </Button>
        );

      case 'inativa':
        return (
          <Button
            onClick={() => handleAction('reactivate')}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Reativar Tabela
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1D1D1D] border-[#2E2E2E] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Validação de Tabela MDR</DialogTitle>
          <DialogDescription className="text-[#A0A0A0]">
            Gerencie o status de validação desta tabela de taxas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-[#171717] rounded-lg p-4 border border-[#2E2E2E]">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm text-[#A0A0A0]">MCC</p>
                <p className="text-white font-medium">{mcc}</p>
              </div>
              <MdrStatusBadge status={currentStatus} />
            </div>
            <div>
              <p className="text-sm text-[#A0A0A0]">Categoria</p>
              <p className="text-white">{categoryName}</p>
            </div>
          </div>

          {renderActions()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
