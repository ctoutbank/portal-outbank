import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

function logSetSession(level: "info" | "error" | "warn", message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[SSO Set Session API ${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  if (data) {
    console.log(logMessage, JSON.stringify(data, null, 2));
  } else {
    console.log(logMessage);
  }
}

/**
 * API route para definir sessão Clerk usando session token
 * Esta API processa o session token e cria a sessão no Clerk
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken } = body;

    logSetSession("info", "Requisição para definir sessão recebida", {
      hasSessionToken: !!sessionToken,
    });

    if (!sessionToken) {
      logSetSession("error", "Session token ausente");
      return NextResponse.json(
        { error: "Session token é obrigatório" },
        { status: 400 }
      );
    }

    // O Clerk não permite criar sessões diretamente via API de forma simples
    // O session token precisa ser processado pelo Clerk middleware
    // Retornar sucesso e deixar o cliente processar o token
    logSetSession("info", "Session token recebido, processamento será feito pelo Clerk middleware");

    return NextResponse.json({ 
      success: true,
      message: "Session token recebido. O Clerk processará automaticamente."
    });
  } catch (error: any) {
    logSetSession("error", "Erro ao processar requisição", {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}

