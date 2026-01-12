import { NextRequest, NextResponse } from 'next/server';
import { processExpiringContracts } from '@/lib/db/mdr-versioning';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET não configurado');
      return NextResponse.json({ error: 'Configuração de segurança ausente' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const result = await processExpiringContracts();

    return NextResponse.json({
      success: true,
      message: 'Verificação de contratos concluída',
      result: {
        notificados30dias: result.notified30d,
        notificados7dias: result.notified7d,
        renovadosAutomaticamente: result.autoRenewed
      }
    });
  } catch (error) {
    console.error('Erro ao verificar contratos:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
