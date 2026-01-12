import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getCurrentUserInfo, isSuperAdmin, getUserMultiIsoAccess } from '@/lib/permissions/check-permissions';

export const dynamic = 'force-dynamic';

async function checkUserAccess(customerId: number): Promise<{ user: any; hasAccess: boolean; canEdit: boolean; isSuperAdmin: boolean }> {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo) {
    return { user: null, hasAccess: false, canEdit: false, isSuperAdmin: false };
  }

  const superAdmin = await isSuperAdmin();
  if (superAdmin) {
    return { user: { ...userInfo, isSuperAdmin: true }, hasAccess: true, canEdit: true, isSuperAdmin: true };
  }

  const userIsos = await getUserMultiIsoAccess(userInfo.id);
  const hasAccess = userIsos.includes(customerId);
  
  const { rows } = await sql.query(`
    SELECT p.category_type 
    FROM users u 
    LEFT JOIN profiles p ON u.id_profile = p.id 
    WHERE u.id = $1
  `, [userInfo.id]);
  
  const categoryType = rows[0]?.category_type;
  const isCore = categoryType === 'CORE';
  
  const canEdit = hasAccess && isCore;
  
  return { 
    user: { ...userInfo, categoryType, isSuperAdmin: false }, 
    hasAccess, 
    canEdit,
    isSuperAdmin: false
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');
  const fornecedorCategoryId = searchParams.get('fornecedorCategoryId');

  if (!customerId) {
    return NextResponse.json({ error: 'customerId é obrigatório' }, { status: 400 });
  }

  const { user, hasAccess } = await checkUserAccess(parseInt(customerId));
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  if (!hasAccess) {
    return NextResponse.json({ error: 'Sem acesso a este ISO' }, { status: 403 });
  }

  let query = `
    SELECT id, customer_id, fornecedor_category_id, bandeira, produto, canal, 
           valor_original, valor_override, override_mode,
           margin_outbank_override, margin_executivo_override, margin_core_override,
           created_at, updated_at
    FROM iso_mdr_overrides
    WHERE customer_id = $1
  `;
  const params: any[] = [customerId];

  if (fornecedorCategoryId) {
    query += ` AND fornecedor_category_id = $2`;
    params.push(fornecedorCategoryId);
  }

  query += ` ORDER BY bandeira, produto, canal`;

  const { rows } = await sql.query(query, params);

  return NextResponse.json(rows.map(row => ({
    id: row.id,
    customerId: row.customer_id,
    fornecedorCategoryId: row.fornecedor_category_id,
    bandeira: row.bandeira,
    produto: row.produto,
    canal: row.canal,
    valorOriginal: row.valor_original,
    valorOverride: row.valor_override,
    overrideMode: row.override_mode || 'proporcional',
    marginOutbankOverride: row.margin_outbank_override,
    marginExecutivoOverride: row.margin_executivo_override,
    marginCoreOverride: row.margin_core_override,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  })));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { 
    customerId, 
    fornecedorCategoryId, 
    bandeira, 
    produto, 
    canal, 
    valorOriginal, 
    valorOverride,
    overrideMode,
    marginOutbankOverride,
    marginExecutivoOverride,
    marginCoreOverride
  } = body;

  if (!customerId || !fornecedorCategoryId || !bandeira || !produto || valorOverride === undefined) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
  }

  const { user, canEdit } = await checkUserAccess(parseInt(customerId));
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  if (!canEdit) {
    return NextResponse.json({ error: 'Sem permissão para editar' }, { status: 403 });
  }

  const canalValue = canal || 'pos';
  const mode = overrideMode || 'proporcional';

  const { rows: existing } = await sql.query(`
    SELECT id, valor_override FROM iso_mdr_overrides 
    WHERE customer_id = $1 AND fornecedor_category_id = $2 AND bandeira = $3 AND produto = $4 AND canal = $5
  `, [customerId, fornecedorCategoryId, bandeira, produto, canalValue]);

  const valorAnterior = existing[0]?.valor_override || valorOriginal;
  const acao = existing[0] ? 'ATUALIZADO' : 'CRIADO';

  if (existing[0]) {
    await sql.query(`
      UPDATE iso_mdr_overrides SET
        valor_override = $1,
        override_mode = $2,
        margin_outbank_override = $3,
        margin_executivo_override = $4,
        margin_core_override = $5,
        updated_at = NOW()
      WHERE id = $6
    `, [valorOverride, mode, marginOutbankOverride, marginExecutivoOverride, marginCoreOverride, existing[0].id]);
  } else {
    await sql.query(`
      INSERT INTO iso_mdr_overrides 
        (customer_id, fornecedor_category_id, bandeira, produto, canal, valor_original, valor_override, override_mode, margin_outbank_override, margin_executivo_override, margin_core_override)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [customerId, fornecedorCategoryId, bandeira, produto, canalValue, valorOriginal, valorOverride, mode, marginOutbankOverride, marginExecutivoOverride, marginCoreOverride]);
  }

  await sql.query(`
    INSERT INTO iso_mdr_override_history 
      (customer_id, fornecedor_category_id, bandeira, produto, canal, user_id, user_name, valor_anterior, valor_novo, acao, override_mode)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [customerId, fornecedorCategoryId, bandeira, produto, canalValue, user.id, user.name || user.email, valorAnterior, valorOverride, acao, mode]);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get('customerId');
  const fornecedorCategoryId = searchParams.get('fornecedorCategoryId');
  const bandeira = searchParams.get('bandeira');
  const produto = searchParams.get('produto');
  const canal = searchParams.get('canal') || 'pos';

  if (!customerId || !fornecedorCategoryId || !bandeira || !produto) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
  }

  const { user, canEdit } = await checkUserAccess(parseInt(customerId));
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  if (!canEdit) {
    return NextResponse.json({ error: 'Sem permissão para reverter' }, { status: 403 });
  }

  const { rows: existing } = await sql.query(`
    SELECT id, valor_override, valor_original FROM iso_mdr_overrides 
    WHERE customer_id = $1 AND fornecedor_category_id = $2 AND bandeira = $3 AND produto = $4 AND canal = $5
  `, [customerId, fornecedorCategoryId, bandeira, produto, canal]);

  if (!existing[0]) {
    return NextResponse.json({ error: 'Override não encontrado' }, { status: 404 });
  }

  await sql.query(`
    INSERT INTO iso_mdr_override_history 
      (customer_id, fornecedor_category_id, bandeira, produto, canal, user_id, user_name, valor_anterior, valor_novo, acao, override_mode)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [customerId, fornecedorCategoryId, bandeira, produto, canal, user.id, user.name || user.email, existing[0].valor_override, existing[0].valor_original, 'REVERTIDO', null]);

  await sql.query(`DELETE FROM iso_mdr_overrides WHERE id = $1`, [existing[0].id]);

  return NextResponse.json({ success: true });
}
