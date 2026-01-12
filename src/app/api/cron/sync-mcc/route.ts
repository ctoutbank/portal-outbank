import { NextRequest, NextResponse } from "next/server";
import { syncMccFromDock } from "@/features/mcc/server/integrations/dock/sync-mcc/main";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar secret do Vercel Cron
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[CRON MCC] CRON_SECRET não configurado");
      return NextResponse.json(
        { error: "Configuração de cron não encontrada" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[CRON MCC] Tentativa de acesso não autorizada");
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Executar sincronização
    console.log("[CRON MCC] Iniciando sincronização automática de MCCs...");
    const startTime = Date.now();
    
    const result = await syncMccFromDock();
    
    const duration = Date.now() - startTime;
    console.log(`[CRON MCC] Sincronização concluída em ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: "Sincronização automática de MCCs concluída com sucesso",
      duration: `${duration}ms`,
      stats: result,
    });
  } catch (error: any) {
    console.error("[CRON MCC] Erro ao sincronizar MCCs:", error);
    return NextResponse.json(
      {
        error: "Erro ao sincronizar MCCs",
        message: error?.message || "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

