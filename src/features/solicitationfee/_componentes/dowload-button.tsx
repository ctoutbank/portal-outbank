"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText, ImageIcon, Music, Video, Archive, Loader2 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { getSolicitationFeeDocuments } from "../server/solicitationfee"

interface DownloadItem {
  id: number;
  name: string;
  description?: string;
  fileType: "pdf" | "image" | "audio" | "video" | "archive" | "document";
  size?: string;
  downloadUrl: string;
}

interface ListDocumentDownloadProps {
  solicitationFeeId: number;
}

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case "pdf":
    case "document":
      return <FileText className="w-5 h-5" />;
    case "image":
      return <ImageIcon className="w-5 h-5" />;
    case "audio":
      return <Music className="w-5 h-5" />;
    case "video":
      return <Video className="w-5 h-5" />;
    case "archive":
      return <Archive className="w-5 h-5" />;
    default:
      return <FileText className="w-5 h-5" />;
  }
};

const getFileTypeColor = (fileType: string) => {
  switch (fileType) {
    case "pdf":
      return "text-red-600";
    case "document":
      return "text-blue-600";
    case "image":
      return "text-green-600";
    case "audio":
      return "text-purple-600";
    case "video":
      return "text-orange-600";
    case "archive":
      return "text-gray-600";
    default:
      return "text-gray-600";
  }
};

const getFileTypeFromExtension = (extension: string): "pdf" | "image" | "audio" | "video" | "archive" | "document" => {
  extension = extension.toLowerCase();
  if (extension === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) return "image";
  if (["mp3", "wav", "ogg"].includes(extension)) return "audio";
  if (["mp4", "avi", "mov", "webm"].includes(extension)) return "video";
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) return "archive";
  return "document";
};

export default function ListDocumentDownload({ solicitationFeeId }: ListDocumentDownloadProps) {
  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    if (!solicitationFeeId) return;

    setIsLoading(true);
    try {
      const documents = await getSolicitationFeeDocuments(solicitationFeeId);

      const items: DownloadItem[] = documents.map((doc) => ({
        id: Number(doc.id),
        name: doc.name || `documento-${doc.id}`,
        description: "Documento da solicitação",
        fileType: getFileTypeFromExtension(doc.name?.split('.').pop() || 'pdf'),
        downloadUrl: doc.url || '',
        size: "Arquivo digital",
      }));

      setDownloadItems(items);
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
      toast.error("Erro ao carregar documentos", {
        description: "Não foi possível carregar os documentos. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [solicitationFeeId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDownload = (item: DownloadItem) => {
    try {
      window.open(item.downloadUrl, '_blank');
    } catch (error) {
      console.error("Erro ao abrir documento:", error);
      toast.error("Erro ao abrir documento", {
        description: "Não foi possível abrir o documento. Verifique se o bloqueador de pop-ups está desativado.",
      });
    }
  };

  return (
    <Card className="w-full max-w-5xl min-w-[600px] mx-0 ml-0 rounded-lg shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Download className="w-5 h-5" />
          Documentos da Solicitação
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        {isLoading ? (
          <div className="py-4 text-left text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando documentos...
          </div>
        ) : downloadItems.length === 0 ? (
          <div className="py-4 text-left text-muted-foreground">
            Nenhum documento disponível para esta solicitação.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {downloadItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col p-3 border rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`${getFileTypeColor(item.fileType)}`}>
                    {getFileIcon(item.fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-xs truncate">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </p>
                    )}
                    {item.size && (
                      <span className="text-xs text-muted-foreground">
                        {item.size}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(item)}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
