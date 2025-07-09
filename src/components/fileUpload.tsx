"use client";

import { createFileWithRelation, getFilesByFileType } from "../features/categories/server/upload";
import {
    AlertCircle,
    Download,
    Eye,
    FileText,
    Play,
    Upload,
    Video,
    X,
} from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface FileUploadProps {
    title: string;
    description: string;
    acceptedFileTypes?: string;
    maxSizeMB?: number;
    initialFiles?: File[];
    entityType:
        | "merchant"
        | "terminal"
        | "customer"
        | "payment"
        | "solicitationFee";
    entityId?: number;
    fileType?: string;
    onUploadComplete?: (fileData: {
        fileId: number;
        fileURL: string;
        fileName: string;
        fileExtension: string;
    }) => void;
    customUploadHandler?: () => Promise<number>;
    preUploadHook?: () => Promise<number>;
    type?: string;
}

interface FileWithCustomName extends File {
    customName: string;
    fileURL?: string;
}

// O erro pode estar relacionado a vários pontos neste componente, dependendo da mensagem de erro que você está recebendo.
// Vou explicar os principais pontos de atenção e possíveis causas de erro neste trecho do FileUpload:

export default function FileUpload({
                                       title,
                                       description,
                                       acceptedFileTypes = "pdf,PDF,jpeg,JPEG,jpg,JPG,mp4,MP4,txt,TXT",
                                       maxSizeMB = 10,
                                       entityType,
                                       entityId,
                                       fileType,
                                       onUploadComplete,
                                       customUploadHandler,
                                       preUploadHook,
                                       type,
                                   }: FileUploadProps) {
    const [files, setFiles] = useState<FileWithCustomName[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [playingVideo, setPlayingVideo] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [localEntityId, setLocalEntityId] = useState<number | undefined>(
        entityId
    );

    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // 1. Carregamento de arquivos existentes
    // Se fileType ou localEntityId estiverem undefined, não vai buscar arquivos.
    // Se getFilesByFileType lançar erro, será capturado e exibido.
    useEffect(() => {
        const loadExistingFiles = async () => {
            if (fileType && localEntityId) {
                try {
                    setIsLoading(true);
                    setError(null);
                    const existingFiles = await getFilesByFileType(
                        entityType,
                        localEntityId,
                        fileType
                    );

                    const formattedFiles = existingFiles.map(
                        (file) =>
                            ({
                                name: file.fileName,
                                customName: file.fileName,
                                type: `application/${file.extension.toLowerCase()}`,
                                size: 0,
                                fileURL: file.fileUrl,
                            }) as FileWithCustomName
                    );

                    setFiles(formattedFiles);
                    console.log(
                        `Carregados ${formattedFiles.length} arquivos para ${entityType}/${localEntityId}/${fileType}`
                    );
                } catch (error) {
                    // Aqui você verá o erro de carregamento de arquivos existentes
                    console.error("Erro ao carregar arquivos existentes:", error);
                    setError("Erro ao carregar arquivos existentes");
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };

        loadExistingFiles();
    }, [entityType, localEntityId, fileType]);

    // 2. Atualização do localEntityId quando entityId muda
    // Se entityId mudar, localEntityId é atualizado.
    useEffect(() => {
        if (entityId !== undefined && entityId !== localEntityId) {
            console.log(`ID da entidade atualizado: ${entityId}`);
            setLocalEntityId(entityId);
        }
    }, [entityId]);

    // 3. Upload de arquivos
    // Possíveis erros:
    // - acceptedFileTypes não bate com a extensão do arquivo
    // - arquivo maior que o permitido
    // - preUploadHook falha ao criar entidade
    // - createFileWithRelation lança erro
    // - Falta de entityId
    const handleFileChange = async (selectedFiles: FileList | null) => {
        setError(null);

        if (!selectedFiles || selectedFiles.length === 0) return;

        const newFiles = Array.from(selectedFiles)
            .filter((file) => {
                // Verifica extensão
                const fileExtension = file.name.split(".").pop()?.toLowerCase();

                if (
                    !acceptedFileTypes
                        .toLowerCase()
                        .split(",")
                        .includes(fileExtension || "")
                ) {
                    setError(
                        `Tipo de arquivo não suportado: ${
                            file.name
                        }. Use: ${acceptedFileTypes.replace(/,/g, ", ").toUpperCase()}`
                    );
                    return false;
                }

                // Verifica tamanho
                if (file.size > maxSizeBytes) {
                    setError(
                        `O arquivo ${file.name} excede o tamanho máximo de ${maxSizeMB}MB`
                    );
                    return false;
                }

                return true;
            })
            .map((file) => {
                const customName = `${fileType || title}+${file.name}`;
                return Object.assign(file, { customName }) as FileWithCustomName;
            });

        if (newFiles.length > 0) {
            setIsUploading(true);
            try {
                // Se não tem entityId, tenta criar com preUploadHook
                let finalEntityId = localEntityId;
                if (!finalEntityId && preUploadHook) {
                    try {
                        const createdEntityId = await preUploadHook();
                        if (createdEntityId) {
                            finalEntityId = createdEntityId;
                            setLocalEntityId(createdEntityId);
                        } else {
                            throw new Error("Falha ao criar entidades relacionadas");
                        }
                    } catch (error) {
                        // Se der erro aqui, vai cair neste catch
                        console.error("Erro no hook de pré-upload:", error);
                        setError("Erro ao preparar o upload. Tente novamente.");
                        setIsUploading(false);
                        return;
                    }
                }

                if (!finalEntityId && !customUploadHandler) {
                    setError("ID da entidade não disponível para upload");
                    setIsUploading(false);
                    return;
                }

                for (const file of newFiles) {
                    // Se customUploadHandler for passado, usa ele
                    if (customUploadHandler) {
                        const newId = await customUploadHandler();
                        finalEntityId = newId;
                    }
                    const formData = new FormData();
                    formData.append("File", file);
                    formData.append("fileName", fileType || title);

                    const result = await createFileWithRelation(
                        formData,
                        entityType,
                        finalEntityId || 0,
                        `${entityType}s/${finalEntityId}`,
                        fileType || title,
                        type
                    );

                    if (result && onUploadComplete) {
                        onUploadComplete(result);
                        console.log("Upload concluído com sucesso:", result);
                        file.fileURL = result.fileURL;
                    }
                }

                // Recarrega arquivos após upload
                const existingFiles = await getFilesByFileType(
                    entityType,
                    finalEntityId || 0,
                    fileType || ""
                );
                const formattedFiles = existingFiles.map(
                    (file) =>
                        ({
                            name: file.fileName,
                            customName: file.fileName,
                            type: `application/${file.extension.toLowerCase()}`,
                            size: 0,
                            fileURL: file.fileUrl,
                        }) as FileWithCustomName
                );

                setFiles(formattedFiles);
            } catch (error) {
                // Aqui você verá o erro detalhado do upload
                console.error("Erro detalhado do upload:", error);
                setError("Erro ao fazer upload dos arquivos. Tente novamente.");
            } finally {
                setIsUploading(false);
            }
        }
    };

    // DICAS DE DEBUG:
    // 1. Veja o console do navegador e do servidor para mensagens de erro detalhadas.
    // 2. Se o erro for "ID da entidade não disponível para upload", provavelmente o preUploadHook não está retornando o ID esperado.
    // 3. Se o erro for "Erro ao carregar arquivos existentes", pode ser problema de permissão, endpoint, ou entityId/fileType inválidos.
    // 4. Se o erro for "Tipo de arquivo não suportado", revise o acceptedFileTypes e a extensão do arquivo enviado.
    // 5. Se o erro for "Erro detalhado do upload", pode ser erro no backend (createFileWithRelation) ou na comunicação com o servidor.

    // Se você puder compartilhar a mensagem de erro exata, posso ajudar de forma mais direcionada!

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileChange(e.dataTransfer.files);
    };

    const handleClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        if (playingVideo === URL.createObjectURL(files[index])) {
            setPlayingVideo(null);
        }
    };

    const getFileExtension = (filename: string) => {
        return filename
            .slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2)
            .toUpperCase();
    };

    const getTruncatedFileName = (originalName: string, maxLength = 20) => {
        const extension = getFileExtension(originalName);
        const nameWithoutExtension = originalName.slice(
            0,
            originalName.lastIndexOf(".")
        );

        if (nameWithoutExtension.length <= maxLength) {
            return originalName;
        }

        return `${nameWithoutExtension.slice(0, maxLength)}...${extension}`;
    };

    const openFile = (file: FileWithCustomName) => {
        if (!file.fileURL) {
            console.error("URL do arquivo não disponível");
            return;
        }

        // Extrair a extensão do arquivo
        const extension = file.name.split(".").pop()?.toLowerCase();

        switch (extension) {
            case "pdf":
                window.open(file.fileURL, "_blank");
                break;
            case "jpg":
            case "jpeg":
            case "png":
            case "gif":
                setViewingImage(file.fileURL);
                break;
            case "mp4":
            case "mov":
            case "avi":
                setPlayingVideo(file.fileURL);
                break;
            default:
                // Para outros tipos de arquivo, abrir em nova aba
                window.open(file.fileURL, "_blank");
        }
    };

    const renderFilePreview = (file: FileWithCustomName) => {
        if (file.type.startsWith("image/")) {
            return (
                <div className="h-10 w-10 relative rounded-lg overflow-hidden">
                    <Image
                        src={file.fileURL || URL.createObjectURL(file)}
                        alt={file.name}
                        fill
                        className="object-cover"
                    />
                </div>
            );
        } else if (file.type.startsWith("video/")) {
            return (
                <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center relative">
                    <Video className="h-5 w-5 text-gray-500" />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (file.fileURL) {
                                setPlayingVideo(file.fileURL);
                            }
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity rounded-lg"
                    >
                        <Play className="h-5 w-5 text-white" />
                    </button>
                </div>
            );
        } else {
            return (
                <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-gray-500" />
                </div>
            );
        }
    };

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4 h-[72px]">
                <h3
                    className="text-lg font-semibold text-gray-900 line-clamp-1 hover:cursor-help"
                    title={title}
                >
                    {title}
                </h3>
                <p
                    className="text-sm text-gray-500 mt-1 line-clamp-2 hover:cursor-help"
                    title={description}
                >
                    {description}
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center p-8">
                    <div className="w-8 h-8 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                            isDragging
                                ? "border-primary bg-primary/5"
                                : "border-gray-300 hover:border-primary hover:bg-gray-50"
                        } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleClick}
                    >
                        {isUploading ? (
                            <>
                                <div className="w-12 h-12 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-sm font-medium text-gray-700">
                                    ENVIANDO ARQUIVOS...
                                </p>
                            </>
                        ) : (
                            <>
                                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                                <p className="text-sm font-medium text-gray-700">
                                    ARRASTE UM ARQUIVO
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    ou clique para fazer o upload
                                </p>
                                <p className="text-xs text-gray-400 mt-4">
                                    {acceptedFileTypes
                                        .replace(/application\/|image\/|video\//g, "")
                                        .toUpperCase()}
                                    <br />
                                    Tamanho máximo: {maxSizeMB}MB
                                </p>
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 flex items-center text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {files.length > 0 && (
                        <div className="mt-6">
                            <div className="space-y-2 max-h-[130px] overflow-y-auto">
                                {files.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100"
                                    >
                                        <div className="flex items-center space-x-3">
                                            {renderFilePreview(file)}
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">
                                                    {getTruncatedFileName(file.customName)}
                                                </p>
                                                {file.size > 0 && (
                                                    <p className="text-xs text-gray-500">
                                                        {(file.size / 1024 / 1024).toFixed(2)}MB
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {/* Botão de Visualizar */}
                                            <button
                                                type="button"
                                                onClick={() => openFile(file)}
                                                className="text-blue-500 hover:text-blue-700 transition-colors"
                                                title="Visualizar"
                                            >
                                                <Eye className="h-5 w-5" />
                                            </button>

                                            {/* Botão de Download */}
                                            <a
                                                href={file.fileURL}
                                                download={file.name}
                                                className="text-green-500 hover:text-green-700 transition-colors"
                                                title="Download"
                                            >
                                                <Download className="h-5 w-5" />
                                            </a>

                                            {/* Botão de Remover */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFile(index);
                                                }}
                                                className="text-red-500 hover:text-red-700 transition-colors"
                                                title="Remover"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={acceptedFileTypes}
                onChange={(e) => handleFileChange(e.target.files)}
                multiple
            />

            {viewingImage && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl max-w-4xl w-full mx-4">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Visualização da Imagem
                            </h3>
                            <button
                                onClick={() => setViewingImage(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-4">
                            <div
                                className="relative w-full"
                                style={{ height: "calc(100vh - 200px)" }}
                            >
                                <Image
                                    src={viewingImage}
                                    alt="Visualização"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {playingVideo && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl max-w-4xl w-full mx-4">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Visualização do Vídeo
                            </h3>
                            <button
                                onClick={() => setPlayingVideo(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-4">
                            <video
                                src={playingVideo}
                                controls
                                className="w-full rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
