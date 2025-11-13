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

// Função para converter HEX → HSL
function hexToHsl(hex: string): string {
  hex = hex.replace(/^#/, "");

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
}

const customizationSchema = z.object({
  subdomain: z.string().min(1),
  primaryColor: z.string().min(1),
  secondaryColor: z.string().min(1),
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
      .where(eq(customerCustomization.slug, subdomain))
      .limit(1);

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
  const rawData = {
    subdomain: formData.get("subdomain"),
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    customerId: formData.get("customerId"),
  };

  const validated = customizationSchema.safeParse(rawData);
  if (!validated.success) {
    console.error("Erro de validação:", validated.error.flatten());
    return;
  }

  const { subdomain, primaryColor, secondaryColor, customerId } =
    validated.data;

  let imageUrl = "";
  let fileId: number | null = null;
  let loginImageUrl = "";
  let loginImageFileId: number | null = null;
  let faviconUrl = "";
  let faviconFileId: number | null = null;

  const image = formData.get("image") as File | null;
  if (image) {
    const arrayBuffer = await image.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const imageId = nanoid(8);
    const extension = "png";
    const fileType = "image/jpeg";

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${imageId}.jpg`,
      Body: imageBuffer,
      ContentType: fileType,
    });

    await s3Client.send(uploadCommand);

    imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${imageId}.jpg`;
    console.log("info here: ",imageUrl, image.name, extension, fileType);
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

    await s3Client.send(uploadCommand);

    loginImageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/login-${imageId}.${extension}`;
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

    await s3Client.send(uploadCommand);

    faviconUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/favicon-${imageId}.${extension}`;
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
  const secondaryHSL = hexToHsl(secondaryColor);

  await db.insert(customerCustomization).values({
    name: subdomain,
    slug: subdomain,
    primaryColor: primaryHSL,
    secondaryColor: secondaryHSL,
    customerId: customerId,
    fileId: fileId,
    loginImageUrl: loginImageUrl || null,
    loginImageFileId: loginImageFileId,
    faviconUrl: faviconUrl || null,
    faviconFileId: faviconFileId,
  });

  revalidatePath("/");
}

export async function updateCustomization(formData: FormData) {
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
    console.error("Erro de validação:", validated.error.flatten());
    return;
  }

  const { id, subdomain, primaryColor, secondaryColor } = validated.data;

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
      Key: `${imageId}.jpg`,
      Body: imageBuffer,
      ContentType: fileType,
    });

    await s3Client.send(uploadCommand);

    imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${imageId}.jpg`;

    console.log("extensão", extension);

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

    await s3Client.send(uploadCommand);

    loginImageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/login-${imageId}.${extension}`;
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

    await s3Client.send(uploadCommand);

    faviconUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/favicon-${imageId}.${extension}`;
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
  const secondaryHSL = hexToHsl(secondaryColor);

  await db
    .update(customerCustomization)
    .set({
      name: subdomain,
      slug: subdomain,
      primaryColor: primaryHSL,
      secondaryColor: secondaryHSL,
      ...(imageUrl && { imageUrl: imageUrl }),
      fileId: fileId,
      ...(loginImageUrl && { loginImageUrl: loginImageUrl }),
      loginImageFileId: loginImageFileId,
      ...(faviconUrl && { faviconUrl: faviconUrl }),
      faviconFileId: faviconFileId,
    })
    .where(eq(customerCustomization.id, id));

  revalidatePath("/");
}
