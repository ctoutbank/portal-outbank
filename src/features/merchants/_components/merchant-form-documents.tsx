"use client";

import FileUpload from "@/components/fileUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

interface MerchantFormDocumentsProps {
  merchantId: string;
  permissions: string[];
}

export default function MerchantFormDocuments({
  merchantId,
  permissions,
}: MerchantFormDocumentsProps) {
  // Função compatível com o onUploadComplete do FileUploader
  const handleUploadComplete = (fileData: {
    fileId: number;
    fileURL: string;
    fileName: string;
    fileExtension: string;
  }) => {
    console.log("Upload completo:", fileData);
    // Aqui você pode adicionar qualquer lógica adicional necessária após o upload
  };

  // Section component to improve visual hierarchy
  const DocumentSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="lg:col-span-3 pb-12 border-b border-gray-200">
      <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
        <div className="w-0.5 h-5 bg-primary/40 rounded-full mr-3"></div>
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Documentos</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {(permissions?.includes("Atualizar") ||
            permissions?.includes("Inserir")) &&
            permissions?.includes("Inserir documentos EC") && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Documentos de Identificação */}
                <DocumentSection title="Documentos de Identificação">
                  <FileUpload
                    title="CNH DIGITAL"
                    description="Documento de Identificação - O documento de identificação é obrigatório para o KYC de Adquirência e PIX. É obrigatória a inserção do documento de identificação de todos os sócios da empresa."
                    entityType="merchant"
                    entityId={Number(merchantId)}
                    onUploadComplete={handleUploadComplete}
                    fileType="CNHDIGITAL"
                    maxSizeMB={2}
                    acceptedFileTypes="pdf,jpeg,jpg,png,gif,bmp,tiff,ico,webp,svg,heic,heif,PNG"
                  />

                  <FileUpload
                    title="CNH FRENTE"
                    description="Documento de Identificação - O documento de identificação é obrigatório para o KYC de Adquirência e PIX. É obrigatória a inserção do documento de identificação de todos os sócios da empresa."
                    entityType="merchant"
                    entityId={Number(merchantId)}
                    onUploadComplete={handleUploadComplete}
                    fileType="CNHFRENTE"
                    maxSizeMB={10}
                    acceptedFileTypes="pdf,jpeg,jpg,png,gif,bmp,tiff,ico,webp,svg,heic,heif"
                  />

                  <FileUpload
                    title="CNH VERSO"
                    description="Documento de Identificação - O documento de identificação é obrigatório para o KYC de Adquirência e PIX. É obrigatória a inserção do documento de identificação de todos os sócios da empresa."
                    entityType="merchant"
                    entityId={Number(merchantId)}
                    onUploadComplete={handleUploadComplete}
                    fileType="CNHVERSO"
                    maxSizeMB={5}
                    acceptedFileTypes="JPG,PNG"
                  />
                </DocumentSection>

                {/* Documentos Pessoais */}
                <DocumentSection title="Documentos Pessoais">
                  <FileUpload
                    title="SELFIE"
                    description="Obrigatório para todos os cadastros. Para empresas com mais de um sócio a SELFIE é obrigatória apenas para o sócio majoritário."
                    entityType="merchant"
                    entityId={Number(merchantId)}
                    onUploadComplete={handleUploadComplete}
                    fileType="SELFIE"
                    maxSizeMB={5}
                    acceptedFileTypes="image/jpeg,image/jpg"
                  />

                  <FileUpload
                    title="CARTA DE EMANCIPAÇÃO"
                    description="Para cadastros cujo responsável legal tenha no mínimo 16 e no máximo 17 anos."
                    entityType="merchant"
                    entityId={Number(merchantId)}
                    onUploadComplete={handleUploadComplete}
                    fileType="CARTAEMANCIPACAO"
                  />

                  <FileUpload
                    title="PROCURAÇÃO"
                    description="Para quando o responsável legal não for sócio majoritário."
                    entityType="merchant"
                    entityId={Number(merchantId)}
                    onUploadComplete={handleUploadComplete}
                    fileType="PROCURACAO"
                  />
                </DocumentSection>

                {/* Documentos da Empresa */}
                <DocumentSection title="Documentos da Empresa">
                  <FileUpload
                    title="CARTÃO CNPJ DA RECEITA"
                    description="Retirado pela pessoa que está realizando o cadastro no momento da execução da tarefa."
                    entityType="merchant"
                    entityId={Number(merchantId)}
                    onUploadComplete={handleUploadComplete}
                    fileType="CARTAOCNPJ"
                  />

                  <FileUpload
                    title="ESTATUTOS DA EMPRESA"
                    description="Constando nome do responsável legal, quadro societário e atividades exercidas. Contrato Social, Estatuto, etc. Obrigatório para empresas S/A e LTDA."
                    entityType="merchant"
                    entityId={Number(merchantId)}
                    onUploadComplete={handleUploadComplete}
                    fileType="ESTATUTO"
                    maxSizeMB={10}
                    acceptedFileTypes="pdf,png"
                  />

                  <FileUpload
                    title="TERMO DE ADESÃO"
                    description="Este documento não é obrigatório! Todo o processo de assinatura de termo de adesão é feito pelo Estabelecimento no primeiro login no Portal. Utilize esse espaço caso tenha algum termo em fluxo específico."
                    entityType="merchant"
                    entityId={Number(merchantId)}
                    onUploadComplete={handleUploadComplete}
                    fileType="TERMOADESAO"
                  />
                </DocumentSection>

                {/* Documentos de Validação */}
                <DocumentSection title="Documentos de Validação">
                  <FileUpload
                    title="PESQUISA BIGBOOST"
                    description="PDF com a pesquisa de KYC feita no BigBoost no momento do onboarding."
                    entityType="merchant"
                    entityId={Number(merchantId)}
                    onUploadComplete={handleUploadComplete}
                    fileType="BIGBOOST"
                    maxSizeMB={2}
                    acceptedFileTypes="PNG"
                  />

                  <FileUpload
                    title="MATCH - MASTERCARD"
                    description="Validação de Match da MasterCard para onboarding de Estabelecimentos Comerciais"
                    entityType="merchant"
                    entityId={Number(merchantId)}
                    onUploadComplete={handleUploadComplete}
                    fileType="MATCHMASTERCARD"
                  />

                  <FileUpload
                    title="PRINT CNP"
                    description="Print de alguma rede social do PJ. Obrigatório para CNP"
                    entityType="merchant"
                    entityId={Number(merchantId)}
                    onUploadComplete={handleUploadComplete}
                    fileType="PRINTCNP"
                    maxSizeMB={5}
                    acceptedFileTypes="image/jpeg,image/jpg,JPG"
                  />
                </DocumentSection>

                {/* Outros Documentos */}
                <div className="lg:col-span-3 pt-0">
                  <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
                    <div className="w-0.5 h-5 bg-primary/40 rounded-full mr-3"></div>
                    Outros
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FileUpload
                      title="OUTROS DOCUMENTOS"
                      description="Preenchimento não obrigatório. Utilize essa seção para inserir documentos pertinentes à sua operação."
                      entityType="merchant"
                      entityId={Number(merchantId)}
                      onUploadComplete={handleUploadComplete}
                      fileType="OUTROS"
                    />
                  </div>
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

