import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getUserMarginsBreakdown } from '@/lib/db/margin-calculator';

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    let userId: number;

    if (process.env.DEV_BYPASS_AUTH === 'true') {
      userId = 1;
    } else {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth_token')?.value;
      
      if (!token) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }

      const payload = await verifyToken(token);
      if (!payload || !payload.id) {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
      }
      userId = payload.id;
    }

    const breakdown = await getUserMarginsBreakdown(userId);

    return NextResponse.json({ breakdown });

  } catch (error: any) {
    console.error('Erro ao buscar breakdown de margens:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar margens do usuário' 
    }, { status: 500 });
  }
}
