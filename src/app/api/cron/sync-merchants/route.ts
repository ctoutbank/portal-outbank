import { NextRequest, NextResponse } from "next/server";
import { syncMerchant } from "@/features/pricingSolicitation/server/integrations/dock/sync-merchant/main";

export async function GET(request: NextRequest) {
  try {
    // Verificar secret do Vercel Cron
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[CRON] CRON_SECRET não configurado");
      return NextResponse.json(
        { error: "Configuração de cron não encontrada" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[CRON] Tentativa de acesso não autorizada");
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Executar sincronização
    console.log("[CRON] Iniciando sincronização automática de estabelecimentos...");
    const startTime = Date.now();
    
    await syncMerchant();
    
    const duration = Date.now() - startTime;
    console.log(`[CRON] Sincronização concluída em ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: "Sincronização automática concluída com sucesso",
      duration: `${duration}ms`,
    });
  } catch (error: any) {
    console.error("[CRON] Erro ao sincronizar estabelecimentos:", error);
    return NextResponse.json(
      {
        error: "Erro ao sincronizar estabelecimentos",
        message: error?.message || "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}




