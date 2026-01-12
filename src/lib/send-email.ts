import { getResend } from "./resend";

const EMAIL_FROM = "Consolle <noreply@consolle.one>";
const PORTAL_LOGO = "https://file-upload-outbank.s3.amazonaws.com/LUmLuBIG.jpg";
const PORTAL_NAME = "Admin Consolle";
const PORTAL_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.consolle.one";

export async function sendWelcomePasswordEmail(
  to: string,
  password: string,
  logo: string,
  customerName: string,
  link?: string
) {
  try {
    // Validação básica de email
    if (!to || !to.includes('@')) {
      throw new Error(`Email inválido: ${to}`);
    }
    
    console.log(`[sendWelcomePasswordEmail] 📧 Iniciando envio de email`, {
      to,
      from: EMAIL_FROM,
      customerName,
      hasLogo: !!logo,
      hasLink: !!link,
      senhaTamanho: password.length,
      senhaPreview: password.substring(0, 2) + '***' + password.substring(password.length - 2),
    });
    
    // Garantir que a logo use HTTPS e URL absoluta
    let logoUrl = logo.startsWith('http') ? logo : `https://${logo.replace(/^\/\//, '')}`;
    
    // ✅ Validar URL da logo antes de usar (prevenir emails marcados como spam)
    try {
      const parsedUrl = new URL(logoUrl);
      if (parsedUrl.protocol !== 'https:') {
        console.warn(`[sendWelcomePasswordEmail] ⚠️ Logo URL não usa HTTPS, usando fallback: ${logoUrl}`);
        logoUrl = "https://file-upload-outbank.s3.amazonaws.com/LUmLuBIG.jpg";
      }
      // Verificar se é um domínio S3 válido
      if (!parsedUrl.hostname.includes('s3') && !parsedUrl.hostname.includes('amazonaws')) {
        console.warn(`[sendWelcomePasswordEmail] ⚠️ Logo URL não é de S3, usando fallback: ${logoUrl}`);
        logoUrl = "https://file-upload-outbank.s3.amazonaws.com/LUmLuBIG.jpg";
      }
    } catch (urlError) {
      console.warn(`[sendWelcomePasswordEmail] ⚠️ Logo URL inválida, usando fallback: ${logoUrl}`, urlError);
      logoUrl = "https://file-upload-outbank.s3.amazonaws.com/LUmLuBIG.jpg";
    }
    
    // Versão texto do email (importante para deliverability)
    const textVersion = `
Bem-vindo!

Sua conta foi criada com sucesso! Estamos felizes em tê-lo conosco.

Esperamos que tudo esteja conforme esperado, mas se precisar de ajuda, você pode entrar em contato conosco através do nosso atendimento ao cliente.

${link ? `Acesse o sistema em: ${link}/auth/sign-in\n` : ''}
Sua senha temporária de acesso: ${password}

Você poderá alterá-la no primeiro login.

Se não foi você quem fez esse cadastro, ignore este e-mail.

Atenciosamente,
Equipe ${customerName}

© Todos os direitos reservados.
    `.trim();
    
    const emailData = {
      from: EMAIL_FROM,
      to,
      subject: "Credenciais de acesso: "+customerName,
      text: textVersion,
      headers: {
        'X-Entity-Ref-ID': `welcome-${Date.now()}`,
      },
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <meta name="format-detection" content="telephone=no">
            <title>Bem-vindo ao ${customerName}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #e5e5e5 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100vh;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e5e5e5; min-height: 100vh; padding: 40px 0;">
                <tr>
                    <td align="center" style="padding: 20px;">
                        <div style="background-color: #ffffff; border-radius: 0; padding: 48px 40px; max-width: 500px; width: 100%; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);">
                            
                            <!-- Logo Section - Using img tag with alt text for better deliverability -->
                            <div style="margin-bottom: 32px;">
                                <img src="${logoUrl}" alt="${customerName} Logo" width="120" height="120" style="display: block; max-width: 120px; height: auto; border: 0; outline: none; text-decoration: none;" />
                            </div>
                            
                            <!-- Main Title - Left aligned -->
                            <h1 style="color: #333333; font-size: 29px; font-weight: 600; margin: 0 0 24px 0; line-height: 1.2; text-align: left;">
                                Bem-vindo!
                            </h1>
                            
                            <!-- Welcome Message - Left aligned, black text -->
                            <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 24px 0; text-align: left;">
                                Sua conta foi criada com sucesso! Estamos felizes em tê-lo conosco.
                            </p>
                        
                            
                            <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 32px 0; text-align: left;">
                                Esperamos que tudo esteja conforme esperado, mas se precisar de ajuda, você pode entrar em contato conosco através do nosso atendimento ao cliente.
                            </p>
                                ${
                                  link
                                    ? `<p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 24px 0; text-align: left;">
                                Acesse o sistema clicando <a href="${link + "/auth/sign-in"}" style="color: #0066cc; text-decoration: underline;" target="_blank">aqui</a>.
                            </p>`
                                    : ""
                                }
                            <!-- Password Section -->
                            <div style="margin: 32px 0;">
                                <p style="color: #333333; font-size: 16px; margin: 0 0 12px 0; font-weight: 600; text-align: left;">
                                    Sua senha temporária de acesso:
                                </p>
                                <div style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; margin: 16px 0;">
                                    <code style="font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #333333; letter-spacing: 1px;">
                                        ${password}
                                    </code>
                                </div>
                                <p style="color: #333333; font-size: 14px; margin: 12px 0 0 0; text-align: left;">
                                    Você poderá alterá-la no primeiro login.
                                </p>
                            </div>
                            
                            <!-- Security Notice -->
                            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 16px; margin: 24px 0;">
                                <p style="color: #856404; font-size: 14px; margin: 0; text-align: left;">
                                    Se não foi você quem fez esse cadastro, ignore este e-mail.
                                </p>
                            </div>
                            
                            <!-- Signature - Left aligned -->
                            <div style="margin-top: 40px; text-align: left;">
                                <p style="color: #333333; font-size: 16px; margin: 0;">
                                    Atenciosamente,
                                </p>
                                <p style="color: #333333; font-size: 16px; font-weight: 600; margin: 4px 0 0 0;">
                                    Equipe ${customerName}
                                </p>
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div style="text-align: center; padding: 20px 0; color: #888888;">
                            <p style="font-size: 12px; margin: 0;">
                                © Todos os direitos reservados.
                            </p>
                        </div>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `,
    };
    
    console.log(`[sendWelcomePasswordEmail] 📤 Enviando email via Resend...`);
    const result = await getResend().emails.send(emailData);
    
    // Log detalhado da resposta do Resend
    console.log(`[sendWelcomePasswordEmail] 📦 Resposta completa do Resend:`, JSON.stringify(result, null, 2));
    
    // Verificar se houve erro na resposta
    const resultAny = result as any;
    if (resultAny?.error) {
      console.error(`[sendWelcomePasswordEmail] ❌ Erro retornado pelo Resend:`, {
        error: resultAny.error,
        message: resultAny.error?.message,
        name: resultAny.error?.name,
      });
      throw new Error(`Resend error: ${resultAny.error?.message || JSON.stringify(resultAny.error)}`);
    }
    
    const emailId = resultAny?.id || resultAny?.data?.id || null;
    
    if (!emailId) {
      console.warn(`[sendWelcomePasswordEmail] ⚠️ Email enviado mas sem ID retornado. Resposta:`, result);
    }
    
    console.log(`[sendWelcomePasswordEmail] ✅ Email enviado com sucesso para ${to}`, {
      emailId: emailId || 'sem-id',
      from: EMAIL_FROM,
      to,
      subject: emailData.subject,
    });
    
    return { success: true, emailId };
  } catch (error: any) {
    console.error(`[sendWelcomePasswordEmail] ❌ Falha ao enviar email para ${to}:`, {
      message: error?.message || error,
      code: error?.code,
      statusCode: error?.statusCode,
      response: error?.response,
      name: error?.name,
    });
    throw error;
  }
}

/**
 * Envia email de boas-vindas para usuários do Portal-Outbank (Admin Consolle)
 * O texto "Bem-vindo ao Admin Consolle" aparece em fonte menor que o título principal
 */
export async function sendWelcomePasswordEmailPortal(
  to: string,
  password: string,
  userName?: string
) {
  try {
    // Validação básica de email
    if (!to || !to.includes('@')) {
      throw new Error(`Email inválido: ${to}`);
    }
    
    console.log(`[sendWelcomePasswordEmailPortal] 📧 Iniciando envio de email`, {
      to,
      from: EMAIL_FROM,
      userName: userName || 'Novo Usuário',
      senhaTamanho: password.length,
      senhaPreview: password.substring(0, 2) + '***' + password.substring(password.length - 2),
    });
    
    // Versão texto do email
    const textVersion = `
Bem-vindo ao ${PORTAL_NAME}!

${userName ? `Olá ${userName},\n\n` : ''}Sua conta foi criada com sucesso no ${PORTAL_NAME}. Estamos felizes em tê-lo conosco.

O ${PORTAL_NAME} é a plataforma de gerenciamento e administração da Outbank, onde você terá acesso à gestão de ISOs e ao suporte operacional e técnico.

Acesse o sistema em: ${PORTAL_URL}/sign-in
Sua senha temporária de acesso: ${password}

Você poderá alterá-la no primeiro login.

Se não foi você quem fez esse cadastro, ignore este e-mail.

Atenciosamente,
Equipe Outbank

© Todos os direitos reservados.
    `.trim();
    
    const emailData = {
      from: EMAIL_FROM,
      to,
      subject: `Bem-vindo ao ${PORTAL_NAME} - Suas credenciais de acesso`,
      text: textVersion,
      headers: {
        'X-Entity-Ref-ID': `portal-welcome-${Date.now()}`,
      },
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <meta name="format-detection" content="telephone=no">
            <title>Bem-vindo ao ${PORTAL_NAME}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #e5e5e5 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100vh;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e5e5e5; min-height: 100vh; padding: 40px 0;">
                <tr>
                    <td align="center" style="padding: 20px;">
                        <div style="background-color: #ffffff; border-radius: 8px; padding: 48px 40px; max-width: 500px; width: 100%; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);">
                            
                            <!-- Logo Section -->
                            <div style="margin-bottom: 24px; text-align: center;">
                                <img src="${PORTAL_LOGO}" alt="Outbank Logo" width="100" height="100" style="display: inline-block; max-width: 100px; height: auto; border: 0; outline: none; text-decoration: none; border-radius: 8px;" />
                            </div>
                            
                            <!-- Main Title -->
                            <h1 style="color: #333333; font-size: 31px; font-weight: 700; margin: 0 0 8px 0; line-height: 1.2; text-align: center;">
                                Bem-vindo!
                            </h1>
                            
                            <!-- Subtitle - Admin Consolle (smaller font) -->
                            <p style="color: #666666; font-size: 14px; font-weight: 500; margin: 0 0 32px 0; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
                                ao ${PORTAL_NAME}
                            </p>
                            
                            ${userName ? `
                            <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0; text-align: left;">
                                Olá <strong>${userName}</strong>,
                            </p>
                            ` : ''}
                            
                            <!-- Welcome Message -->
                            <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0; text-align: left;">
                                Sua conta foi criada com sucesso! Estamos felizes em tê-lo em nossa equipe.
                            </p>
                            
                            <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 24px 0; text-align: left;">
                                O <strong>${PORTAL_NAME}</strong> é a plataforma de gerenciamento e administração da Outbank, onde você terá acesso à gestão de ISOs e ao suporte operacional e técnico.
                            </p>
                            
                            <!-- Access Link -->
                            <div style="text-align: center; margin: 24px 0;">
                                <a href="${PORTAL_URL}/sign-in" 
                                   style="display: inline-block; background-color: #333333; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;"
                                   target="_blank">
                                    Acessar o Sistema
                                </a>
                            </div>
                            
                            <!-- Password Section -->
                            <div style="margin: 32px 0;">
                                <p style="color: #333333; font-size: 16px; margin: 0 0 12px 0; font-weight: 600; text-align: left;">
                                    Sua senha temporária de acesso:
                                </p>
                                <div style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; margin: 16px 0;">
                                    <code style="font-family: 'Courier New', monospace; font-size: 20px; font-weight: bold; color: #333333; letter-spacing: 2px;">
                                        ${password}
                                    </code>
                                </div>
                                <p style="color: #666666; font-size: 14px; margin: 12px 0 0 0; text-align: center;">
                                    Você poderá alterá-la no primeiro login.
                                </p>
                            </div>
                            
                            <!-- Security Notice -->
                            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 16px; margin: 24px 0;">
                                <p style="color: #856404; font-size: 14px; margin: 0; text-align: left;">
                                    ⚠️ Se não foi você quem fez esse cadastro, ignore este e-mail.
                                </p>
                            </div>
                            
                            <!-- Signature -->
                            <div style="margin-top: 40px; text-align: left; border-top: 1px solid #e9ecef; padding-top: 24px;">
                                <p style="color: #333333; font-size: 16px; margin: 0;">
                                    Atenciosamente,
                                </p>
                                <p style="color: #333333; font-size: 16px; font-weight: 600; margin: 4px 0 0 0;">
                                    Equipe Outbank
                                </p>
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div style="text-align: center; padding: 20px 0; color: #888888;">
                            <p style="font-size: 12px; margin: 0;">
                                © Outbank - Todos os direitos reservados.
                            </p>
                        </div>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `,
    };
    
    console.log(`[sendWelcomePasswordEmailPortal] 📤 Enviando email via Resend...`);
    const result = await getResend().emails.send(emailData);
    const resultAny = result as any;
    const emailId = resultAny?.id || resultAny?.data?.id || null;
    console.log(`[sendWelcomePasswordEmailPortal] ✅ Email sent successfully to ${to}`, {
      emailId: emailId || 'sent',
      from: EMAIL_FROM,
      to,
    });
    
    return { success: true, emailId };
  } catch (error: any) {
    console.error(`[sendWelcomePasswordEmailPortal] ❌ Failed to send email to ${to}:`, {
      message: error?.message || error,
      code: error?.code,
      statusCode: error?.statusCode,
      response: error?.response,
      stack: error?.stack,
    });
    throw error;
  }
}

