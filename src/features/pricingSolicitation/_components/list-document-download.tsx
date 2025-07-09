"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFilesByEntity } from "../../categories/server/upload";
import {
  Archive,
  Download,
  FileText,
  ImageIcon,
  Music,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";

interface DownloadItem {
  id: number;
  name: string;
  description?: string;
  fileType: "pdf" | "image" | "audio" | "video" | "archive" | "document";
  size?: string;
  downloadUrl: string;
}

interface ListDocumentDownloadProps {
  solicitationId: number;
  refreshKey?: number;
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

const getFileTypeFromExtension = (
  extension: string
): "pdf" | "image" | "audio" | "video" | "archive" | "document" => {
  extension = extension.toLowerCase();
  if (extension === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) return "image";
  if (["mp3", "wav", "ogg"].includes(extension)) return "audio";
  if (["mp4", "avi", "mov", "webm"].includes(extension)) return "video";
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) return "archive";
  return "document";
};

export default function ListDocumentDownload({
  solicitationId,
  refreshKey,
}: ListDocumentDownloadProps) {
  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async () => {
    if (!solicitationId) return;

    setIsLoading(true);
    try {
      const files = await getFilesByEntity("solicitationFee", solicitationId);

      const items: DownloadItem[] = files.map((file) => ({
        id: file.id,
        name: file.fileName + "." + file.extension,
        description: `Documento da solicitação`,
        fileType: getFileTypeFromExtension(file.extension),
        downloadUrl: file.fileUrl,
        size: "Arquivo digital",
      }));

      setDownloadItems(items);
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solicitationId, refreshKey]);

  const handleDownload = (item: DownloadItem) => {
    // Abre o arquivo em uma nova aba
    window.open(item.downloadUrl, "_blank");
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
          <div className="py-4 text-left text-muted-foreground">
            Carregando documentos...
          </div>
        ) : downloadItems.length === 0 ? (
          <div className="py-4 text-left text-muted-foreground">
            Nenhum documento disponível para esta solicitação.
          </div>
        ) : (
          <div className="space-y-2">
            {downloadItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-3 py-2 border rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
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
                  className="ml-4 shrink-0"
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
