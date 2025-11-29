import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUserInfo, isSuperAdmin, isAdminOrSuperAdmin } from "@/lib/permissions/check-permissions";
import { syncMerchant } from "@/features/pricingSolicitation/server/integrations/dock/sync-merchant/main";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Verificar permissões (apenas Super Admin ou Admin)
    const hasPermission = await isAdminOrSuperAdmin();
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem sincronizar estabelecimentos." },
        { status: 403 }
      );
    }

    // Executar sincronização
    console.log("[API] Iniciando sincronização manual de estabelecimentos...");
    await syncMerchant();
    console.log("[API] Sincronização concluída com sucesso");

    return NextResponse.json({
      success: true,
      message: "Sincronização de estabelecimentos concluída com sucesso",
    });
  } catch (error: any) {
    console.error("[API] Erro ao sincronizar estabelecimentos:", error);
    return NextResponse.json(
      {
        error: "Erro ao sincronizar estabelecimentos",
        message: error?.message || "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}


