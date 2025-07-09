"use server";

import { db } from "@/db/drizzle";
import { s3Client } from "../../pricingSolicitation/server/integrations/s3client";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
    file,
    merchantfile,
    solicitationFeeDocument,
} from "../../../../drizzle/schema";

// Tipos para gerenciamento de arquivos
export type FileEntityType =
    | "merchant"
    | "terminal"
    | "customer"
    | "payment"
    | "solicitationFee";

export interface FileItem {
    id: number;
    fileName: string;
    fileUrl: string;
    extension: string;
    active: boolean;
}

export type UploadFileResponse = {
    fileExtension: string;
    fileURL: string;
    fileName: string;
    fileId: number;
};

export type UploadFileRequest = {
    formData?: FormData;
    file?: File;
    path: string;
    fileName: string;
    fileType: string;
    useBucketURL?: boolean;
};

interface CreateFileRelationParams {
    entityType: FileEntityType;
    entityId: number;
    fileId: number;
    extension: string;
    type?: string;
}

/**
 * Função auxiliar para formatar o nome do arquivo
 */

/**
 * Função para fazer upload de um arquivo para o S3
 */
export async function uploadFile(
    uploadFileRequest: UploadFileRequest
): Promise<UploadFileResponse | null> {
    let fileObject: File | null = null;

    if (uploadFileRequest.formData) {
        fileObject = uploadFileRequest.formData.get("File") as File;
    } else if (uploadFileRequest.file) {
        fileObject = uploadFileRequest.file;
    }

    if (!fileObject || !fileObject.name) {
        console.error("Arquivo inválido ou não encontrado");
        return null;
    }

    try {
        const fileExtension = getFileExtension(fileObject.name);
        console.log("Processando arquivo para upload:", {
            name: fileObject.name + "." + fileExtension,
            type: fileObject.type,
            size: fileObject.size,
            fileType: uploadFileRequest.fileType,
        });

        // Formatar o nome do arquivo usando o título fornecido

        // Preparar o upload para o S3
        const arrayBuffer = await fileObject.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);
        const key = `${uploadFileRequest.path}/${uploadFileRequest.fileName}.${fileExtension}`;

        console.log("Preparando upload para S3:", {
            bucket: process.env.AWS_BUCKET_NAME,
            key: key,
            formattedFileName: uploadFileRequest.fileName + "." + fileExtension,
        });

        // Enviar arquivo para o S3 primeiro
        const putObjectParams = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME || "",
            Key: key,
            Body: fileBuffer,
        });

        await s3Client.send(putObjectParams);
        const BUCKET_URL = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;
        const finalURL = `${BUCKET_URL}/${key}`;

        console.log(
            "Arquivo enviado para S3, criando registro no banco:",
            finalURL
        );

        // Depois de fazer o upload, criar o registro no banco de dados com a URL já definida
        const [newFile] = await db
            .insert(file)
            .values({
                fileName: uploadFileRequest.fileName,
                extension: fileExtension,
                fileType: uploadFileRequest.fileType,
                fileUrl: finalURL,
                active: true,
            })
            .returning({ id: file.id });

        if (!newFile || !newFile.id) {
            console.error("Falha ao inserir registro de arquivo no banco de dados");

            // já que o registro no banco falhou
            return null;
        }

        const fileId = Number(newFile.id);
        console.log("Arquivo registrado no banco de dados com ID:", fileId);

        return {
            fileExtension,
            fileURL: finalURL,
            fileName: uploadFileRequest.fileName,
            fileId,
        };
    } catch (e) {
        console.error("Erro detalhado ao fazer upload do arquivo:", e);
        return null;
    }
}

/**
 * Função para excluir um arquivo do S3 e marcar como inativo no banco de dados
 */