/**
 * Envia email informativo quando ISO Admin é promovido para acesso ao Portal (CORE ou EXECUTIVO)
 * Não envia credenciais - apenas informa sobre o novo acesso
 */
export async function sendPortalPromotionEmail(
  to: string,
  userName: string,
  newCategory: 'CORE' | 'EXECUTIVO'
) {
  try {
    if (!to || !to.includes('@')) {
      throw new Error(`Email inválido: ${to}`);
    }
    
    console.log(`[sendPortalPromotionEmail] 📧 Enviando email de promoção`, {
      to,
      userName,
      newCategory,
    });
    
    const categoryLabel = newCategory === 'CORE' ? 'Core' : 'Executivo';
    const categoryDescription = newCategory === 'CORE' 
      ? 'Você agora pode visualizar e configurar suas margens de comissão no Portal.'
      : 'Você agora pode visualizar suas margens de comissão no Portal.';
    
    const textVersion = `
Olá ${userName},

Boa notícia! Você agora tem acesso ao ${PORTAL_NAME}.

Sua categoria foi atualizada para: ${categoryLabel}

${categoryDescription}

Acesse o Portal em: ${PORTAL_URL}/sign-in
Use as mesmas credenciais que você já utiliza para acessar o Tenant do ISO.

Se tiver dúvidas, entre em contato com o administrador.

Atenciosamente,
Equipe Outbank

© Todos os direitos reservados.
    `.trim();
    
    const emailData = {
      from: EMAIL_FROM,
      to,
      subject: `${PORTAL_NAME} - Novo acesso liberado`,
      text: textVersion,
      headers: {
        'X-Entity-Ref-ID': `portal-promotion-${Date.now()}`,
      },
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>Novo acesso ao ${PORTAL_NAME}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #e5e5e5 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100vh;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e5e5e5; min-height: 100vh; padding: 40px 0;">
                <tr>
                    <td align="center" style="padding: 20px;">
                        <div style="background-color: #ffffff; border-radius: 0; padding: 48px 40px; max-width: 500px; width: 100%; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);">
                            
                            <div style="margin-bottom: 32px;">
                                <img src="${PORTAL_LOGO}" alt="${PORTAL_NAME} Logo" width="120" height="120" style="display: block; max-width: 120px; height: auto; border: 0;" />
                            </div>
                            
                            <h1 style="color: #333333; font-size: 26px; font-weight: 600; margin: 0 0 24px 0; line-height: 1.2; text-align: left;">
                                Novo acesso liberado!
                            </h1>
                            
                            <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 16px 0; text-align: left;">
                                Olá <strong>${userName}</strong>,
                            </p>
                            
                            <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 24px 0; text-align: left;">
                                Boa notícia! Você agora tem acesso ao <strong>${PORTAL_NAME}</strong>.
                            </p>
                            
                            <div style="background-color: #f5f5f5; border-left: 4px solid #0066cc; padding: 16px; margin: 24px 0;">
                                <p style="color: #333333; font-size: 14px; margin: 0 0 8px 0; text-align: left;">
                                    <strong>Sua nova categoria:</strong>
                                </p>
                                <p style="color: #0066cc; font-size: 20px; font-weight: 600; margin: 0; text-align: left;">
                                    ${categoryLabel}
                                </p>
                            </div>
                            
                            <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 24px 0; text-align: left;">
                                ${categoryDescription}
                            </p>
                            
                            <div style="margin: 32px 0; text-align: center;">
                                <a href="${PORTAL_URL}/sign-in" style="display: inline-block; background-color: #0066cc; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 16px;">
                                    Acessar o Portal
                                </a>
                            </div>
                            
                            <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 24px 0 0 0; text-align: left; border-top: 1px solid #eee; padding-top: 24px;">
                                Use as mesmas credenciais que você já utiliza para acessar o Tenant do ISO.
                            </p>
                            
                            <p style="color: #999999; font-size: 12px; margin: 32px 0 0 0; text-align: center;">
                                © Outbank - Todos os direitos reservados.
                            </p>
                        </div>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `,
    };
    
    console.log(`[sendPortalPromotionEmail] 📤 Enviando email via Resend...`);
    const result = await getResend().emails.send(emailData);
    const resultAny = result as any;
    const emailId = resultAny?.id || resultAny?.data?.id || null;
    console.log(`[sendPortalPromotionEmail] ✅ Email enviado com sucesso para ${to}`, {
      emailId: emailId || 'sent',
    });
    
    return { success: true, emailId };
  } catch (error: any) {
    console.error(`[sendPortalPromotionEmail] ❌ Falha ao enviar email para ${to}:`, {
      message: error?.message || error,
      code: error?.code,
    });
    throw error;
  }
}
