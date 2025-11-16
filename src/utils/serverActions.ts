"use server";

import { customerCustomization, db, file } from "@/lib/db";
import { s3Client } from "@/lib/s3-client/s3Client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type CustomerCustomization = {
  id: number | null;
  name: string | null;
  slug: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  imageUrl: string | null;
  loginImageUrl: string | null;
  faviconUrl: string | null;
  customerId: number | null;
};

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
        imageUrl: file.fileUrl,
        imageUrlDirect: customerCustomization.imageUrl,
        loginImageUrl: customerCustomization.loginImageUrl,
        faviconUrl: customerCustomization.faviconUrl,
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
    let result = await db
      .select({
        id: customerCustomization.id,
        name: customerCustomization.name,
        slug: customerCustomization.slug,
        primaryColor: customerCustomization.primaryColor,
        secondaryColor: customerCustomization.secondaryColor,
        imageUrl: file.fileUrl,
        imageUrlDirect: customerCustomization.imageUrl,
        loginImageUrl: customerCustomization.loginImageUrl,
        faviconUrl: customerCustomization.faviconUrl,
        customerId: customerCustomization.customerId,
      })
      .from(customerCustomization)
      .leftJoin(file, eq(customerCustomization.fileId, file.id))
      .where(eq(customerCustomization.slug, subdomain))
      .limit(1);

    if (result.length === 0) {
      console.log(`[getCustomizationBySubdomain] No record found for slug="${subdomain}", trying fallback by name`);
      result = await db
        .select({
          id: customerCustomization.id,
          name: customerCustomization.name,
          slug: customerCustomization.slug,
          primaryColor: customerCustomization.primaryColor,
          secondaryColor: customerCustomization.secondaryColor,
          imageUrl: file.fileUrl,
          imageUrlDirect: customerCustomization.imageUrl,
          loginImageUrl: customerCustomization.loginImageUrl,
          faviconUrl: customerCustomization.faviconUrl,
          customerId: customerCustomization.customerId,
        })
        .from(customerCustomization)
        .leftJoin(file, eq(customerCustomization.fileId, file.id))
        .where(eq(customerCustomization.name, subdomain))
        .limit(1);
      
      if (result.length > 0) {
        console.log(`[getCustomizationBySubdomain] Found record by name fallback for "${subdomain}"`);
      }
    }

    const row = result[0];
    if (!row) return null;

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

  const { subdomain, primaryColor, secondaryColor, customerId } =
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

  let imageUrl = "";
  let fileId: number | null = null;
  let loginImageUrl = "";
  let loginImageFileId: number | null = null;
  let faviconUrl = "";
  let faviconFileId: number | null = null;

  const image = formData.get("image") as File | null;
  console.log("[saveCustomization] Image file:", image ? `present (${image.size} bytes, ${image.type})` : 'not provided');
  if (image) {
    const arrayBuffer = await image.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const imageId = nanoid(8);
    const extension = image.name.split(".").pop() || "jpg";
    const fileType = image.type || "image/jpeg";

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `logo-${imageId}.${extension}`,
      Body: imageBuffer,
      ContentType: fileType,
    });

    try {
      await s3Client.send(uploadCommand);
      imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/logo-${imageId}.${extension}`;
      console.log("Logo uploaded successfully:", imageUrl);
    } catch (error: any) {
      console.error("S3 Upload Error (logo):", {
        name: error.name,
        message: error.message,
        statusCode: error.$metadata?.httpStatusCode,
      });
      throw new Error(`Falha no upload do logo: ${error.message}`);
    }

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
    const arrayBuffer = await loginImage.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const imageId = nanoid(8);
    const extension = loginImage.name.split(".").pop() || "jpg";
    const fileType = loginImage.type || "image/jpeg";

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `login-${imageId}.${extension}`,
      Body: imageBuffer,
      ContentType: fileType,
    });

    try {
      await s3Client.send(uploadCommand);
      loginImageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/login-${imageId}.${extension}`;
      console.log("Login image uploaded successfully:", loginImageUrl);
    } catch (error: any) {
      console.error("S3 Upload Error (login image):", {
        name: error.name,
        message: error.message,
        statusCode: error.$metadata?.httpStatusCode,
      });
      throw new Error(`Falha no upload da imagem de login: ${error.message}`);
    }

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
    const arrayBuffer = await favicon.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const imageId = nanoid(8);
    const extension = favicon.name.split(".").pop() || "ico";
    const fileType = favicon.type || "image/x-icon";

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `favicon-${imageId}.${extension}`,
      Body: imageBuffer,
      ContentType: fileType,
    });

    try {
      await s3Client.send(uploadCommand);
      faviconUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/favicon-${imageId}.${extension}`;
      console.log("Favicon uploaded successfully:", faviconUrl);
    } catch (error: any) {
      console.error("S3 Upload Error (favicon):", {
        name: error.name,
        message: error.message,
        statusCode: error.$metadata?.httpStatusCode,
      });
      throw new Error(`Falha no upload do favicon: ${error.message}`);
    }

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

  const primaryHSL = hexToHsl(primaryColor);
  const secondaryHSL = secondaryColor ? hexToHsl(secondaryColor) : null;

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
        ...(fileId && { fileId: fileId }),
        ...(imageUrl && { imageUrl: imageUrl }),
        ...(loginImageUrl && { loginImageUrl: loginImageUrl }),
        ...(loginImageFileId && { loginImageFileId: loginImageFileId }),
        ...(faviconUrl && { faviconUrl: faviconUrl }),
        ...(faviconFileId && { faviconFileId: faviconFileId }),
      })
      .where(eq(customerCustomization.id, existingCustomization[0].id));
  } else {
    console.log(`[saveCustomization] Creating new customization for customerId=${customerId}`);
    await db.insert(customerCustomization).values({
      name: normalizedSubdomain,
      slug: normalizedSubdomain,
      primaryColor: primaryHSL,
      secondaryColor: secondaryHSL,
      customerId: customerId,
      fileId: fileId,
      imageUrl: imageUrl || null,
      loginImageUrl: loginImageUrl || null,
      loginImageFileId: loginImageFileId,
      faviconUrl: faviconUrl || null,
      faviconFileId: faviconFileId,
    });
  }

  const savedCustomization = await getCustomizationByCustomerId(customerId);
  console.log(`[saveCustomization] Final URLs saved:`, {
    imageUrl: savedCustomization?.imageUrl,
    loginImageUrl: savedCustomization?.loginImageUrl,
    faviconUrl: savedCustomization?.faviconUrl,
  });

  if (normalizedSubdomain) {
    console.log(`[saveCustomization] ⏰ Calling revalidate API for slug: ${normalizedSubdomain}`);
    try {
      const revalidateUrl = process.env.NEXT_PUBLIC_OUTBANK_ONE_URL || 'https://outbank-one.vercel.app';
      const startTime = Date.now();
      const response = await fetch(`${revalidateUrl}/api/revalidate/theme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REVALIDATE_TOKEN}`,
        },
        body: JSON.stringify({ slug: normalizedSubdomain }),
      });
      const duration = Date.now() - startTime;

      if (response.ok) {
        const responseData = await response.json();
        console.log(`[saveCustomization] ✅ Cache invalidated successfully in ${duration}ms:`, responseData);
      } else {
        const errorText = await response.text();
        console.error(`[saveCustomization] ❌ Failed to invalidate cache: ${response.status} ${response.statusText}`, errorText);
      }
    } catch (error) {
      console.error(`[saveCustomization] ❌ Error calling revalidate API:`, error);
    }
  }

  revalidatePath("/");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);

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

  const { id, subdomain, primaryColor, secondaryColor } = validated.data;

  if (!subdomain || subdomain.trim() === "") {
    console.error(`[updateCustomization] Subdomain is required but was empty`);
    throw new Error("Subdomain é obrigatório");
  }

  const normalizedSubdomain = subdomain.toLowerCase().trim();
  console.log(`[updateCustomization] Using subdomain: "${normalizedSubdomain}" for customerId=${validated.data.customerId}`);

  let imageUrl = "";
  let fileId: number | null = null;
  let loginImageUrl = "";
  let loginImageFileId: number | null = null;
  let faviconUrl = "";
  let faviconFileId: number | null = null;

  const image = formData.get("image") as File | null;
  if (image && image.size > 0) {
    const arrayBuffer = await image.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const imageId = nanoid();
    const extension = image.name.split(".").pop() || "jpg";
    const fileType = image.type || "image/jpeg";

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `logo-${imageId}.${extension}`,
      Body: imageBuffer,
      ContentType: fileType,
    });

    try {
      await s3Client.send(uploadCommand);
      imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/logo-${imageId}.${extension}`;
      console.log("Logo updated successfully:", imageUrl);
    } catch (error: any) {
      console.error("S3 Upload Error (logo update):", {
        name: error.name,
        message: error.message,
        statusCode: error.$metadata?.httpStatusCode,
      });
      throw new Error(`Falha na atualização do logo: ${error.message}`);
    }

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
    const existingCustomization = await getCustomizationByCustomerId(
      validated.data.customerId
    );
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
    const arrayBuffer = await loginImage.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const imageId = nanoid();
    const extension = loginImage.name.split(".").pop() || "jpg";
    const fileType = loginImage.type || "image/jpeg";

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `login-${imageId}.${extension}`,
      Body: imageBuffer,
      ContentType: fileType,
    });

    try {
      await s3Client.send(uploadCommand);
      loginImageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/login-${imageId}.${extension}`;
      console.log("Login image updated successfully:", loginImageUrl);
    } catch (error: any) {
      console.error("S3 Upload Error (login image update):", {
        name: error.name,
        message: error.message,
        statusCode: error.$metadata?.httpStatusCode,
      });
      throw new Error(`Falha na atualização da imagem de login: ${error.message}`);
    }

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
    const existingCustomization = await getCustomizationByCustomerId(
      validated.data.customerId
    );
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
    const arrayBuffer = await favicon.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const imageId = nanoid();
    const extension = favicon.name.split(".").pop() || "ico";
    const fileType = favicon.type || "image/x-icon";

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `favicon-${imageId}.${extension}`,
      Body: imageBuffer,
      ContentType: fileType,
    });

    try {
      await s3Client.send(uploadCommand);
      faviconUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/favicon-${imageId}.${extension}`;
      console.log("Favicon updated successfully:", faviconUrl);
    } catch (error: any) {
      console.error("S3 Upload Error (favicon update):", {
        name: error.name,
        message: error.message,
        statusCode: error.$metadata?.httpStatusCode,
      });
      throw new Error(`Falha na atualização do favicon: ${error.message}`);
    }

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
    const existingCustomization = await getCustomizationByCustomerId(
      validated.data.customerId
    );
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

  const primaryHSL = hexToHsl(primaryColor);
  const secondaryHSL = secondaryColor ? hexToHsl(secondaryColor) : null;

  console.log(`[updateCustomization] Updating customization id=${id} for customerId=${validated.data.customerId}`);
  console.log(`[updateCustomization] New URLs:`, {
    imageUrl: imageUrl || '(unchanged)',
    loginImageUrl: loginImageUrl || '(unchanged)',
    faviconUrl: faviconUrl || '(unchanged)',
  });

  await db
    .update(customerCustomization)
    .set({
      name: normalizedSubdomain,
      slug: normalizedSubdomain,
      primaryColor: primaryHSL,
      ...(secondaryHSL && { secondaryColor: secondaryHSL }),
      ...(imageUrl && { imageUrl: imageUrl }),
      fileId: fileId,
      ...(loginImageUrl && { loginImageUrl: loginImageUrl }),
      loginImageFileId: loginImageFileId,
      ...(faviconUrl && { faviconUrl: faviconUrl }),
      faviconFileId: faviconFileId,
    })
    .where(eq(customerCustomization.id, id));

  const updatedCustomization = await getCustomizationByCustomerId(validated.data.customerId);
  console.log(`[updateCustomization] Final URLs after update:`, {
    imageUrl: updatedCustomization?.imageUrl,
    loginImageUrl: updatedCustomization?.loginImageUrl,
    faviconUrl: updatedCustomization?.faviconUrl,
  });

  if (normalizedSubdomain) {
    console.log(`[updateCustomization] ⏰ Calling revalidate API for slug: ${normalizedSubdomain}`);
    try {
      const revalidateUrl = process.env.NEXT_PUBLIC_OUTBANK_ONE_URL || 'https://outbank-one.vercel.app';
      const startTime = Date.now();
      const response = await fetch(`${revalidateUrl}/api/revalidate/theme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REVALIDATE_TOKEN}`,
        },
        body: JSON.stringify({ slug: normalizedSubdomain }),
      });
      const duration = Date.now() - startTime;

      if (response.ok) {
        const responseData = await response.json();
        console.log(`[updateCustomization] ✅ Cache invalidated successfully in ${duration}ms:`, responseData);
      } else {
        const errorText = await response.text();
        console.error(`[updateCustomization] ❌ Failed to invalidate cache: ${response.status} ${response.statusText}`, errorText);
      }
    } catch (error) {
      console.error(`[updateCustomization] ❌ Error calling revalidate API:`, error);
    }
  }

  revalidatePath("/");
  revalidatePath("/customers");
  revalidatePath(`/customers/${validated.data.customerId}`);

  return {
    success: true,
    customization: updatedCustomization,
  };
}