export async function deleteFile(fileId: number): Promise<boolean> {
    try {
        // Buscar informações do arquivo
        const fileRecord = await db
            .select()
            .from(file)
            .where(eq(file.id, fileId))
            .limit(1);

        if (!fileRecord || fileRecord.length === 0) {
            console.error("Arquivo não encontrado no banco de dados");
            return false;
        }

        // Extrair a chave do S3 a partir da URL
        const fileUrl = fileRecord[0].fileUrl;
        if (!fileUrl) {
            console.error("URL do arquivo não encontrada");
            return false;
        }

        const urlParts = fileUrl.split(
            `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`
        );
        const key = urlParts.length > 1 ? urlParts[1] : null;

        if (!key) {
            console.error("Não foi possível extrair a chave do S3 da URL");
            return false;
        }

        // Excluir o arquivo do S3
        const deleteParams = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME || "",
            Key: key,
        });

        await s3Client.send(deleteParams);

        // Marcar o arquivo como inativo no banco de dados
        await db.update(file).set({ active: false }).where(eq(file.id, fileId));

        return true;
    } catch (e) {
        console.error("Erro ao excluir arquivo:", e);
        return false;
    }
}

/**
 * Função auxiliar para obter a extensão de um arquivo
 */
function getFileExtension(filename: string): string {
    return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Cria uma relação entre uma entidade e um arquivo
 */
export async function createFileRelation(params: CreateFileRelationParams) {
    const { entityType, entityId, fileId, extension, type } = params;

    try {
        // Implementação para merchant
        if (entityType === "merchant") {
            const result = await db
                .insert(merchantfile)
                .values({
                    idMerchant: entityId,
                    idFile: fileId,
                    extension,
                    active: true,
                })
                .returning();

            revalidatePath(`/merchants/${entityId}`);
            return result[0];
        }

        // Implementação para pricing solicitation
        if (entityType === "solicitationFee") {
            const result = await db
                .insert(solicitationFeeDocument)
                .values({
                    solicitationFeeId: entityId,
                    idFile: fileId,
                    type: type,
                    slug: null,
                    dtinsert: new Date().toISOString(),
                    dtupdate: new Date().toISOString(),
                })
                .returning();

            revalidatePath(`/pricing-solicitation/${entityId}`);
            return result[0];
        }

        // Aqui você pode adicionar mais implementações para outros tipos de entidades
        // Por exemplo:
        // if (entityType === "terminal") { ... }
        // if (entityType === "customer") { ... }
        // if (entityType === "payment") { ... }

        throw new Error(`Tipo de entidade não suportado: ${entityType}`);
    } catch (error) {
        console.error(
            `Erro ao criar relação de arquivo para ${entityType}:`,
            error
        );
        throw new Error("Falha ao criar relação com arquivo");
    }
}

/**
 * Obtém os arquivos relacionados a uma entidade
 */
export async function getFilesByEntity(
    entityType: FileEntityType,
    entityId: number
): Promise<FileItem[]> {
    try {
        // Implementação para merchant
        if (entityType === "merchant") {
            const files = await db
                .select({
                    id: file.id,
                    fileName: file.fileName,
                    fileUrl: file.fileUrl,
                    extension: file.extension,
                    active: file.active,
                })
                .from(merchantfile)
                .innerJoin(file, eq(merchantfile.idFile, file.id))
                .where(
                    and(
                        eq(merchantfile.idMerchant, entityId),
                        eq(merchantfile.active, true),
                        eq(file.active, true)
                    )
                );

            // Filtrar e converter para garantir que todos os campos estão presentes e não são nulos
            return files
                .filter(
                    (f) =>
                        f.fileName !== null && f.fileUrl !== null && f.extension !== null
                )
                .map((f) => ({
                    id: f.id,
                    fileName: f.fileName as string,
                    fileUrl: f.fileUrl as string,
                    extension: f.extension as string,
                    active: f.active === true,
                }));
        }

        // Implementação para pricing solicitation
        if (entityType === "solicitationFee") {
            const files = await db
                .select({
                    id: file.id,
                    fileName: file.fileName,
                    fileUrl: file.fileUrl,
                    extension: file.extension,
                    active: file.active,
                })
                .from(solicitationFeeDocument)
                .innerJoin(file, eq(solicitationFeeDocument.idFile, file.id))
                .where(
                    and(
                        eq(solicitationFeeDocument.solicitationFeeId, entityId),
                        eq(file.active, true)
                    )
                );

            // Filtrar e converter para garantir que todos os campos estão presentes e não são nulos
            return files
                .filter(
                    (f) =>
                        f.fileName !== null && f.fileUrl !== null && f.extension !== null
                )
                .map((f) => ({
                    id: f.id,
                    fileName: f.fileName as string,
                    fileUrl: f.fileUrl as string,
                    extension: f.extension as string,
                    active: f.active === true,
                }));
        }

        // Aqui você pode adicionar mais implementações para outros tipos de entidades
        // Por exemplo:
        // if (entityType === "terminal") { ... }
        // if (entityType === "customer") { ... }
        // if (entityType === "payment") { ... }

        return [];
    } catch (error) {
        console.error(`Erro ao buscar arquivos para ${entityType}:`, error);
        return [];
    }
}

/**
 * Exclui um arquivo e sua relação com uma entidade
 */
export async function deleteFileRelation(
    entityType: FileEntityType,
    entityId: number,
    fileId?: number
) {
    try {
        let fileToDelete: { id: number; fileUrl: string | null } | undefined;

        // Implementação para merchant
        if (entityType === "merchant") {
            if (fileId) {
                // Buscar informações do arquivo antes de desativar
                const fileInfo = await db
                    .select({
                        id: file.id,
                        fileUrl: file.fileUrl,
                    })
                    .from(file)
                    .innerJoin(merchantfile, eq(merchantfile.idFile, file.id))
                    .where(
                        and(eq(merchantfile.idMerchant, entityId), eq(file.id, fileId))
                    )
                    .limit(1);

                if (fileInfo.length > 0) {
                    fileToDelete = fileInfo[0];

                    // Desativar a relação
                    await db
                        .update(merchantfile)
                        .set({ active: false })
                        .where(
                            and(
                                eq(merchantfile.idMerchant, entityId),
                                eq(merchantfile.idFile, fileId)
                            )
                        );
                }
            } else {
                // Buscar todos os arquivos relacionados
                const files = await db
                    .select({
                        id: file.id,
                        fileUrl: file.fileUrl,
                    })
                    .from(file)
                    .innerJoin(merchantfile, eq(merchantfile.idFile, file.id))
                    .where(
                        and(
                            eq(merchantfile.idMerchant, entityId),
                            eq(merchantfile.active, true)
                        )
                    );

                if (files.length > 0) {
                    fileToDelete = files[0];

                    // Desativar todas as relações
                    await db
                        .update(merchantfile)
                        .set({ active: false })
                        .where(eq(merchantfile.idMerchant, entityId));
                }
            }
        }

        // Aqui você pode adicionar mais implementações para outros tipos de entidades
        // Por exemplo:
        // if (entityType === "terminal") { ... }
        // if (entityType === "customer") { ... }
        // if (entityType === "payment") { ... }

        // Se encontrou um arquivo para excluir
        if (fileToDelete && fileToDelete.id && fileToDelete.fileUrl) {
            // Desativar o arquivo
            await db
                .update(file)
                .set({ active: false })
                .where(eq(file.id, fileToDelete.id));

            // Excluir o arquivo do S3
            await deleteFile(fileToDelete.id);
        }

        revalidatePath(`/${entityType}s/${entityId}`);
        return true;
    } catch (error) {
        console.error(`Erro ao excluir arquivo para ${entityType}:`, error);
        throw new Error("Falha ao excluir arquivo");
    }
}

/**
 * Função auxiliar para criar um arquivo e sua relação com uma entidade
 */
export async function createFileWithRelation(
    formData: FormData,
    entityType: FileEntityType,
    entityId: number,
    path: string,
    fileType: string,
    type?: string
): Promise<UploadFileResponse> {
    try {
        // Obter o arquivo do FormData
        const file = formData.get("File") as File;
        if (!file) {
            console.error("Nenhum arquivo encontrado no FormData");
            throw new Error("Arquivo não encontrado");
        }

        console.log("Iniciando upload do arquivo:", {
            fileName: file.name,
            fileType: fileType,
            fileSize: file.size,
            path: path,
            type: type,
        });

        // Obter o nome do arquivo do FormData ou usar um padrão
        const fileName =
            (formData.get("fileName") as string) ||
            `${entityType}-${entityId}-${file.name}`;

        // Configurar a requisição de upload
        const uploadRequest: UploadFileRequest = {
            formData,
            path,
            fileName,
            fileType,
        };

        console.log("Fazendo upload do arquivo com configuração:", uploadRequest);

        // Fazer o upload do arquivo
        const uploadResult = await uploadFile(uploadRequest);

        if (!uploadResult) {
            console.error("Upload retornou null");
            throw new Error("Falha ao fazer upload do arquivo");
        }

        console.log("Upload concluído, criando relação:", {
            entityType,
            entityId,
            fileId: uploadResult.fileId,
            extension: uploadResult.fileExtension,
        });

        // Criar a relação entre a entidade e o arquivo
        await createFileRelation({
            entityType,
            entityId,
            fileId: uploadResult.fileId,
            extension: uploadResult.fileExtension,
            type: type,
        });

        return uploadResult;
    } catch (error) {
        console.error(
            `Erro detalhado ao criar arquivo com relação para ${entityType}:`,
            error
        );
        throw error; // Propagar o erro original ao invés de criar um novo
    }
}

/**
 * Obtém os arquivos por tipo de arquivo e entidade
 */
export async function getFilesByFileType(
    entityType: FileEntityType,
    entityId: number,
    fileType: string
): Promise<FileItem[]> {
    try {
        if (entityType === "merchant") {
            const files = await db
                .select({
                    id: file.id,
                    fileName: file.fileName,
                    fileUrl: file.fileUrl,
                    extension: file.extension,
                    active: file.active,
                })
                .from(merchantfile)
                .innerJoin(file, eq(merchantfile.idFile, file.id))
                .where(
                    and(
                        eq(merchantfile.idMerchant, entityId),
                        eq(merchantfile.active, true),
                        eq(file.active, true),
                        eq(file.fileType, fileType)
                    )
                );

            return files
                .filter(
                    (f) =>
                        f.fileName !== null && f.fileUrl !== null && f.extension !== null
                )
                .map((f) => ({
                    id: f.id,
                    fileName: f.fileName as string,
                    fileUrl: f.fileUrl as string,
                    extension: f.extension as string,
                    active: f.active === true,
                }));
        }

        if (entityType === "solicitationFee") {
            const files = await db
                .select({
                    id: file.id,
                    fileName: file.fileName,
                    fileUrl: file.fileUrl,
                    extension: file.extension,
                    active: file.active,
                })
                .from(solicitationFeeDocument)
                .innerJoin(file, eq(solicitationFeeDocument.idFile, file.id))
                .where(
                    and(
                        eq(solicitationFeeDocument.solicitationFeeId, entityId),
                        eq(file.active, true),
                        eq(file.fileType, fileType)
                    )
                );

            return files
                .filter(
                    (f) =>
                        f.fileName !== null && f.fileUrl !== null && f.extension !== null
                )
                .map((f) => ({
                    id: f.id,
                    fileName: f.fileName as string,
                    fileUrl: f.fileUrl as string,
                    extension: f.extension as string,
                    active: f.active === true,
                }));
        }

        return [];
    } catch (error) {
        console.error(`Erro ao buscar arquivos para ${entityType}:`, error);
        return [];
    }
}
