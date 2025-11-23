import { NextRequest, NextResponse } from "next/server";
import { validateSSOToken } from "@/lib/auth/sso-handler";
import { db } from "@/lib/db";
import { users } from "@/lib/db";
import { eq } from "drizzle-orm";

function logAuth(level: "info" | "error" | "warn", message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[SSO Auth API ${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  if (data) {
    console.log(logMessage, JSON.stringify(data, null, 2));
  } else {
    console.log(logMessage);
  }
}

/**
 * API route para autenticação automática via SSO
 * Cria uma sessão Clerk automaticamente usando o token SSO
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    logAuth("info", "Requisição de autenticação automática recebida", {
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 8) + "..." : null,
    });

    if (!token) {
      logAuth("error", "Token SSO ausente");
      return NextResponse.json(
        { error: "Token SSO é obrigatório" },
        { status: 400 }
      );
    }

    // Validar token SSO
    logAuth("info", "Validando token SSO");
    const tokenData = await validateSSOToken(token);

    if (!tokenData) {
      logAuth("error", "Token SSO inválido ou expirado");
      return NextResponse.json(
        { error: "Token SSO inválido ou expirado" },
        { status: 401 }
      );
    }

    logAuth("info", "Token SSO validado", {
      userId: tokenData.userId,
      customerId: tokenData.customerId,
    });

    // Buscar usuário no banco
    const user = await db
      .select({
        id: users.id,
        idClerk: users.idClerk,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, tokenData.userId))
      .limit(1);

    if (!user || user.length === 0 || !user[0].idClerk) {
      logAuth("error", "Usuário não encontrado no banco", {
        userId: tokenData.userId,
      });
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    logAuth("info", "Usuário encontrado", {
      userId: user[0].id,
      idClerk: user[0].idClerk,
      email: user[0].email,
    });

    // Para autenticação automática, vamos redirecionar para sign-in com o token SSO preservado
    // O Clerk não permite criar sessões diretamente via API sem autenticação prévia
    // A solução é redirecionar para sign-in com redirect_url contendo o token SSO
    // Após o login, o callback SSO processará o token e redirecionará para o dashboard
    try {
      const protocol = request.headers.get("x-forwarded-proto") || "https";
      const hostname = request.headers.get("host") || "";
      const callbackUrl = `${protocol}://${hostname}/auth/sso/callback?token=${token}`;
      const redirectUrl = encodeURIComponent(callbackUrl);
      
      logAuth("info", "Redirecionando para sign-in com token SSO preservado", {
        callbackUrl,
      });
      
      // Redirecionar para sign-in com o callback SSO como redirect_url
      // Isso permite que após o login, o usuário seja redirecionado para o callback SSO
      // que então processará o token e redirecionará para o dashboard
      return NextResponse.redirect(`${protocol}://${hostname}/auth/sign-in?redirect_url=${redirectUrl}`);
    } catch (error: any) {
      logAuth("error", "Erro ao processar autenticação", {
        error: error.message,
        stack: error.stack,
      });
      return NextResponse.json(
        { error: "Erro ao processar autenticação automática" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logAuth("error", "Erro ao processar autenticação automática", {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Erro ao processar autenticação automática" },
      { status: 500 }
    );
  }
}

