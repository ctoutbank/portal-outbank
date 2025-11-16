"use server";
import { resend } from "@/lib/resend";
import { currentUser } from "@clerk/nextjs/server";
import fs from "fs/promises";
import path from "path";

const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@consolle.one";

export async function getUserEmail() {
  const user = await currentUser();
  console.log("user", user);
  if (!user) {
    throw new Error("User not found");
  }
  return user.emailAddresses[0].emailAddress;
}

export async function sendPricingSolicitationEmail(to: string) {
  try {
    console.log("to", to);
    console.log(`[sendPricingSolicitationEmail] Sending email to ${to} from ${EMAIL_FROM}`);
    const filePath = path.join(process.cwd(), "public", "AditivoAcquiring.pdf");
    const fileBuffer = await fs.readFile(filePath);
    const fileBase64 = fileBuffer.toString("base64");

    await resend.emails.send({
      from: EMAIL_FROM,
    to,
    subject: "Aditivo de Taxas",
    html: "<p>Baixe, assine e importe o documento de aditivo de taxas</p>",
    attachments: [
      {
        filename: "aditivo.pdf",
        content: fileBase64,
        contentType: "application/pdf",
      },
    ],
    });
    console.log(`[sendPricingSolicitationEmail] Email sent successfully to ${to}`);
  } catch (error) {
    console.error("[sendPricingSolicitationEmail] Error sending pricing solicitation email:", error);
    throw error;
  }
}
