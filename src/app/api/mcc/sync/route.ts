import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAdminOrSuperAdmin } from "@/lib/permissions/check-permissions";
import { syncMccFromDock } from "@/features/mcc/server/integrations/dock/sync-mcc/main";

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
        { error: "Acesso negado. Apenas administradores podem sincronizar MCCs." },
        { status: 403 }
      );
    }

    // Executar sincronização
    console.log("[API] Iniciando sincronização manual de MCCs...");
    const result = await syncMccFromDock();
    console.log("[API] Sincronização concluída com sucesso");

    return NextResponse.json({
      success: true,
      message: "Sincronização de MCCs concluída com sucesso",
      stats: result,
    });
  } catch (error: any) {
    console.error("[API] Erro ao sincronizar MCCs:", error);
    
    // Mensagem de erro mais específica
    let errorMessage = error?.message || "Erro desconhecido";
    
    // Verificar se é erro de configuração
    if (errorMessage.includes("não configurado") || errorMessage.includes("desabilitada")) {
      errorMessage = `Configuração: ${errorMessage}`;
    }
    
    // Verificar se é erro de API
    if (errorMessage.includes("Dock") || errorMessage.includes("API")) {
      errorMessage = `Erro na API da Dock: ${errorMessage}`;
    }
    
    return NextResponse.json(
      {
        error: "Erro ao sincronizar MCCs",
        message: errorMessage,
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}