const removeImageSchema = z.object({
  customerId: z.coerce.number(),
  type: z.enum(['logo', 'login', 'favicon']),
});

const removeAllImagesSchema = z.object({
  customerId: z.coerce.number(),
});

export async function removeImage(data: { customerId: number; type: 'logo' | 'login' | 'favicon' }) {
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
  };

  const { urlField, fileIdField } = fieldMap[type];
  const currentUrl = existingCustomization[urlField];

  if (currentUrl) {
    try {
      const bucketName = process.env.AWS_BUCKET_NAME;
      const region = process.env.AWS_REGION;
      
      if (currentUrl.includes(`${bucketName}.s3.${region}.amazonaws.com`) || 
          currentUrl.includes(`${bucketName}.s3.amazonaws.com`)) {
        
        const urlParts = currentUrl.split('/');
        const key = urlParts[urlParts.length - 1];
        
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
      console.error(`[removeImage] S3 deletion failed (continuing anyway):`, error.message);
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
    try {
      const revalidateUrl = process.env.NEXT_PUBLIC_OUTBANK_ONE_URL || 'https://outbank-one.vercel.app';
      const startTime = Date.now();
      const response = await fetch(`${revalidateUrl}/api/revalidate/theme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REVALIDATE_TOKEN}`,
        },
        body: JSON.stringify({ slug }),
      });
      const duration = Date.now() - startTime;

      if (response.ok) {
        const responseData = await response.json();
        console.log(`[removeImage] ✅ Cache invalidated successfully in ${duration}ms:`, responseData);
      } else {
        const errorText = await response.text();
        console.error(`[removeImage] ❌ Failed to invalidate cache: ${response.status} ${response.statusText}`, errorText);
      }
    } catch (error) {
      console.error(`[removeImage] ❌ Error calling revalidate API:`, error);
    }
  }

  const updatedCustomization = await getCustomizationByCustomerId(customerId);

  revalidatePath("/");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);

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
  ].filter(Boolean) as string[];

  for (const url of urlsToDelete) {
    try {
      const bucketName = process.env.AWS_BUCKET_NAME;
      const region = process.env.AWS_REGION;
      
      if (url.includes(`${bucketName}.s3.${region}.amazonaws.com`) || 
          url.includes(`${bucketName}.s3.amazonaws.com`)) {
        
        const urlParts = url.split('/');
        const key = urlParts[urlParts.length - 1];
        
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
      console.error(`[removeAllImages] S3 deletion failed for ${url} (continuing anyway):`, error.message);
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
    })
    .where(eq(customerCustomization.customerId, customerId));

  console.log(`[removeAllImages] Database updated - all image fields set to null`);

  const slug = existingCustomization.slug;
  if (slug) {
    console.log(`[removeAllImages] ⏰ Calling revalidate API for slug: ${slug}`);
    try {
      const revalidateUrl = process.env.NEXT_PUBLIC_OUTBANK_ONE_URL || 'https://outbank-one.vercel.app';
      const startTime = Date.now();
      const response = await fetch(`${revalidateUrl}/api/revalidate/theme`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REVALIDATE_TOKEN}`,
        },
        body: JSON.stringify({ slug }),
      });
      const duration = Date.now() - startTime;

      if (response.ok) {
        const responseData = await response.json();
        console.log(`[removeAllImages] ✅ Cache invalidated successfully in ${duration}ms:`, responseData);
      } else {
        const errorText = await response.text();
        console.error(`[removeAllImages] ❌ Failed to invalidate cache: ${response.status} ${response.statusText}`, errorText);
      }
    } catch (error) {
      console.error(`[removeAllImages] ❌ Error calling revalidate API:`, error);
    }
  }

  const updatedCustomization = await getCustomizationByCustomerId(customerId);

  revalidatePath("/");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);

  console.log(`[removeAllImages] ✅ All images removed successfully`);

  return {
    success: true,
    customization: updatedCustomization,
  };
}
