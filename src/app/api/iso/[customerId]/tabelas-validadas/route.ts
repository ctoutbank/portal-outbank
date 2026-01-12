import { NextRequest, NextResponse } from 'next/server';
import { isoMarginsRepository } from '@/lib/db/iso-margins';
import { getCurrentUser } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/permissions/check-permissions';
import { sql } from '@vercel/postgres';

async function hasIsoAccess(userId: number, customerId: number): Promise<boolean> {
  const { rows } = await sql.query(`
    SELECT 1 FROM users u
    WHERE u.id = $1 AND (
      u.id_customer = $2
      OR EXISTS (
        SELECT 1 FROM user_customers uc 
        WHERE uc.id_user = $1 AND uc.id_customer = $2 AND uc.active = true
      )
      OR EXISTS (
        SELECT 1 FROM admin_customers ac 
        WHERE ac.user_id = $1 AND ac.customer_id = $2 AND ac.active = true
      )
    )
    LIMIT 1
  `, [userId, customerId]);
  
  return rows.length > 0;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { customerId } = await params;
    const customerIdNum = parseInt(customerId);

    if (isNaN(customerIdNum)) {
      return NextResponse.json({ error: 'ID do ISO inválido' }, { status: 400 });
    }

    const superAdmin = await isSuperAdmin();
    
    if (!superAdmin) {
      const hasAccess = await hasIsoAccess(user.id, customerIdNum);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Você não tem acesso a este ISO' }, { status: 403 });
      }
    }

    const url = new URL(request.url);
    const format = url.searchParams.get('format');

    if (format === 'structured') {
      const tables = await isoMarginsRepository.getValidatedTablesStructured(customerIdNum);
      return NextResponse.json({ 
        success: true,
        format: 'structured',
        count: tables.length,
        tables
      });
    }

    const tables = await isoMarginsRepository.getValidatedTablesForIso(customerIdNum);

    return NextResponse.json({ 
      success: true,
      format: 'flat',
      count: tables.length,
      tables
    });

  } catch (error: any) {
    console.error('Erro ao buscar tabelas validadas:', error);
    return NextResponse.json({ error: 'Erro ao buscar tabelas validadas' }, { status: 500 });
  }
}
