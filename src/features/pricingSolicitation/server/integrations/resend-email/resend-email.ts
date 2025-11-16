"use server";

import { getResend } from "@/lib/resend";
import EmailTemplate from "@/components/emailTemplate";

const EMAIL_FROM = process.env.EMAIL_FROM || "Outbank <noreply@consolle.one>";

export async function SendEmail(email: string, link: string) {
  try {
    console.log(`[SendEmail] Sending email to ${email} from ${EMAIL_FROM}`);
    const data = await getResend().emails.send({
      from: EMAIL_FROM,
      to: [email],
      subject: `Link para compra`,
      react: EmailTemplate({ purchaseLink: link }),
    });
    console.log(`[SendEmail] Email sent successfully to ${email}`);
    return data;
  } catch (err) {
    console.error("[SendEmail] Error sending purchase link email:", err);
    throw err;
  }
}
