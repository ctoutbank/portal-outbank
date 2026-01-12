import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getCurrentUserInfo, isSuperAdmin, getUserMultiIsoAccess } from '@/lib/permissions/check-permissions';

async function checkUserAccess(customerId: number): Promise<boolean> {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo) return false;

  const superAdmin = await isSuperAdmin();
  if (superAdmin) return true;

  const userIsos = await getUserMultiIsoAccess(userInfo.id);
  return userIsos.includes(customerId);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');
  const fornecedorCategoryId = searchParams.get('fornecedorCategoryId');
  const bandeira = searchParams.get('bandeira');
  const produto = searchParams.get('produto');
  const canal = searchParams.get('canal') || 'pos';

  if (!customerId || !fornecedorCategoryId || !bandeira || !produto) {
    return NextResponse.json({ error: 'Parâmetros incompletos' }, { status: 400 });
  }

  const userInfo = await getCurrentUserInfo();
  if (!userInfo) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const hasAccess = await checkUserAccess(parseInt(customerId));
  if (!hasAccess) {
    return NextResponse.json({ error: 'Sem acesso a este ISO' }, { status: 403 });
  }

  const { rows } = await sql.query(`
    SELECT id, user_id, user_name, valor_anterior, valor_novo, acao, created_at
    FROM iso_mdr_override_history
    WHERE customer_id = $1 AND fornecedor_category_id = $2 AND bandeira = $3 AND produto = $4 AND canal = $5
    ORDER BY created_at DESC
    LIMIT 50
  `, [customerId, fornecedorCategoryId, bandeira, produto, canal]);

  return NextResponse.json(rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    valorAnterior: row.valor_anterior,
    valorNovo: row.valor_novo,
    acao: row.acao,
    createdAt: row.created_at
  })));
}
