"use client";

import FileUpload from "@/components/fileUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingSolicitationForm, insertPricingSolicitation } from "@/features/pricingSolicitation/server/pricing-solicitation";
import { getFilesByFileType } from "../../categories/server/upload";
import { useEffect, useRef, useState } from "react";

interface DocumentUploadContentProps {
  solicitationId?: number | null;
  pricingSolicitationData?: PricingSolicitationForm;
  onSolicitationCreated?: (id: number) => void; // Callback quando a solicitação é criada
}

interface UploadedDocument {
  id: number;
  fileName: string;
  fileUrl: string;
  extension: string;
}

export function DocumentUploadContent({
  solicitationId,
  pricingSolicitationData,
  onSolicitationCreated,
}: DocumentUploadContentProps) {
  const [createdSolicitationId, setCreatedSolicitationId] = useState<
    number | null
  >(solicitationId || null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const initialLoadComplete = useRef(false);

  // Document types available for upload
  const documentTypes = [
    {
      title: "Documento Principal",
      description:
        "Documento principal da solicitação (ex: contrato, proposta)",
      fileType: "SOLICITATION",
      acceptedFileTypes: "pdf,PDF,jpeg,JPEG,jpg,JPG,png,PNG,XLS,xlsx",
      maxSizeMB: 5,
    },
  ];

  // Carregar documentos existentes apenas uma vez na montagem do componente
  useEffect(() => {
    const loadExistingDocuments = async () => {
      if (initialLoadComplete.current) return;
      if (!createdSolicitationId && !solicitationId) return;

      const targetId = createdSolicitationId || solicitationId;
      if (!targetId) return;

      setIsLoading(true);
      try {
        // Carregar documentos para cada tipo de documento
        const documents = [];
        for (const docType of documentTypes) {
          const files = await getFilesByFileType(
            "solicitationFee",
            targetId,
            docType.fileType
          );
          documents.push(...files);
        }

        setUploadedDocuments(documents);
        initialLoadComplete.current = true;
      } catch (error) {
        console.error("Erro ao carregar documentos existentes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingDocuments();
  }, [createdSolicitationId, solicitationId]);

  // Atualizar o ID da solicitação quando ele muda externamente
  useEffect(() => {
    if (solicitationId && solicitationId !== createdSolicitationId) {
      setCreatedSolicitationId(solicitationId);
      // Resetar o flag para permitir novo carregamento se o ID mudar
      initialLoadComplete.current = false;
    }
  }, [solicitationId]);

  // Handle document upload completion
  const handleUploadComplete = (fileData: {
    fileId: number;
    fileURL: string;
    fileName: string;
    fileExtension: string;
  }) => {
    console.log("Upload completo:", fileData);
    // Adicionar o novo documento à lista sem recarregar todos
    setUploadedDocuments((prev) => {
      // Verificar se o documento já existe na lista
      const exists = prev.some((doc) => doc.id === fileData.fileId);
      if (exists) return prev;
      return [
        ...prev,
        {
          id: fileData.fileId,
          fileName: fileData.fileName,
          fileUrl: fileData.fileURL,
          extension: fileData.fileExtension,
        },
      ];
    });
  };

  // Hook de pré-upload para criar as entidades necessárias
  const createSolicitationIfNeeded = async (): Promise<number> => {
    setUploadError(null);

    if (createdSolicitationId) {
      return createdSolicitationId;
    }

    try {
      console.log(
        "Dados enviados para criação da solicitação:",
        pricingSolicitationData
      );

      const newSolicitationId = await insertPricingSolicitation(
        pricingSolicitationData as PricingSolicitationForm
      );

      // Armazenar o ID da solicitação criada
      setCreatedSolicitationId(newSolicitationId.id);

      // Notificar o componente pai sobre a criação da solicitação
      if (onSolicitationCreated) {
        onSolicitationCreated(newSolicitationId.id);
      }

      return newSolicitationId.id;
    } catch (error) {
      console.error("Erro ao criar solicitação:", error);
      // Definir mensagem de erro amigável
      setUploadError(
        "Não foi possível criar a solicitação. Verifique se todos os dados foram preenchidos corretamente."
      );
      throw new Error(
        "Não foi possível criar a solicitação necessária para o upload"
      );
    }
  };

  async function createPricingSolicitation() {
    const newId = await createSolicitationIfNeeded();

    if (!newId) {
      throw new Error("Falha ao criar solicitação");
    }
    console.log("newId", newId);
    return newId;
  }

  return (
    <form>
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">
              Documentos da Solicitação
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {uploadError}
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-8">
                  {documentTypes.map((doc, index) => (
                    <FileUpload
                      key={index}
                      title={doc.title}
                      description={doc.description}
                      entityType="solicitationFee"
                      entityId={createdSolicitationId || undefined}
                      fileType={doc.fileType}
                      onUploadComplete={handleUploadComplete}
                      maxSizeMB={doc.maxSizeMB}
                      acceptedFileTypes={doc.acceptedFileTypes}
                      customUploadHandler={createPricingSolicitation}
                      type={doc.fileType}
                    />
                  ))}
                </div>

                {/* Lista de documentos enviados */}
                {uploadedDocuments.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">
                      Documentos Enviados
                    </h3>
                    <ul className="space-y-2">
                      {uploadedDocuments.map((doc, index) => (
                        <li
                          key={`doc-${doc.id || index}`}
                          className="flex items-center p-2 bg-gray-50 rounded-md"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2 text-green-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{doc.fileName}</span>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-blue-600 hover:text-blue-800"
                          >
                            Ver
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
