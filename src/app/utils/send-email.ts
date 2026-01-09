import { getResend } from "@/lib/resend";
import { getThemeByTenant } from "@/lib/cache/theme-cache";
import { headers } from "next/headers";

async function getThemeDataForEmail(overrideSubdomain?: string) {
  if (overrideSubdomain) {
    return getThemeByTenant(overrideSubdomain);
  }
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const subdomain = host.split(".")[0];
  return getThemeByTenant(subdomain);
}

export async function sendWelcomePasswordEmail(to: string, password: string) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const subdomain = host.split(".")[0];
  const themeData = await getThemeByTenant(subdomain);
  if (!themeData) {
    return;
  }

  const resend = getResend();
  await resend.emails.send({
    from: `${themeData.name} <noreply@consolle.one>`,
    to,
    subject: `Bem-vindo ao ${themeData.name} - Sua conta foi criada!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Bem-vindo ao ${themeData.name}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table width="100%" style="max-width: 600px;" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color: #ffffff; border-radius: 16px; padding: 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="left" style="padding-bottom: 30px;">
                            <div style="width: 128px; height: 128px; background-color: #000000; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
                              <img src="${themeData.imageUrl}" alt="Logo" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;" />
                            </div>
                          </td>
                        </tr>
                      </table>
                      <h1 style="font-size: 32px; font-weight: bold; color: #1a1a1a; margin: 0 0 24px 0; line-height: 1.2; text-align: left;">
                        Bem-vindo ao ${themeData.name}
                      </h1>
                      <div style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: left;">
                        <p style="margin: 0 0 8px 0;">Sua conta foi criada com sucesso! Estamos felizes em tê-lo conosco.</p>
                        <p style="margin: 0 0 8px 0;">Acesse sua conta para começar a usar todos os nossos recursos.</p>
                      </div>
                      <p style="color: #1a1a1a; font-size: 16px; margin: 0 0 16px 0; font-weight: 600; text-align: left;">
                        Sua senha temporária de acesso:
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                        <tr>
                          <td text-align="left">
                            <div style="display: inline-block; background-color: #000000; color: #ffffff; padding: 12px 32px; border-radius: 25px; font-weight: 500; font-size: 16px; letter-spacing: 1px; font-family: 'Courier New', monospace;">
                              ${password}
                            </div>
                          </td>
                        </tr>
                      </table>
                      <p style="color: #666666; font-size: 14px; margin: 0 0 32px 0; text-align: left;">
                        Você poderá alterá-la no primeiro login.
                      </p>
                      <div style="background-color: #f8f9fa; border-left: 4px solid #000000; padding: 16px; margin: 32px 0; border-radius: 4px;">
                        <p style="color: #666666; font-size: 14px; margin: 0; text-align: left;">
                          <strong>Importante:</strong> Se não foi você quem fez esse cadastro, ignore este e-mail.
                        </p>
                      </div>
                      <div style="margin-top: 40px; text-align: left;">
                        <p style="color: #1a1a1a; font-size: 16px; margin: 0;">Atenciosamente,</p>
                        <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 4px 0 0 0;">Equipe ${themeData.name}</p>
                      </div>
                    </td>
                  </tr>
                </table>
                <table width="100%" style="max-width: 600px; margin-top: 30px;" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <p style="color: #888888; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} ${themeData.name}. Todos os direitos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}

export async function sendConsultorWelcomeEmail(
  to: string,
  consultorName: string,
  password: string,
  subdomain?: string
) {
  const themeData = await getThemeDataForEmail(subdomain);
  if (!themeData) {
    console.error("Theme data not found for email, subdomain:", subdomain);
    return { success: false, error: "Theme not found" };
  }

  const resend = getResend();
  await resend.emails.send({
    from: `${themeData.name} <noreply@consolle.one>`,
    to,
    subject: `Bem-vindo ao ${themeData.name} - Sua conta de Consultor Comercial foi criada!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Bem-vindo ao ${themeData.name}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table width="100%" style="max-width: 600px;" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color: #ffffff; border-radius: 16px; padding: 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="left" style="padding-bottom: 30px;">
                            <div style="width: 128px; height: 128px; background-color: #000000; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
                              <img src="${themeData.imageUrl}" alt="Logo" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;" />
                            </div>
                          </td>
                        </tr>
                      </table>
                      <h1 style="font-size: 32px; font-weight: bold; color: #1a1a1a; margin: 0 0 24px 0; line-height: 1.2; text-align: left;">
                        Bem-vindo, ${consultorName}!
                      </h1>
                      <div style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: left;">
                        <p style="margin: 0 0 8px 0;">Sua conta de <strong>Consultor Comercial</strong> foi criada com sucesso no ${themeData.name}!</p>
                        <p style="margin: 0 0 8px 0;">Agora você pode acessar o portal para cadastrar novos estabelecimentos e acompanhar seus resultados.</p>
                      </div>
                      <div style="background-color: #f0f9ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                        <p style="color: #1a1a1a; font-size: 14px; font-weight: 600; margin: 0 0 12px 0; text-align: left;">O que você pode fazer:</p>
                        <ul style="color: #666666; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                          <li>Cadastrar novos estabelecimentos</li>
                          <li>Acompanhar o status dos seus cadastros</li>
                          <li>Visualizar relatórios de fechamento</li>
                        </ul>
                      </div>
                      <p style="color: #1a1a1a; font-size: 16px; margin: 0 0 16px 0; font-weight: 600; text-align: left;">
                        Sua senha temporária de acesso:
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                        <tr>
                          <td text-align="left">
                            <div style="display: inline-block; background-color: #000000; color: #ffffff; padding: 12px 32px; border-radius: 25px; font-weight: 500; font-size: 16px; letter-spacing: 1px; font-family: 'Courier New', monospace;">
                              ${password}
                            </div>
                          </td>
                        </tr>
                      </table>
                      <p style="color: #666666; font-size: 14px; margin: 0 0 32px 0; text-align: left;">
                        Você poderá alterá-la no primeiro login.
                      </p>
                      <div style="background-color: #f8f9fa; border-left: 4px solid #000000; padding: 16px; margin: 32px 0; border-radius: 4px;">
                        <p style="color: #666666; font-size: 14px; margin: 0; text-align: left;">
                          <strong>Importante:</strong> Se não foi você quem fez esse cadastro, ignore este e-mail.
                        </p>
                      </div>
                      <div style="margin-top: 40px; text-align: left;">
                        <p style="color: #1a1a1a; font-size: 16px; margin: 0;">Atenciosamente,</p>
                        <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 4px 0 0 0;">Equipe ${themeData.name}</p>
                      </div>
                    </td>
                  </tr>
                </table>
                <table width="100%" style="max-width: 600px; margin-top: 30px;" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <p style="color: #888888; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} ${themeData.name}. Todos os direitos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
  
  return { success: true };
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  subdomain?: string
) {
  const themeData = await getThemeDataForEmail(subdomain);
  
  const brandName = themeData?.name || 'OutBank';
  const logoUrl = themeData?.imageUrl || '';

  const logoBlock = logoUrl ? `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="left" style="padding-bottom: 30px;">
          <div style="width: 128px; height: 128px; background-color: #000000; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
            <img src="${logoUrl}" alt="Logo" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;" />
          </div>
        </td>
      </tr>
    </table>` : '';

  const resend = getResend();
  await resend.emails.send({
    from: `${brandName} <noreply@consolle.one>`,
    to,
    subject: `Redefinição de senha - ${brandName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Redefinir Senha - ${brandName}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table width="100%" style="max-width: 600px;" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background-color: #ffffff; border-radius: 16px; padding: 40px;">
                      ${logoBlock}
                      <h1 style="font-size: 32px; font-weight: bold; color: #1a1a1a; margin: 0 0 24px 0; line-height: 1.2; text-align: left;">
                        Redefinir sua senha
                      </h1>
                      <div style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: left;">
                        <p style="margin: 0 0 8px 0;">Recebemos uma solicitação para redefinir a senha da sua conta no ${brandName}.</p>
                        <p style="margin: 0 0 8px 0;">Clique no botão abaixo para criar uma nova senha:</p>
                      </div>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                        <tr>
                          <td align="left">
                            <a href="${resetUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; text-decoration: none;">
                              Redefinir Senha
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="color: #999999; font-size: 14px; margin: 0 0 24px 0; text-align: left;">
                        Este link expira em <strong style="color: #666666;">1 hora</strong>.
                      </p>
                      <div style="background-color: #f8f9fa; border-left: 4px solid #000000; padding: 16px; margin: 32px 0; border-radius: 4px;">
                        <p style="color: #666666; font-size: 14px; margin: 0; text-align: left;">
                          <strong>Importante:</strong> Se você não solicitou essa alteração, ignore este email. Sua senha permanecerá a mesma.
                        </p>
                      </div>
                      <div style="margin-top: 40px; text-align: left;">
                        <p style="color: #1a1a1a; font-size: 16px; margin: 0;">Atenciosamente,</p>
                        <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 4px 0 0 0;">Equipe ${brandName}</p>
                      </div>
                    </td>
                  </tr>
                </table>
                <table width="100%" style="max-width: 600px; margin-top: 30px;" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <p style="color: #888888; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} ${brandName}. Todos os direitos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });

  console.log(`[sendPasswordResetEmail] Email enviado para ${to}`);
  return { success: true };
}
