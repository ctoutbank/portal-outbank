'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Ban, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { MdrStatusBadge, MdrStatus } from '@/components/supplier/MdrStatusBadge';
import { validateMdrTable } from '@/app/margens/actions-new';

interface IsoMdrValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number;
  linkId: string;
  mcc: string;
  categoryName: string;
  fornecedorNome: string;
  currentStatus: MdrStatus;
  onStatusChange: (linkId: string, newStatus: MdrStatus) => void;
  canValidate: boolean;
}

export function IsoMdrValidationModal({
  isOpen,
  onClose,
  customerId,
  linkId,
  mcc,
  categoryName,
  fornecedorNome,
  currentStatus,
  onStatusChange,
  canValidate
}: IsoMdrValidationModalProps) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: MdrStatus) => {
    setLoading(true);
    try {
      const result = await validateMdrTable(customerId, linkId, newStatus as 'rascunho' | 'validada' | 'inativa');

      if (!result.success) {
        toast.error(result.error || 'Erro ao atualizar status');
        return;
      }

      toast.success(result.message || 'Status atualizado');
      onStatusChange(linkId, newStatus);
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setLoading(false);
    }
  };

  const renderActions = () => {
    if (!canValidate) {
      return (
        <p className="text-center text-[#A0A0A0] py-2">
          Você não tem permissão para aprovar tabelas de taxas
        </p>
      );
    }

    switch (currentStatus) {
      case 'rascunho':
        return (
          <Button
            onClick={() => handleStatusChange('validada')}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Aprovar Tabela
          </Button>
        );

      case 'validada':
        return (
          <Button
            onClick={() => handleStatusChange('inativa')}
            disabled={loading}
            className="w-full bg-[#212121] hover:bg-[#2E2E2E] text-white border border-[#3E3E3E]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
            Desativar Tabela
          </Button>
        );

      case 'inativa':
        return (
          <Button
            onClick={() => handleStatusChange('validada')}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
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
          <DialogTitle className="text-white">Aprovação de Tabela de Taxas</DialogTitle>
          <DialogDescription className="text-[#A0A0A0]">
            Gerencie o status desta tabela para o ISO
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
            <div className="mb-2">
              <p className="text-sm text-[#A0A0A0]">Categoria</p>
              <p className="text-white">{categoryName}</p>
            </div>
            <div>
              <p className="text-sm text-[#A0A0A0]">Fornecedor</p>
              <p className="text-white">{fornecedorNome}</p>
            </div>
          </div>

          {renderActions()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
