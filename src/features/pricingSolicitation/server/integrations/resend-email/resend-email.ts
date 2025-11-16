"use server";

import { Resend } from "resend";
import EmailTemplate from "@/components/emailTemplate";

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || "Outbank <noreply@consolle.one>";

export async function SendEmail(email: string, link: string) {
  try {
    const data = await resend.emails.send({
      from: EMAIL_FROM,
      to: [email],
      subject: `Link para compra`,
      react: EmailTemplate({ purchaseLink: link }),
    });
    return data;
  } catch (err) {
    console.log(err);
  }
}
