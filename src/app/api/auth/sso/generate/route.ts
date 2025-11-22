import { NextRequest, NextResponse } from "next/server";
import { generateSSOToken } from "@/lib/auth/sso-handler";
import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, customerId } = body;

    if (!userId || !customerId) {
      return NextResponse.json(
        { error: "userId e customerId são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o usuário atual tem acesso
    const userInfo = await getCurrentUserInfo();
    if (!userInfo) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Verificar se o userId corresponde ao usuário logado
    if (userInfo.id !== userId) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      );
    }

    // Gerar token SSO
    const token = await generateSSOToken(userId, customerId);

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error("Erro ao gerar token SSO:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar token SSO" },
      { status: 500 }
    );
  }
}




