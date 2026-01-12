import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getMdrVersionHistory } from '@/lib/db/mdr-versioning';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mdrId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { mdrId } = await params;
    const versions = await getMdrVersionHistory(mdrId);

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Erro ao buscar versões:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
