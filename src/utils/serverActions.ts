'use server'
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { customerCustomization, db, file, } from "@/lib/db";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3-client/s3Client";
import { nanoid } from "nanoid";

// Função para converter HEX → HSL
function hexToHsl(hex: string): string {
    hex = hex.replace(/^#/, '');

    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    // eslint-disable-next-line prefer-const
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const customizationSchema = z.object({
    subdomain: z.string().min(1),
    primaryColor: z.string().min(1),
    secondaryColor: z.string().min(1),
});

export async function saveCustomization(formData: FormData) {
    const rawData = {
        subdomain: formData.get("subdomain"),
        primaryColor: formData.get("primaryColor"),
        secondaryColor: formData.get("secondaryColor"),
        customerId: Number(formData.get("customerId")),
    };

    const image = formData.get("image") as File;
    const arrayBuffer = await image.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const imageId = nanoid()

    const imageName = image.name


    const putObjectParams = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageId + '.jpg',
        Body: imageBuffer,
        ContentType: "image/jpeg",
    })

    await s3Client.send(putObjectParams)

    const validated = customizationSchema.safeParse(rawData);

    if (!validated.success) {
        console.error(validated.error);
        return;
    }

    // Conversão HEX → HSL
    const primaryHSL = hexToHsl(validated.data.primaryColor);
    const secondaryHSL = hexToHsl(validated.data.secondaryColor);
    const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${imageId}.jpg`;
    const customerId = Number(formData.get("customerId"));


    const extension = image.name.split(".").pop() || "jpg";
    const fileType = image.type || "image/jpeg";

    try {

       const result =  await db.insert(file).values({
            fileUrl: imageUrl,
            fileName: imageName,
            extension: extension,
            fileType: fileType,
            active: true,
        })
           .returning({id: file.id
               }
           )
       ;

        await db.insert(customerCustomization).values({
            name: validated.data.subdomain,
            slug: validated.data.subdomain,
            primaryColor: primaryHSL,
            secondaryColor: secondaryHSL,
            imageUrl: imageUrl,
            customerId: customerId,
            fileId: result[0].id,
        });

        console.log("salvo");
    } catch (error) {
        console.error("erro", error);
    }







    console.log("Salvando na tabela file com:", {
        fileUrl: imageUrl,
        customerId: customerId,
        fileName: imageName,
    });




    revalidatePath("/");
}
