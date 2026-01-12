'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';

interface ClearMdrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ClearMdrModal({ isOpen, onClose, onConfirm }: ClearMdrModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Erro ao limpar taxas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#171717] border border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
            <div className="p-2 bg-red-950/50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            Limpar Taxas MDR
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          <p className="text-[#a0a0a0] text-sm leading-relaxed">
            Tem certeza que deseja limpar todas as taxas cadastradas para este MCC?
          </p>
          <div className="mt-4 p-4 bg-red-950/20 border border-red-900/30 rounded-lg">
            <p className="text-red-400 text-sm font-medium">
              Esta ação não pode ser desfeita.
            </p>
            <p className="text-red-400/70 text-xs mt-1">
              O MCC voltará ao status "Sem taxas" e precisará ser preenchido novamente.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-[44px] px-5 text-sm font-medium text-[#a0a0a0] bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:bg-[#252525] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="h-[44px] px-5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Limpando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Confirmar Limpeza
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
