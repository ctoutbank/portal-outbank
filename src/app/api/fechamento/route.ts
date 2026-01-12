import { NextRequest, NextResponse } from 'next/server';
import { getUserFechamentoData } from '@/lib/db/fechamento';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { shouldMaskSensitiveData, isSuperAdmin } from '@/lib/permissions/check-permissions';
import { sql } from '@vercel/postgres';

async function validateSimulatedUser(userId: number): Promise<boolean> {
  try {
    const { rows } = await sql`SELECT id, active FROM users WHERE id = ${userId} LIMIT 1`;
    return rows.length > 0 && rows[0].active !== false;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    let authenticatedUserId: number;

    if (process.env.DEV_BYPASS_AUTH === 'true') {
      authenticatedUserId = 1;
    } else {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth_token')?.value;
      
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const payload = await verifyToken(token);
      if (!payload || !payload.id) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      authenticatedUserId = payload.id;
    }

    const { searchParams } = new URL(request.url);
    
    let effectiveUserId = authenticatedUserId;
    const simulatedUserId = searchParams.get('simulatedUserId');
    
    if (simulatedUserId) {
      const isAdmin = await isSuperAdmin();
      if (isAdmin) {
        const simId = Number(simulatedUserId);
        if (isNaN(simId) || simId <= 0) {
          return NextResponse.json({ error: 'ID de usuário simulado inválido' }, { status: 400 });
        }
        const isValidUser = await validateSimulatedUser(simId);
        if (!isValidUser) {
          return NextResponse.json({ error: 'Usuário simulado não encontrado ou inativo' }, { status: 404 });
        }
        effectiveUserId = simId;
      }
    }
    
    const filters = {
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      customerId: searchParams.get('customerId') ? Number(searchParams.get('customerId')) : undefined,
      mcc: searchParams.get('mcc') || undefined,
      productType: searchParams.get('productType') || undefined,
      brand: searchParams.get('brand') || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : 20,
    };

    const data = await getUserFechamentoData(effectiveUserId, filters);
    
    const shouldMask = await shouldMaskSensitiveData();

    return NextResponse.json({ ...data, shouldMaskData: shouldMask });
  } catch (error) {
    console.error('Error fetching fechamento data:', error);
    return NextResponse.json({ error: 'Failed to fetch fechamento data' }, { status: 500 });
  }
}
