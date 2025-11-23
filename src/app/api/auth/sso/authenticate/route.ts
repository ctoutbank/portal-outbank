import { NextRequest, NextResponse } from "next/server";
import { validateSSOToken } from "@/lib/auth/sso-handler";
import { clerkClient } from "@clerk/nextjs/server";
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

    // Criar session token usando Clerk API
    try {
      const clerk = await clerkClient();
      
      // Criar session token para o usuário
      // Isso permite autenticação automática sem precisar fazer login
      const sessionToken = await clerk.users.createSessionToken(user[0].idClerk, {
        expiresInSeconds: 60 * 60 * 24 * 7, // 7 dias
      });

      logAuth("info", "Session token criado com sucesso", {
        userId: user[0].id,
        idClerk: user[0].idClerk,
      });

      // Obter hostname para construir URL de redirecionamento
      const hostname = request.headers.get("host") || "";
      const protocol = request.headers.get("x-forwarded-proto") || "https";
      
      // Criar resposta de redirecionamento para o callback SSO
      const redirectUrl = new URL("/auth/sso/callback", `${protocol}://${hostname}`);
      redirectUrl.searchParams.set("token", token);
      
      const response = NextResponse.redirect(redirectUrl.toString());
      
      // Tentar definir cookie de sessão do Clerk
      // O Clerk usa cookies específicos para autenticação
      // Nota: O Clerk gerencia seus próprios cookies, mas podemos tentar definir um cookie auxiliar
      // O session token será processado pela página de callback
      response.cookies.set("__clerk_session_token", sessionToken, {
        path: "/",
        httpOnly: true,
        secure: protocol === "https",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 dias
      });

      logAuth("info", "Cookie de sessão definido, redirecionando para callback");
      
      return response;
    } catch (error: any) {
      logAuth("error", "Erro ao criar session token", {
        error: error.message,
        stack: error.stack,
      });
      return NextResponse.json(
        { error: "Erro ao criar sessão automática" },
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

