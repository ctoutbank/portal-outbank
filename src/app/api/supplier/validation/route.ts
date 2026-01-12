import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getCurrentUser } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/permissions/check-permissions';

export const dynamic = 'force-dynamic';

export type MdrStatus = 'rascunho' | 'pendente_validacao' | 'validada' | 'rejeitada' | 'inativa';

interface MdrTableWithStatus {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  categoryId: number;
  categoryName: string;
  mcc: string;
  cnae: string;
  status: MdrStatus;
  hasMdr: boolean;
  submittedAt: string | null;
  validatedAt: string | null;
  validatedByEmail: string | null;
  rejectionReason: string | null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as MdrStatus | 'all' | null;
    const fornecedorId = searchParams.get('fornecedorId');

    let query = `
      SELECT 
        fc.id,
        fc.fornecedor_id,
        f.nome as fornecedor_nome,
        fc.category_id,
        cat.name as category_name,
        cat.mcc,
        cat.cnae,
        fc.status,
        fc.mdr_id IS NOT NULL as has_mdr,
        fc.submitted_at,
        fc.validated_at,
        fc.rejection_reason,
        u.email as validated_by_email
      FROM fornecedor_categories fc
      JOIN fornecedores f ON fc.fornecedor_id = f.id
      JOIN categories cat ON fc.category_id = cat.id
      LEFT JOIN users u ON fc.validated_by = u.id
      WHERE f.ativo = true
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      query += ` AND fc.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (fornecedorId) {
      query += ` AND fc.fornecedor_id = $${paramIndex}`;
      params.push(fornecedorId);
      paramIndex++;
    }

    query += ` ORDER BY 
      CASE fc.status 
        WHEN 'pendente_validacao' THEN 1 
        WHEN 'validada' THEN 2 
        WHEN 'rascunho' THEN 3 
        WHEN 'rejeitada' THEN 4 
        WHEN 'inativa' THEN 5 
      END,
      f.nome, cat.mcc`;

    const { rows } = await sql.query(query, params);

    const tables: MdrTableWithStatus[] = rows.map(row => ({
      id: row.id,
      fornecedorId: row.fornecedor_id,
      fornecedorNome: row.fornecedor_nome,
      categoryId: row.category_id,
      categoryName: row.category_name,
      mcc: row.mcc || '',
      cnae: row.cnae || '',
      status: row.status || 'rascunho',
      hasMdr: row.has_mdr,
      submittedAt: row.submitted_at,
      validatedAt: row.validated_at,
      validatedByEmail: row.validated_by_email,
      rejectionReason: row.rejection_reason
    }));

    const summary = {
      total: tables.length,
      rascunho: tables.filter(t => t.status === 'rascunho').length,
      pendente_validacao: tables.filter(t => t.status === 'pendente_validacao').length,
      validada: tables.filter(t => t.status === 'validada').length,
      rejeitada: tables.filter(t => t.status === 'rejeitada').length,
      inativa: tables.filter(t => t.status === 'inativa').length
    };

    return NextResponse.json({ tables, summary });

  } catch (error: any) {
    console.error('Erro ao listar tabelas de validação:', error);
    return NextResponse.json({ 
      error: 'Erro ao listar tabelas de validação' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Apenas Super Admin pode realizar ações em lote' 
      }, { status: 403 });
    }

    const { action, tableIds, reason } = await request.json();

    if (!tableIds || !Array.isArray(tableIds) || tableIds.length === 0) {
      return NextResponse.json({ 
        error: 'IDs de tabelas são obrigatórios' 
      }, { status: 400 });
    }

    let newStatus: MdrStatus;
    let validFromStatus: MdrStatus[];

    switch (action) {
      case 'approve':
        newStatus = 'validada';
        validFromStatus = ['pendente_validacao'];
        break;
      case 'reject':
        if (!reason) {
          return NextResponse.json({ 
            error: 'Motivo da rejeição é obrigatório' 
          }, { status: 400 });
        }
        newStatus = 'rejeitada';
        validFromStatus = ['pendente_validacao'];
        break;
      case 'deactivate':
        newStatus = 'inativa';
        validFromStatus = ['validada', 'pendente_validacao', 'rascunho'];
        break;
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    const placeholders = tableIds.map((_, i) => `$${i + 1}`).join(', ');
    const statusPlaceholders = validFromStatus.map((_, i) => `$${tableIds.length + i + 1}`).join(', ');

    const { rows: eligibleRows } = await sql.query(`
      SELECT id, status FROM fornecedor_categories 
      WHERE id IN (${placeholders}) AND status IN (${statusPlaceholders})
    `, [...tableIds, ...validFromStatus]);

    if (eligibleRows.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhuma tabela elegível para esta ação' 
      }, { status: 400 });
    }

    const eligibleIds = eligibleRows.map(r => r.id);
    const eligiblePlaceholders = eligibleIds.map((_, i) => `$${i + 4}`).join(', ');

    await sql.query(`
      UPDATE fornecedor_categories SET
        status = $1,
        validated_by = $2,
        validated_at = CASE WHEN $1 IN ('validada', 'rejeitada') THEN NOW() ELSE validated_at END,
        rejection_reason = CASE WHEN $1 = 'rejeitada' THEN $3 ELSE NULL END,
        updated_at = NOW()
      WHERE id IN (${eligiblePlaceholders})
    `, [newStatus, user.id, reason || null, ...eligibleIds]);

    for (const row of eligibleRows) {
      await sql.query(`
        INSERT INTO mdr_validation_history 
          (fornecedor_category_id, previous_status, new_status, changed_by, reason, notes)
        VALUES ($1, $2, $3, $4, $5, 'Ação em lote')
      `, [row.id, row.status, newStatus, user.id, reason || null]);
    }

    return NextResponse.json({
      success: true,
      updated: eligibleRows.length,
      skipped: tableIds.length - eligibleRows.length
    });

  } catch (error: any) {
    console.error('Erro ao processar ação em lote:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar ação em lote' 
    }, { status: 500 });
  }
}
