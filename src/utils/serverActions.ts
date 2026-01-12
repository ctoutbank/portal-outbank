"use server";

import { customerCustomization, db, file } from "@/lib/db";
import { s3Client } from "@/lib/s3-client/s3Client";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

export type CustomerCustomization = {
  id: number | null;
  name: string | null;
  slug: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  loginButtonColor: string | null;
  loginButtonTextColor: string | null;
  loginTitleColor: string | null;
  loginTextColor: string | null;
  imageUrl: string | null;
  loginImageUrl: string | null;
  faviconUrl: string | null;
  emailImageUrl: string | null;
  customerId: number | null;
};

// ✅ Função helper: deletar imagem antiga do S3
async function deleteOldImageFromS3(oldUrl: string | null | undefined) {
  if (!oldUrl) return;
  
  let key = '';
  try {
    const url = new URL(oldUrl);
    key = url.pathname.substring(1); // Remove leading '/'
    
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
    });
    
    await s3Client.send(command);
    console.log(`✅ Imagem antiga deletada: ${key}`);
  } catch (error: any) {
    // Tratamento específico para erro de permissão
    if (error?.name === 'AccessDenied' || error?.Code === 'AccessDenied') {
      console.warn(`⚠️ Permissão negada para deletar imagem do S3 (não crítico - continuando): ${key || oldUrl}`);
    } else {
      console.error('⚠️ Erro ao deletar imagem antiga do S3 (não crítico - continuando):', error?.message || error);
    }
  }
}

// ✅ Função helper: upload com URL única (timestamp + nanoid)
// Função auxiliar para chamar revalidate com retry e timeout
async function callRevalidateWithRetry(slug: string, context: string, retries = 3): Promise<boolean> {
  const revalidateUrl = process.env.NEXT_PUBLIC_OUTBANK_ONE_URL || 'https://outbank-one.vercel.app';
  const timeout = 5000; // 5 segundos
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[${context}] 🔄 Attempt ${attempt}/${retries} to invalidate cache for slug: ${slug}`);
      const startTime = Date.now();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${revalidateUrl}/api/revalidate/theme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REVALIDATE_TOKEN}`,
        },
        body: JSON.stringify({ slug }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (response.ok) {
        const responseData = await response.json();
        console.log(`[${context}] ✅ Cache invalidated successfully in ${duration}ms (attempt ${attempt}):`, responseData);
        return true;
      } else if (response.status === 405 || response.status === 404) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[${context}] ℹ️ Revalidate API endpoint não disponível (${response.status}) - usando cache local`);
        }
        return false; // Não é crítico, não precisa retry
      } else {
        const errorText = await response.text();
        console.error(`[${context}] ❌ Failed to invalidate cache (attempt ${attempt}): ${response.status} ${response.statusText}`, errorText);
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt)); // Backoff exponencial
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error(`[${context}] ⏱️ Timeout after ${timeout}ms (attempt ${attempt}/${retries})`);
      } else {
        console.error(`[${context}] ❌ Error calling revalidate API (attempt ${attempt}/${retries}):`, error);
      }
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt)); // Backoff exponencial
      }
    }
  }
  return false;
}

async function uploadImageToS3(file: File, prefix: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
  
  // ✅ CRÍTICO: timestamp + nanoid = 100% único
  const timestamp = Date.now();
  const uniqueId = nanoid(10);
  const key = `${prefix}-${timestamp}-${uniqueId}.${extension}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: file.type,
    // ✅ Sem cache - atualização instantânea
    CacheControl: 'no-cache, no-store, must-revalidate',
  });
  
  await s3Client.send(command);
  
  const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  return url;
}

