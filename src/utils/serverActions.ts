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
  // eslint-disable-next-line prefer-const
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
        customerId: customerCustomization.customerId,
      })
      .from(customerCustomization)
      .leftJoin(file, eq(customerCustomization.fileId, file.id))
      .where(eq(customerCustomization.customerId, customerId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Erro ao buscar customização por customerId:", error);
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

  const image = formData.get("image") as File | null;
  if (image) {
    const arrayBuffer = await image.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const imageId = nanoid();
    const extension = "png";
    const fileType = image.type || "image/jpeg";

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${imageId}.jpg`,
      Body: imageBuffer,
      ContentType: fileType,
    });

    await s3Client.send(uploadCommand);

    imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${imageId}.jpg`;

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

  const primaryHSL = hexToHsl(primaryColor);
  const secondaryHSL = hexToHsl(secondaryColor);

  await db.insert(customerCustomization).values({
    name: subdomain,
    slug: subdomain,
    primaryColor: primaryHSL,
    secondaryColor: secondaryHSL,
    customerId: customerId,
    fileId: fileId,
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
      ...(fileId && { fileId: fileId }),
    })
    .where(eq(customerCustomization.id, id));

  revalidatePath("/");
}
