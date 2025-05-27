"use client"

import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { getSolicitationFeeDocuments } from "../server/solicitationfee"

interface DownloadButtonProps {
  solicitationFeeId: number;
}

export default function DownloadDocumentsButton({ solicitationFeeId }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [hasDocuments, setHasDocuments] = useState(false)
  const [isCheckingDocuments, setIsCheckingDocuments] = useState(true)

  // Verificar se existem documentos disponíveis quando o componente é montado
  useEffect(() => {
    const checkDocuments = async () => {
      try {
        const documents = await getSolicitationFeeDocuments(solicitationFeeId);
        setHasDocuments(documents.length > 0);
      } catch (error) {
        console.error("Erro ao verificar documentos:", error);
        setHasDocuments(false);
      } finally {
        setIsCheckingDocuments(false);
      }
    };

    checkDocuments();
  }, [solicitationFeeId]);

  const downloadFile = async (url: string, filename: string) => {
    try {
      // Abre o arquivo em uma nova aba
      window.open(url, '_blank');
      return true;
    } catch (error) {
      console.error(`Erro ao abrir ${filename}:`, error);
      return false;
    }
  }

  const handleDownloadDocuments = async () => {
    setIsDownloading(true);

    try {
      // Buscar documentos diretamente da server action
      const documents = await getSolicitationFeeDocuments(solicitationFeeId);

      if (documents.length === 0) {
        toast.error("Nenhum documento encontrado", {
          description: "Não há documentos disponíveis para download.",
        });
        return;
      }

      toast.info("Iniciando downloads", {
        description: `${documents.length} documento(s) encontrado(s).`,
      });

      // Download de cada documento em sequência
      let successCount = 0;
      
      for (const doc of documents) {
        if (doc.url) {
          const filename = doc.name || `documento-${doc.id}.pdf`;
          const success = await downloadFile(doc.url, filename);
          
          if (success) {
            successCount++;
          }
          
          // Pequeno delay entre downloads para evitar bloqueio do navegador
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      if (successCount > 0) {
        toast.success("Downloads iniciados", {
          description: `${successCount} documento(s) sendo aberto(s).`,
        });
      } else {
        toast.error("Falha nos downloads", {
          description: "Não foi possível abrir os documentos. Verifique se o bloqueador de pop-ups está desativado.",
        });
      }
    } catch (error) {
      console.error("Erro ao fazer download dos documentos:", error);
      toast.error("Erro no download", {
        description: "Ocorreu um erro ao baixar os documentos. Tente novamente.",
      });
    } finally {
      setIsDownloading(false);
    }
  }

  // Determinar o texto do botão e status de desabilitar
  let buttonText = "Download Documentos";
  let buttonIcon = <Download className="h-4 w-4" />;
  let isDisabled = isDownloading || isCheckingDocuments;
  let tooltipText = "";

  if (isCheckingDocuments) {
    buttonText = "Verificando documentos...";
    buttonIcon = <Loader2 className="h-4 w-4 animate-spin" />;
    tooltipText = "Verificando se existem documentos disponíveis";
  } else if (isDownloading) {
    buttonText = "Baixando...";
    buttonIcon = <Loader2 className="h-4 w-4 animate-spin" />;
  } else if (!hasDocuments) {
    buttonText = "Sem documentos";
    isDisabled = true;
    tooltipText = "Não há documentos disponíveis para download";
  }

  return (
    <Button 
      onClick={handleDownloadDocuments} 
      disabled={isDisabled} 
      className="flex items-center gap-2"
      title={tooltipText}
    >
      {buttonIcon}
      {buttonText}
    </Button>
  )
}