// Função para converter HEX → HSL (robusta, retorna null se inválido)
function hexToHsl(hex: string): string | null {
  try {
    if (!hex || typeof hex !== 'string') {
      return null;
    }
    
    hex = hex.replace(/^#/, "").trim();
    
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      console.warn(`[hexToHsl] Invalid hex color format: ${hex}`);
      return null;
    }

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
   
    let h = 0,
      s = 0;

    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(
      l * 100
    )}%`;
  } catch (error) {
    console.error(`[hexToHsl] Error converting hex to HSL:`, error);
    return null;
  }
}

const customizationSchema = z.object({
  subdomain: z.string().min(1),
  primaryColor: z.string().min(1),
  secondaryColor: z.string().optional(),
  loginButtonColor: z.string().optional(),
  loginButtonTextColor: z.string().optional(),
  loginTitleColor: z.string().optional(),
  loginTextColor: z.string().optional(),
  customerId: z.coerce.number(),
});

export async function getCustomizationByCustomerId(
  customerId: number
): Promise<CustomerCustomization | null> {
  try {
    const result = await db
      .select({
        id: customerCustomization.id,
        name: customerCustomization.name,
        slug: customerCustomization.slug,
        primaryColor: customerCustomization.primaryColor,
        secondaryColor: customerCustomization.secondaryColor,
        loginButtonColor: customerCustomization.loginButtonColor,
        loginButtonTextColor: customerCustomization.loginButtonTextColor,
        loginTitleColor: customerCustomization.loginTitleColor,
        loginTextColor: customerCustomization.loginTextColor,
        imageUrl: file.fileUrl,
        imageUrlDirect: customerCustomization.imageUrl,
        loginImageUrl: customerCustomization.loginImageUrl,
        faviconUrl: customerCustomization.faviconUrl,
        emailImageUrl: customerCustomization.emailImageUrl,
        customerId: customerCustomization.customerId,
      })
      .from(customerCustomization)
      .leftJoin(file, eq(customerCustomization.fileId, file.id))
      .where(eq(customerCustomization.customerId, customerId))
      .limit(1);

    const row = result[0];
    if (!row) return null;

    return {
      ...row,
      imageUrl: row.imageUrl || row.imageUrlDirect || null,
    };
  } catch (error) {
    console.error("Erro ao buscar customização por customerId:", error);
    return null;
  }
}

export async function getCustomizationBySubdomain(
  subdomain: string
): Promise<CustomerCustomization | null> {
  try {
    const result = await db
      .select({
        id: customerCustomization.id,
        name: customerCustomization.name,
        slug: customerCustomization.slug,
        primaryColor: customerCustomization.primaryColor,
        secondaryColor: customerCustomization.secondaryColor,
        loginButtonColor: customerCustomization.loginButtonColor,
        loginButtonTextColor: customerCustomization.loginButtonTextColor,
        loginTitleColor: customerCustomization.loginTitleColor,
        loginTextColor: customerCustomization.loginTextColor,
        imageUrl: file.fileUrl,
        imageUrlDirect: customerCustomization.imageUrl,
        loginImageUrl: customerCustomization.loginImageUrl,
        faviconUrl: customerCustomization.faviconUrl,
        emailImageUrl: customerCustomization.emailImageUrl,
        customerId: customerCustomization.customerId,
      })
      .from(customerCustomization)
      .leftJoin(file, eq(customerCustomization.fileId, file.id))
      .where(eq(customerCustomization.slug, subdomain))
      .limit(1);

    if (result.length === 0) {
      console.log(`[getCustomizationBySubdomain] No record found for slug="${subdomain}"`);
      return null;
    }

    const row = result[0];
    return {
      ...row,
      imageUrl: row.imageUrl || row.imageUrlDirect || null,
    };
  } catch (error) {
    console.error("Erro ao buscar customização por subdomínio:", error);
    return null;
  }
}

export async function saveCustomization(formData: FormData) {
  console.log("[saveCustomization] START - FormData keys:", Array.from(formData.keys()));
  
  const rawData = {
    subdomain: formData.get("subdomain"),
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    loginButtonColor: formData.get("loginButtonColor"),
    loginButtonTextColor: formData.get("loginButtonTextColor"),
    loginTitleColor: formData.get("loginTitleColor"),
    loginTextColor: formData.get("loginTextColor"),
    customerId: formData.get("customerId"),
  };

  console.log("[saveCustomization] Raw data:", {
    subdomain: typeof rawData.subdomain,
    primaryColor: typeof rawData.primaryColor,
    secondaryColor: typeof rawData.secondaryColor,
    customerId: typeof rawData.customerId,
  });

  const validated = customizationSchema.safeParse(rawData);
  if (!validated.success) {
    console.error("[saveCustomization] Erro de validação:", validated.error.flatten());
    const errors = validated.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([field, msgs]) => `${field}: ${msgs?.join(", ")}`)
      .join("; ");
    throw new Error(`Dados inválidos: ${errorMessages}`);
  }

  const { subdomain, primaryColor, secondaryColor, loginButtonColor, loginButtonTextColor, loginTitleColor, loginTextColor, customerId } =
    validated.data;

  console.log("[saveCustomization] Validated data:", {
    subdomain,
    primaryColor: primaryColor ? 'present' : 'empty',
    secondaryColor: secondaryColor ? 'present' : 'empty',
    customerId,
  });

  if (!subdomain || subdomain.trim() === "") {
    console.error(`[saveCustomization] Subdomain is required but was empty`);
    throw new Error("Subdomain é obrigatório");
  }

  const normalizedSubdomain = subdomain.toLowerCase().trim();
  console.log(`[saveCustomization] Using subdomain: "${normalizedSubdomain}" for customerId=${customerId}`);

  // ✅ Verificar se o subdomínio já existe para outro customer
  const existingSubdomain = await db
    .select({ id: customerCustomization.id, customerId: customerCustomization.customerId })
    .from(customerCustomization)
    .where(eq(customerCustomization.slug, normalizedSubdomain))
    .limit(1);

  if (existingSubdomain.length > 0 && existingSubdomain[0].customerId !== customerId) {
    console.error(`[saveCustomization] Subdomínio "${normalizedSubdomain}" já está em uso por outro ISO`);
    throw new Error(`O subdomínio "${normalizedSubdomain}" já está em uso por outro ISO. Por favor, escolha outro nome.`);
  }

  let imageUrl = "";
  let fileId: number | null = null;
  let loginImageUrl = "";
  let loginImageFileId: number | null = null;
  let faviconUrl = "";
  let faviconFileId: number | null = null;
  let emailImageUrl = "";
  let emailImageFileId: number | null = null;

  const image = formData.get("image") as File | null;
  console.log("[saveCustomization] Image file:", image ? `present (${image.size} bytes, ${image.type})` : 'not provided');
  if (image) {
    // ✅ Upload com URL única (timestamp + nanoid)
    try {
      imageUrl = await uploadImageToS3(image, 'logo');
      console.log("Logo uploaded successfully:", imageUrl);
    } catch (error: any) {
      console.error("S3 Upload Error (logo):", {
        name: error.name,
        message: error.message,
        statusCode: error.$metadata?.httpStatusCode,
      });
      throw new Error(`Falha no upload do logo: ${error.message}`);
    }

    const extension = image.name.split(".").pop() || "jpg";
    const fileType = image.type || "image/jpeg";

    const result = await db
      .insert(file)
      .values({
        fileUrl: imageUrl,
        fileName: image.name,
        extension: extension,
        fileType: fileType,
        active: true,
      })
      .returning({ id: file.id });

    fileId = result[0].id;
  }

  const loginImage = formData.get("loginImage") as File | null;
  console.log("[saveCustomization] Login image file:", loginImage ? `present (${loginImage.size} bytes, ${loginImage.type})` : 'not provided');
  if (loginImage) {
    // ✅ Upload com URL única (timestamp + nanoid)
    try {
      loginImageUrl = await uploadImageToS3(loginImage, 'login');
      console.log("Login image uploaded successfully:", loginImageUrl);
    } catch (error: any) {
      console.error("S3 Upload Error (login image):", {
        name: error.name,
        message: error.message,
        statusCode: error.$metadata?.httpStatusCode,
      });
      throw new Error(`Falha no upload da imagem de login: ${error.message}`);
    }

    const extension = loginImage.name.split(".").pop() || "jpg";
    const fileType = loginImage.type || "image/jpeg";

    const result = await db
      .insert(file)
      .values({
        fileUrl: loginImageUrl,
        fileName: loginImage.name,
        extension: extension,
        fileType: fileType,
        active: true,
      })
      .returning({ id: file.id });

    loginImageFileId = result[0].id;
  }

  const favicon = formData.get("favicon") as File | null;
  console.log("[saveCustomization] Favicon file:", favicon ? `present (${favicon.size} bytes, ${favicon.type})` : 'not provided');
  if (favicon) {
    // ✅ Upload com URL única (timestamp + nanoid)
    try {
      faviconUrl = await uploadImageToS3(favicon, 'favicon');
      console.log("Favicon uploaded successfully:", faviconUrl);
    } catch (error: any) {
      console.error("S3 Upload Error (favicon):", {
        name: error.name,
        message: error.message,
        statusCode: error.$metadata?.httpStatusCode,
      });
      throw new Error(`Falha no upload do favicon: ${error.message}`);
    }

    const extension = favicon.name.split(".").pop() || "ico";
    const fileType = favicon.type || "image/x-icon";

    const result = await db
      .insert(file)
      .values({
        fileUrl: faviconUrl,
        fileName: favicon.name,
        extension: extension,
        fileType: fileType,
        active: true,
      })
      .returning({ id: file.id });

    faviconFileId = result[0].id;
  }

  const emailImage = formData.get("emailImage") as File | null;
  console.log("[saveCustomization] Email image file:", emailImage ? `present (${emailImage.size} bytes, ${emailImage.type})` : 'not provided');
  if (emailImage) {
    // ✅ Upload com URL única (timestamp + nanoid)
    try {
      emailImageUrl = await uploadImageToS3(emailImage, 'email');
      console.log("Email image uploaded successfully:", emailImageUrl);
    } catch (error: any) {
      console.error("S3 Upload Error (email image):", {
        name: error.name,
        message: error.message,
        statusCode: error.$metadata?.httpStatusCode,
      });
      throw new Error(`Falha no upload da logo de email: ${error.message}`);
    }

    const extension = emailImage.name.split(".").pop() || "jpg";
    const fileType = emailImage.type || "image/jpeg";

    const result = await db
      .insert(file)
      .values({
        fileUrl: emailImageUrl,
        fileName: emailImage.name,
        extension: extension,
        fileType: fileType,
        active: true,
      })
      .returning({ id: file.id });

    emailImageFileId = result[0].id;
  }

  const primaryHSL = hexToHsl(primaryColor);
  const secondaryHSL = secondaryColor ? hexToHsl(secondaryColor) : null;
  const loginButtonColorHSL = loginButtonColor ? hexToHsl(loginButtonColor) : null;
  const loginButtonTextColorHSL = loginButtonTextColor ? hexToHsl(loginButtonTextColor) : null;
  const loginTitleColorHSL = loginTitleColor ? hexToHsl(loginTitleColor) : null;
  const loginTextColorHSL = loginTextColor ? hexToHsl(loginTextColor) : null;

  console.log("[saveCustomization] Color conversion:", {
    primaryHSL: primaryHSL ? 'converted' : 'failed',
    secondaryHSL: secondaryHSL ? 'converted' : 'not provided or failed',
  });

  const existingCustomization = await db
    .select({ id: customerCustomization.id })
    .from(customerCustomization)
    .where(eq(customerCustomization.customerId, customerId))
    .limit(1);

  console.log("[saveCustomization] Existing customization check:", existingCustomization.length > 0 ? 'found (will update)' : 'not found (will create)');

  if (existingCustomization.length > 0) {
    console.log(`[saveCustomization] Updating existing customization for customerId=${customerId}`);
    await db
      .update(customerCustomization)
      .set({
        name: normalizedSubdomain,
        slug: normalizedSubdomain,
        primaryColor: primaryHSL,
        ...(secondaryHSL && { secondaryColor: secondaryHSL }),
        ...(loginButtonColorHSL && { loginButtonColor: loginButtonColorHSL }),
        ...(loginButtonTextColorHSL && { loginButtonTextColor: loginButtonTextColorHSL }),
        ...(loginTitleColorHSL && { loginTitleColor: loginTitleColorHSL }),
        ...(loginTextColorHSL && { loginTextColor: loginTextColorHSL }),
        ...(fileId && { fileId: fileId }),
        ...(imageUrl && { imageUrl: imageUrl }),
        ...(loginImageUrl && { loginImageUrl: loginImageUrl }),
        ...(loginImageFileId && { loginImageFileId: loginImageFileId }),
        ...(faviconUrl && { faviconUrl: faviconUrl }),
        ...(faviconFileId && { faviconFileId: faviconFileId }),
        ...(emailImageUrl && { emailImageUrl: emailImageUrl }),
        ...(emailImageFileId && { emailImageFileId: emailImageFileId }),
      })
      .where(eq(customerCustomization.id, existingCustomization[0].id));
  } else {
    console.log(`[saveCustomization] Creating new customization for customerId=${customerId}`);
    await db.insert(customerCustomization).values({
      name: normalizedSubdomain,
      slug: normalizedSubdomain,
      primaryColor: primaryHSL,
      secondaryColor: secondaryHSL,
      loginButtonColor: loginButtonColorHSL,
      loginButtonTextColor: loginButtonTextColorHSL,
      loginTitleColor: loginTitleColorHSL,
      loginTextColor: loginTextColorHSL,
      customerId: customerId,
      fileId: fileId,
      imageUrl: imageUrl || null,
      loginImageUrl: loginImageUrl || null,
      loginImageFileId: loginImageFileId,
      faviconUrl: faviconUrl || null,
      faviconFileId: faviconFileId,
      emailImageUrl: emailImageUrl || null,
      emailImageFileId: emailImageFileId,
    });
  }

  const savedCustomization = await getCustomizationByCustomerId(customerId);
  console.log(`[saveCustomization] Final URLs saved:`, {
    imageUrl: savedCustomization?.imageUrl,
    loginImageUrl: savedCustomization?.loginImageUrl,
    faviconUrl: savedCustomization?.faviconUrl,
    emailImageUrl: savedCustomization?.emailImageUrl,
  });

  if (normalizedSubdomain) {
    console.log(`[saveCustomization] ⏰ Calling revalidate API for slug: ${normalizedSubdomain}`);
    // Aguardar invalidação (não bloqueia se falhar, mas tenta)
    await callRevalidateWithRetry(normalizedSubdomain, 'saveCustomization', 3);
  }

  revalidatePath("/");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  // Invalida cache da API de customização
  revalidatePath(`/api/public/customization/${normalizedSubdomain}`);
  revalidateTag(`customization-${normalizedSubdomain}`);

  return {
    success: true,
    customization: savedCustomization,
  };
}

export async function updateCustomization(formData: FormData) {
  console.log("[updateCustomization] FormData keys:", Array.from(formData.keys()));
  
  const rawData = {
    id: formData.get("id"),
    subdomain: formData.get("subdomain"),
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    loginButtonColor: formData.get("loginButtonColor"),
    loginButtonTextColor: formData.get("loginButtonTextColor"),
    loginTitleColor: formData.get("loginTitleColor"),
    loginTextColor: formData.get("loginTextColor"),
    customerId: formData.get("customerId"),
  };

  const schemaWithId = customizationSchema.extend({
    id: z.coerce.number(),
  });

  const validated = schemaWithId.safeParse(rawData);
  if (!validated.success) {
    console.error("[updateCustomization] Erro de validação:", validated.error.flatten());
    const errors = validated.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([field, msgs]) => `${field}: ${msgs?.join(", ")}`)
      .join("; ");
    throw new Error(`Dados inválidos: ${errorMessages}`);
  }

  const { id, subdomain, primaryColor, secondaryColor, loginButtonColor, loginButtonTextColor, loginTitleColor, loginTextColor } = validated.data;

  if (!subdomain || subdomain.trim() === "") {
    console.error(`[updateCustomization] Subdomain is required but was empty`);
    throw new Error("Subdomain é obrigatório");
  }

  const normalizedSubdomain = subdomain.toLowerCase().trim();
  console.log(`[updateCustomization] Using subdomain: "${normalizedSubdomain}" for customerId=${validated.data.customerId}`);

  // ✅ Verificar se o subdomínio já existe para outro customer (exceto o atual)
  const existingSubdomain = await db
    .select({ id: customerCustomization.id, customerId: customerCustomization.customerId })
    .from(customerCustomization)
    .where(eq(customerCustomization.slug, normalizedSubdomain))
    .limit(1);

  if (existingSubdomain.length > 0 && existingSubdomain[0].customerId !== validated.data.customerId) {
    console.error(`[updateCustomization] Subdomínio "${normalizedSubdomain}" já está em uso por outro ISO`);
    throw new Error(`O subdomínio "${normalizedSubdomain}" já está em uso por outro ISO. Por favor, escolha outro nome.`);
  }

  let imageUrl = "";
  let fileId: number | null = null;
  let loginImageUrl = "";
  let loginImageFileId: number | null = null;
  let faviconUrl = "";
  let faviconFileId: number | null = null;
  let emailImageUrl = "";
  let emailImageFileId: number | null = null;

  // Buscar customização existente para deletar imagens antigas
  const existingCustomization = await getCustomizationByCustomerId(
    validated.data.customerId
  );

  const image = formData.get("image") as File | null;
  if (image && image.size > 0) {
    // ✅ Deletar imagem antiga antes de fazer upload da nova
    if (existingCustomization?.imageUrl) {
      await deleteOldImageFromS3(existingCustomization.imageUrl);
    }

    // ✅ Upload nova (URL única com timestamp)
    try {
      imageUrl = await uploadImageToS3(image, 'logo');
      console.log("Logo updated successfully:", imageUrl);
    } catch (error: any) {
      console.error("S3 Upload Error (logo update):", {
        name: error.name,
        message: error.message,
        statusCode: error.$metadata?.httpStatusCode,
      });
      throw new Error(`Falha na atualização do logo: ${error.message}`);
    }

    const extension = image.name.split(".").pop() || "jpg";
    const fileType = image.type || "image/jpeg";

    const result = await db
      .insert(file)
      .values({
        fileUrl: imageUrl,
        fileName: image.name,
        extension: extension,
        fileType: fileType,
        active: true,
      })
      .returning({ id: file.id });

    fileId = result[0].id;
  } else {
    // Se não há nova imagem, manter a imagem existente
    if (existingCustomization?.imageUrl) {
      imageUrl = existingCustomization.imageUrl;
      // Buscar o fileId existente
      const existingFile = await db
        .select({ id: file.id })
        .from(file)
        .where(eq(file.fileUrl, existingCustomization.imageUrl))
        .limit(1);
      fileId = existingFile[0]?.id || null;
    }
  }

  const loginImage = formData.get("loginImage") as File | null;
  if (loginImage && loginImage.size > 0) {
    // ✅ Deletar imagem antiga antes de fazer upload da nova
    if (existingCustomization?.loginImageUrl) {
      await deleteOldImageFromS3(existingCustomization.loginImageUrl);
    }

    // ✅ Upload nova (URL única com timestamp)
    try {
      loginImageUrl = await uploadImageToS3(loginImage, 'login');
      console.log("Login image updated successfully:", loginImageUrl);
    } catch (error: any) {
      console.error("S3 Upload Error (login image update):", {
        name: error.name,
        message: error.message,
        statusCode: error.$metadata?.httpStatusCode,
      });
      throw new Error(`Falha na atualização da imagem de login: ${error.message}`);
    }

    const extension = loginImage.name.split(".").pop() || "jpg";
    const fileType = loginImage.type || "image/jpeg";

    const result = await db
      .insert(file)
      .values({
        fileUrl: loginImageUrl,
        fileName: loginImage.name,
        extension: extension,
        fileType: fileType,
        active: true,
      })
      .returning({ id: file.id });

    loginImageFileId = result[0].id;
  } else {
    // Manter login image existente
    if (existingCustomization?.loginImageUrl) {
      loginImageUrl = existingCustomization.loginImageUrl;
      const existingFile = await db
        .select({ id: file.id })
        .from(file)
        .where(eq(file.fileUrl, existingCustomization.loginImageUrl))
        .limit(1);
      loginImageFileId = existingFile[0]?.id || null;
    }
  }

  const favicon = formData.get("favicon") as File | null;
  if (favicon && favicon.size > 0) {
    // ✅ Deletar imagem antiga antes de fazer upload da nova
    if (existingCustomization?.faviconUrl) {
      await deleteOldImageFromS3(existingCustomization.faviconUrl);
    }

    // ✅ Upload nova (URL única com timestamp)
    try {
      faviconUrl = await uploadImageToS3(favicon, 'favicon');
      console.log("Favicon updated successfully:", faviconUrl);
    } catch (error: any) {
      console.error("S3 Upload Error (favicon update):", {
        name: error.name,
        message: error.message,
        statusCode: error.$metadata?.httpStatusCode,
      });
      throw new Error(`Falha na atualização do favicon: ${error.message}`);
    }

    const extension = favicon.name.split(".").pop() || "ico";
    const fileType = favicon.type || "image/x-icon";

    const result = await db
      .insert(file)
      .values({
        fileUrl: faviconUrl,
        fileName: favicon.name,
        extension: extension,
        fileType: fileType,
        active: true,
      })
      .returning({ id: file.id });

    faviconFileId = result[0].id;
  } else {
    // Manter favicon existente
    if (existingCustomization?.faviconUrl) {
      faviconUrl = existingCustomization.faviconUrl;
      const existingFile = await db
        .select({ id: file.id })
        .from(file)
        .where(eq(file.fileUrl, existingCustomization.faviconUrl))
        .limit(1);
      faviconFileId = existingFile[0]?.id || null;
    }
  }

  const emailImage = formData.get("emailImage") as File | null;
  if (emailImage && emailImage.size > 0) {
    // ✅ Deletar imagem antiga antes de fazer upload da nova
    if (existingCustomization?.emailImageUrl) {
      await deleteOldImageFromS3(existingCustomization.emailImageUrl);
    }

    // ✅ Upload nova (URL única com timestamp)
    try {
      emailImageUrl = await uploadImageToS3(emailImage, 'email');
      console.log("Email image updated successfully:", emailImageUrl);
    } catch (error: any) {
      console.error("S3 Upload Error (email image update):", {
        name: error.name,
        message: error.message,
        statusCode: error.$metadata?.httpStatusCode,
      });
      throw new Error(`Falha na atualização da logo de email: ${error.message}`);
    }

    const extension = emailImage.name.split(".").pop() || "jpg";
    const fileType = emailImage.type || "image/jpeg";

    const result = await db
      .insert(file)
      .values({
        fileUrl: emailImageUrl,
        fileName: emailImage.name,
        extension: extension,
        fileType: fileType,
        active: true,
      })
      .returning({ id: file.id });

    emailImageFileId = result[0].id;
  } else {
    // Manter email image existente
    if (existingCustomization?.emailImageUrl) {
      emailImageUrl = existingCustomization.emailImageUrl;
      const existingFile = await db
        .select({ id: file.id })
        .from(file)
        .where(eq(file.fileUrl, existingCustomization.emailImageUrl))
        .limit(1);
      emailImageFileId = existingFile[0]?.id || null;
    }
  }

  const primaryHSL = hexToHsl(primaryColor);
  const secondaryHSL = secondaryColor ? hexToHsl(secondaryColor) : null;
  const loginButtonColorHSL = loginButtonColor ? hexToHsl(loginButtonColor) : null;
  const loginButtonTextColorHSL = loginButtonTextColor ? hexToHsl(loginButtonTextColor) : null;
  const loginTitleColorHSL = loginTitleColor ? hexToHsl(loginTitleColor) : null;
  const loginTextColorHSL = loginTextColor ? hexToHsl(loginTextColor) : null;

  console.log(`[updateCustomization] Updating customization id=${id} for customerId=${validated.data.customerId}`);
  console.log(`[updateCustomization] Color conversion:`, {
    primaryColorHex: primaryColor,
    primaryHSL: primaryHSL || '(conversion failed)',
    secondaryColorHex: secondaryColor || '(not provided)',
    secondaryHSL: secondaryHSL || '(not provided or conversion failed)',
  });
  console.log(`[updateCustomization] New URLs:`, {
    imageUrl: imageUrl || '(unchanged)',
    loginImageUrl: loginImageUrl || '(unchanged)',
    faviconUrl: faviconUrl || '(unchanged)',
    emailImageUrl: emailImageUrl || '(unchanged)',
  });

  // Validar que a conversão da cor primária foi bem-sucedida
  if (!primaryHSL) {
    throw new Error(`Falha na conversão da cor primária: ${primaryColor}`);
  }

  await db
    .update(customerCustomization)
    .set({
      name: normalizedSubdomain,
      slug: normalizedSubdomain,
      primaryColor: primaryHSL,
      ...(secondaryHSL && { secondaryColor: secondaryHSL }),
      ...(loginButtonColorHSL && { loginButtonColor: loginButtonColorHSL }),
      ...(loginButtonTextColorHSL && { loginButtonTextColor: loginButtonTextColorHSL }),
      ...(loginTitleColorHSL && { loginTitleColor: loginTitleColorHSL }),
      ...(loginTextColorHSL && { loginTextColor: loginTextColorHSL }),
      ...(imageUrl && { imageUrl: imageUrl }),
      fileId: fileId,
      ...(loginImageUrl && { loginImageUrl: loginImageUrl }),
      loginImageFileId: loginImageFileId,
      ...(faviconUrl && { faviconUrl: faviconUrl }),
      faviconFileId: faviconFileId,
      ...(emailImageUrl && { emailImageUrl: emailImageUrl }),
      emailImageFileId: emailImageFileId,
    })
    .where(eq(customerCustomization.id, id));

  const updatedCustomization = await getCustomizationByCustomerId(validated.data.customerId);
  console.log(`[updateCustomization] Final URLs after update:`, {
    imageUrl: updatedCustomization?.imageUrl,
    loginImageUrl: updatedCustomization?.loginImageUrl,
    faviconUrl: updatedCustomization?.faviconUrl,
    emailImageUrl: updatedCustomization?.emailImageUrl,
  });
  console.log(`[updateCustomization] Final colors after update:`, {
    primaryColor: updatedCustomization?.primaryColor,
    secondaryColor: updatedCustomization?.secondaryColor || '(not set)',
  });

  if (normalizedSubdomain) {
    console.log(`[updateCustomization] ⏰ Calling revalidate API for slug: ${normalizedSubdomain}`);
    // Aguardar invalidação (não bloqueia se falhar, mas tenta)
    await callRevalidateWithRetry(normalizedSubdomain, 'updateCustomization', 3);
  }

  revalidatePath("/");
  revalidatePath("/customers");
  revalidatePath(`/customers/${validated.data.customerId}`);
  // Invalida cache da API de customização
  revalidatePath(`/api/public/customization/${normalizedSubdomain}`);
  revalidateTag(`customization-${normalizedSubdomain}`);

  return {
    success: true,
    customization: updatedCustomization,
  };
}

const removeImageSchema = z.object({
  customerId: z.coerce.number(),
  type: z.enum(['logo', 'login', 'favicon', 'email']),
});

const removeAllImagesSchema = z.object({
  customerId: z.coerce.number(),
});

export async function removeImage(data: { customerId: number; type: 'logo' | 'login' | 'favicon' | 'email' }) {
  console.log(`[removeImage] START - Removing ${data.type} for customerId=${data.customerId}`);
  
  const validated = removeImageSchema.safeParse(data);
  if (!validated.success) {
    console.error("[removeImage] Validation error:", validated.error.flatten());
    throw new Error("Dados inválidos");
  }

  const { customerId, type } = validated.data;

  const existingCustomization = await getCustomizationByCustomerId(customerId);
  if (!existingCustomization) {
    throw new Error("Customização não encontrada");
  }

  const fieldMap = {
    logo: { urlField: 'imageUrl' as const, fileIdField: 'fileId' as const },
    login: { urlField: 'loginImageUrl' as const, fileIdField: 'loginImageFileId' as const },
    favicon: { urlField: 'faviconUrl' as const, fileIdField: 'faviconFileId' as const },
    email: { urlField: 'emailImageUrl' as const, fileIdField: 'emailImageFileId' as const },
  };

  const { urlField, fileIdField } = fieldMap[type];
  const currentUrl = existingCustomization[urlField];

  if (currentUrl) {
    let key = '';
    try {
      const bucketName = process.env.AWS_BUCKET_NAME;
      const region = process.env.AWS_REGION;
      
      if (currentUrl.includes(`${bucketName}.s3.${region}.amazonaws.com`) || 
          currentUrl.includes(`${bucketName}.s3.amazonaws.com`)) {
        
        const urlParts = currentUrl.split('/');
        key = urlParts[urlParts.length - 1];
        
        console.log(`[removeImage] Attempting to delete S3 object: ${key}`);
        
        const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        
        await s3Client.send(deleteCommand);
        console.log(`[removeImage] S3 object deleted successfully: ${key}`);
      } else {
        console.log(`[removeImage] URL does not belong to our bucket, skipping S3 deletion`);
      }
    } catch (error: any) {
      // Tratamento específico para erro de permissão
      if (error?.name === 'AccessDenied' || error?.Code === 'AccessDenied') {
        console.warn(`[removeImage] ⚠️ Permissão negada para deletar imagem do S3 (não crítico - continuando): ${key || currentUrl}`);
      } else {
        console.error(`[removeImage] S3 deletion failed (continuing anyway):`, error?.message || error);
      }
    }
  }

  const updateData: any = {
    [urlField]: null,
    [fileIdField]: null,
  };

  await db
    .update(customerCustomization)
    .set(updateData)
    .where(eq(customerCustomization.customerId, customerId));

  console.log(`[removeImage] Database updated - ${urlField} and ${fileIdField} set to null`);

  const slug = existingCustomization.slug;
  if (slug) {
    console.log(`[removeImage] ⏰ Calling revalidate API for slug: ${slug}`);
    // Aguardar invalidação (não bloqueia se falhar, mas tenta)
    await callRevalidateWithRetry(slug, 'removeImage', 3);
  }

  const updatedCustomization = await getCustomizationByCustomerId(customerId);

  revalidatePath("/");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  // Invalida cache da API de customização
  if (slug) {
    revalidatePath(`/api/public/customization/${slug}`);
    revalidateTag(`customization-${slug}`);
  }

  console.log(`[removeImage] ✅ Image removed successfully`);

  return {
    success: true,
    customization: updatedCustomization,
  };
}

export async function removeAllImages(data: { customerId: number }) {
  console.log(`[removeAllImages] START - Removing all images for customerId=${data.customerId}`);
  
  const validated = removeAllImagesSchema.safeParse(data);
  if (!validated.success) {
    console.error("[removeAllImages] Validation error:", validated.error.flatten());
    throw new Error("Dados inválidos");
  }

  const { customerId } = validated.data;

  const existingCustomization = await getCustomizationByCustomerId(customerId);
  if (!existingCustomization) {
    throw new Error("Customização não encontrada");
  }

  const urlsToDelete = [
    existingCustomization.imageUrl,
    existingCustomization.loginImageUrl,
    existingCustomization.faviconUrl,
    existingCustomization.emailImageUrl,
  ].filter(Boolean) as string[];

  for (const url of urlsToDelete) {
    let key = '';
    try {
      const bucketName = process.env.AWS_BUCKET_NAME;
      const region = process.env.AWS_REGION;
      
      if (url.includes(`${bucketName}.s3.${region}.amazonaws.com`) || 
          url.includes(`${bucketName}.s3.amazonaws.com`)) {
        
        const urlParts = url.split('/');
        key = urlParts[urlParts.length - 1];
        
        console.log(`[removeAllImages] Attempting to delete S3 object: ${key}`);
        
        const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        
        await s3Client.send(deleteCommand);
        console.log(`[removeAllImages] S3 object deleted successfully: ${key}`);
      }
    } catch (error: any) {
      // Tratamento específico para erro de permissão
      if (error?.name === 'AccessDenied' || error?.Code === 'AccessDenied') {
        console.warn(`[removeAllImages] ⚠️ Permissão negada para deletar imagem do S3 (não crítico - continuando): ${key || url}`);
      } else {
        console.error(`[removeAllImages] S3 deletion failed for ${url} (continuing anyway):`, error?.message || error);
      }
    }
  }

  await db
    .update(customerCustomization)
    .set({
      imageUrl: null,
      fileId: null,
      loginImageUrl: null,
      loginImageFileId: null,
      faviconUrl: null,
      faviconFileId: null,
      emailImageUrl: null,
      emailImageFileId: null,
    })
    .where(eq(customerCustomization.customerId, customerId));

  console.log(`[removeAllImages] Database updated - all image fields set to null`);

  const slug = existingCustomization.slug;
  if (slug) {
    console.log(`[removeAllImages] ⏰ Calling revalidate API for slug: ${slug}`);
    // Aguardar invalidação (não bloqueia se falhar, mas tenta)
    await callRevalidateWithRetry(slug, 'removeAllImages', 3);
  }

  const updatedCustomization = await getCustomizationByCustomerId(customerId);

  revalidatePath("/");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  // Invalida cache da API de customização
  if (slug) {
    revalidatePath(`/api/public/customization/${slug}`);
    revalidateTag(`customization-${slug}`);
  }

  console.log(`[removeAllImages] ✅ All images removed successfully`);

  return {
    success: true,
    customization: updatedCustomization,
  };
}
