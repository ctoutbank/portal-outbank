'use client';

import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, X, FileImage, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

type ExtractType = 'pos' | 'online' | 'both';

interface ExtractedRate {
  brand: string;
  productType: string;
  rate: string;
}

interface OcrResult {
  pos?: ExtractedRate[];
  online?: ExtractedRate[];
  pixPos?: string;
  pixOnline?: string;
  antecipacaoPos?: string;
  antecipacaoOnline?: string;
}

interface OcrUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataExtracted: (data: OcrResult, extractType: ExtractType) => void;
}

export function OcrUploadModal({ isOpen, onClose, onDataExtracted }: OcrUploadModalProps) {
  const [extractType, setExtractType] = useState<ExtractType>('both');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 10MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleExtract = async () => {
    if (!selectedFile) {
      toast.error('Selecione uma imagem primeiro');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('extractType', extractType);

      const response = await fetch('/api/ocr/extract-mdr', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar imagem');
      }

      if (result.success && result.data) {
        const totalRates = (result.data.pos?.length || 0) + (result.data.online?.length || 0);
        
        if (totalRates > 0) {
          toast.success(`${totalRates} taxas extraídas com sucesso!`);
          onDataExtracted(result.data, extractType);
          handleClose();
        } else {
          toast.warning('Nenhuma taxa encontrada na imagem. Verifique se a imagem contém uma tabela de taxas MDR.');
        }
      }
    } catch (error: any) {
      console.error('Erro OCR:', error);
      toast.error(error.message || 'Erro ao processar imagem');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setExtractType('both');
    onClose();
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-[#171717] border-[#2E2E2E]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileImage className="w-5 h-5 text-[#ff9800]" />
            Importar Taxas via Imagem
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-[#a0a0a0]">Tipo de Extração</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setExtractType('pos')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  extractType === 'pos'
                    ? 'bg-[#ff9800] text-white'
                    : 'bg-[#212121] text-[#a0a0a0] border border-[#2E2E2E] hover:bg-[#2E2E2E]'
                }`}
              >
                CP (POS)
              </button>
              <button
                type="button"
                onClick={() => setExtractType('online')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  extractType === 'online'
                    ? 'bg-[#ff9800] text-white'
                    : 'bg-[#212121] text-[#a0a0a0] border border-[#2E2E2E] hover:bg-[#2E2E2E]'
                }`}
              >
                CNP (Online)
              </button>
              <button
                type="button"
                onClick={() => setExtractType('both')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  extractType === 'both'
                    ? 'bg-[#ff9800] text-white'
                    : 'bg-[#212121] text-[#a0a0a0] border border-[#2E2E2E] hover:bg-[#2E2E2E]'
                }`}
              >
                Ambos
              </button>
            </div>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
              dragOver
                ? 'border-[#ff9800] bg-[#ff9800]/10'
                : 'border-[#2E2E2E] hover:border-[#ff9800]/50 bg-[#0a0a0a]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />

            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded-lg"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="mt-2 text-sm text-[#a0a0a0]">{selectedFile?.name}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-10 h-10 text-[#616161] mx-auto" />
                <p className="text-sm text-[#a0a0a0]">
                  Arraste uma imagem ou clique para selecionar
                </p>
                <p className="text-xs text-[#616161]">
                  PNG, JPG, JPEG (máx. 10MB)
                </p>
              </div>
            )}
          </div>

          <div className="bg-[#0a0a0a] border border-[#2E2E2E] rounded-lg p-3">
            <p className="text-xs text-[#616161]">
              <strong className="text-[#a0a0a0]">Dica:</strong> Para melhores resultados, use imagens claras e legíveis da tabela de taxas MDR. O sistema reconhece automaticamente as bandeiras (Visa, Master, Elo, etc.) e tipos de transação (Débito, Crédito, Parcelado).
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm text-[#a0a0a0] bg-[#212121] border border-[#2E2E2E] rounded-lg hover:bg-[#2E2E2E] transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleExtract}
              disabled={!selectedFile || loading}
              className="px-6 py-2 text-sm font-medium text-white bg-[#ff9800] rounded-lg hover:bg-[#e68a00] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Extrair Dados
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
