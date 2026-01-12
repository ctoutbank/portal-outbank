import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminOrSuperAdmin } from "@/lib/permissions/check-permissions";
import { syncMerchant } from "@/features/pricingSolicitation/server/integrations/dock/sync-merchant/main";

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  try {
    // Verificar autenticação
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
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




