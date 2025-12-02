import { NextRequest, NextResponse } from "next/server";
import { syncTransactions } from "@/features/pricingSolicitation/server/integrations/dock/sync-transactions/main";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    console.log("[CRON] Iniciando sincronização automática de transações...");
    const startTime = Date.now();
    
    await syncTransactions();
    
    const duration = Date.now() - startTime;
    console.log(`[CRON] Sincronização de transações concluída em ${duration}ms`);

    const successResponse = NextResponse.json({
      success: true,
      message: "Sincronização de transações concluída com sucesso",
      duration: `${duration}ms`,
    });
    
    successResponse.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    successResponse.headers.set("Pragma", "no-cache");
    successResponse.headers.set("Expires", "0");
    
    return successResponse;
  } catch (error: any) {
    console.error("[CRON] Erro ao sincronizar transações:", error);
    
    const errorResponse = NextResponse.json(
      {
        error: "Erro na sincronização de transações",
        message: error?.message || "Erro desconhecido",
      },
      { status: 500 }
    );
    
    errorResponse.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    errorResponse.headers.set("Pragma", "no-cache");
    errorResponse.headers.set("Expires", "0");
    
    return errorResponse;
  }
}

