import { resend } from "@/lib/resend";

export async function sendWelcomePasswordEmail(to: string, password: string) {
    await resend.emails.send({
        from: "noreply@outbank.cloud",
        to,
        subject: "Sua senha de acesso ao Outbank",
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bem-vindo ao Outbank</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #2c2c2c !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100vh;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #2c2c2c; min-height: 100vh; padding: 40px 0;">
                <tr>
                    <td align="center" style="padding: 20px;">
                        <div style="background-color: #ffffff; border-radius: 0; padding: 48px 40px; max-width: 500px; width: 100%; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);">
                            
                            <!-- Logo Section - Rectangle with circle inside, aligned left -->
                            <div style="margin-bottom: 32px;">
                                <div style="display: inline-block; width: 120px; height: 80px; background-color: #000000; position: relative;">
                                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background-color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                        <span style="color: black; font-size: 18px; font-weight: bold;">O</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Main Title - Left aligned -->
                            <h1 style="color: #333333; font-size: 32px; font-weight: 600; margin: 0 0 24px 0; line-height: 1.2; text-align: left;">
                                Bem-vindo ao Outbank.
                            </h1>
                            
                            <!-- Welcome Message - Left aligned, black text -->
                            <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 24px 0; text-align: left;">
                                Sua conta foi criada com sucesso! Estamos felizes em tê-lo conosco.
                            </p>
                            
                            <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 32px 0; text-align: left;">
                                Esperamos que tudo esteja conforme esperado, mas se precisar de ajuda, você pode entrar em contato conosco através do nosso atendimento ao cliente.
                            </p>
                            
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
                                    Equipe Outbank
                                </p>
                            </div>
                        </div>
                        
                        <!-- Footer -->
                        <div style="text-align: center; padding: 20px 0; color: #888888;">
                            <p style="font-size: 12px; margin: 0;">
                                © 2024 Outbank. Todos os direitos reservados.
                            </p>
                        </div>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `,
    });
}