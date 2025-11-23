import { NextRequest, NextResponse } from "next/server";
import { generateSSOToken } from "@/lib/auth/sso-handler";
import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";

function logAPI(level: "info" | "error" | "warn", message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[SSO API ${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  if (data) {
    console.log(logMessage, JSON.stringify(data, null, 2));
  } else {
    console.log(logMessage);
  }
}

export async function POST(request: NextRequest) {
  try {
    logAPI("info", "Recebida requisição para gerar token SSO");

    const body = await request.json();
    const { userId, customerId } = body;

    logAPI("info", "Dados recebidos", { userId, customerId });

    if (!userId || !customerId) {
      logAPI("warn", "Parâmetros obrigatórios ausentes", { userId, customerId });
      return NextResponse.json(
        { error: "userId e customerId são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o usuário atual tem acesso
    const userInfo = await getCurrentUserInfo();
    if (!userInfo) {
      logAPI("error", "Usuário não autenticado");
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    logAPI("info", "Informações do usuário obtidas", {
      currentUserId: userInfo.id,
      requestedUserId: userId,
      isSuperAdmin: userInfo.isSuperAdmin,
      isAdmin: userInfo.isAdmin,
      allowedCustomers: userInfo.allowedCustomers,
    });

    // Verificar se o userId corresponde ao usuário logado
    if (userInfo.id !== userId) {
      logAPI("warn", "Tentativa de gerar token para outro usuário", {
        currentUserId: userInfo.id,
        requestedUserId: userId,
      });
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      );
    }

    // Gerar token SSO
    logAPI("info", "Gerando token SSO", { userId, customerId });
    const token = await generateSSOToken(userId, customerId);

    logAPI("info", "Token SSO gerado com sucesso");
    return NextResponse.json({ token });
  } catch (error: any) {
    logAPI("error", "Erro ao gerar token SSO", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: error.message || "Erro ao gerar token SSO" },
      { status: 500 }
    );
  }
}




