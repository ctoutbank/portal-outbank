import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getCurrentUser } from '@/lib/auth';
import { isSuperAdmin, isAdminUser } from '@/lib/permissions/check-permissions';

export type MdrStatus = 'rascunho' | 'pendente_validacao' | 'validada' | 'rejeitada' | 'inativa';

interface ValidationResponse {
  success: boolean;
  status?: MdrStatus;
  message?: string;
  error?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cnaeId: string }> }
): Promise<NextResponse<ValidationResponse | { status: MdrStatus; history: any[] }>> {
  try {
    const { id: fornecedorId, cnaeId } = await params;
    const categoryId = parseInt(cnaeId);

    const { rows } = await sql.query(`
      SELECT 
        fc.status,
        fc.validated_by,
        fc.validated_at,
        fc.rejection_reason,
        fc.submitted_at,
        u.email as validated_by_email
      FROM fornecedor_categories fc
      LEFT JOIN users u ON fc.validated_by = u.id
      WHERE fc.fornecedor_id = $1 AND fc.category_id = $2
    `, [fornecedorId, categoryId]);

    if (!rows[0]) {
      return NextResponse.json({ 
        error: 'Categoria não encontrada para este fornecedor' 
      }, { status: 404 });
    }

    const { rows: history } = await sql.query(`
      SELECT 
        mvh.previous_status,
        mvh.new_status,
        mvh.changed_at,
        mvh.reason,
        mvh.notes,
        u.email as changed_by_email
      FROM mdr_validation_history mvh
      LEFT JOIN users u ON mvh.changed_by = u.id
      WHERE mvh.fornecedor_category_id = (
        SELECT id FROM fornecedor_categories 
        WHERE fornecedor_id = $1 AND category_id = $2
      )
      ORDER BY mvh.changed_at DESC
      LIMIT 10
    `, [fornecedorId, categoryId]);

    return NextResponse.json({
      status: rows[0].status || 'rascunho',
      validatedBy: rows[0].validated_by_email,
      validatedAt: rows[0].validated_at,
      rejectionReason: rows[0].rejection_reason,
      submittedAt: rows[0].submitted_at,
      history
    });

  } catch (error: any) {
    console.error('Erro ao buscar status de validação:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro ao buscar status de validação' 
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cnaeId: string }> }
): Promise<NextResponse<ValidationResponse>> {
  try {
    const { id: fornecedorId, cnaeId } = await params;
    const categoryId = parseInt(cnaeId);
    const { action, reason } = await request.json();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Não autorizado' 
      }, { status: 401 });
    }

    const { rows: fcRows } = await sql.query(`
      SELECT id, status, mdr_id FROM fornecedor_categories 
      WHERE fornecedor_id = $1 AND category_id = $2
    `, [fornecedorId, categoryId]);

    if (!fcRows[0]) {
      return NextResponse.json({ 
        success: false,
        error: 'Categoria não encontrada' 
      }, { status: 404 });
    }

    const fcId = fcRows[0].id;
    const currentStatus = fcRows[0].status || 'rascunho';
    const hasMdr = !!fcRows[0].mdr_id;
    
    let newStatus: MdrStatus;
    let message: string;

    switch (action) {
      case 'submit':
        const canSubmit = await isSuperAdmin() || await isAdminUser();
        if (!canSubmit) {
          return NextResponse.json({ 
            success: false,
            error: 'Você não tem permissão para submeter tabelas para validação' 
          }, { status: 403 });
        }
        if (!hasMdr) {
          return NextResponse.json({ 
            success: false,
            error: 'Não é possível submeter para validação sem MDR configurado' 
          }, { status: 400 });
        }
        if (currentStatus !== 'rascunho' && currentStatus !== 'rejeitada') {
          return NextResponse.json({ 
            success: false,
            error: 'Apenas tabelas em rascunho ou rejeitadas podem ser submetidas' 
          }, { status: 400 });
        }
        newStatus = 'pendente_validacao';
        message = 'Tabela enviada para validação';
        break;

      case 'approve':
        const isAdmin = await isSuperAdmin();
        if (!isAdmin) {
          return NextResponse.json({ 
            success: false,
            error: 'Apenas Super Admin pode aprovar tabelas' 
          }, { status: 403 });
        }
        if (currentStatus !== 'pendente_validacao') {
          return NextResponse.json({ 
            success: false,
            error: 'Apenas tabelas pendentes podem ser aprovadas' 
          }, { status: 400 });
        }
        newStatus = 'validada';
        message = 'Tabela aprovada e disponível para uso';
        break;

      case 'reject':
        const isAdminReject = await isSuperAdmin();
        if (!isAdminReject) {
          return NextResponse.json({ 
            success: false,
            error: 'Apenas Super Admin pode rejeitar tabelas' 
          }, { status: 403 });
        }
        if (!reason) {
          return NextResponse.json({ 
            success: false,
            error: 'Motivo da rejeição é obrigatório' 
          }, { status: 400 });
        }
        if (currentStatus !== 'pendente_validacao') {
          return NextResponse.json({ 
            success: false,
            error: 'Apenas tabelas pendentes podem ser rejeitadas' 
          }, { status: 400 });
        }
        newStatus = 'rejeitada';
        message = 'Tabela rejeitada';
        break;

      case 'deactivate':
        const isAdminDeactivate = await isSuperAdmin();
        if (!isAdminDeactivate) {
          return NextResponse.json({ 
            success: false,
            error: 'Apenas Super Admin pode desativar tabelas' 
          }, { status: 403 });
        }
        if (currentStatus !== 'validada') {
          return NextResponse.json({ 
            success: false,
            error: 'Apenas tabelas validadas podem ser desativadas' 
          }, { status: 400 });
        }
        newStatus = 'inativa';
        message = 'Tabela desativada';
        break;

      case 'reactivate':
        const isAdminReactivate = await isSuperAdmin();
        if (!isAdminReactivate) {
          return NextResponse.json({ 
            success: false,
            error: 'Apenas Super Admin pode reativar tabelas' 
          }, { status: 403 });
        }
        if (currentStatus !== 'inativa') {
          return NextResponse.json({ 
            success: false,
            error: 'Apenas tabelas inativas podem ser reativadas' 
          }, { status: 400 });
        }
        newStatus = 'validada';
        message = 'Tabela reativada';
        break;

      default:
        return NextResponse.json({ 
          success: false,
          error: 'Ação inválida' 
        }, { status: 400 });
    }

    await sql.query(`
      UPDATE fornecedor_categories SET
        status = $1,
        validated_by = CASE WHEN $1 IN ('validada', 'rejeitada', 'inativa') THEN $2 ELSE validated_by END,
        validated_at = CASE WHEN $1 IN ('validada', 'rejeitada') THEN NOW() ELSE validated_at END,
        rejection_reason = CASE WHEN $1 = 'rejeitada' THEN $3 ELSE NULL END,
        submitted_at = CASE WHEN $1 = 'pendente_validacao' THEN NOW() ELSE submitted_at END,
        updated_at = NOW()
      WHERE id = $4
    `, [newStatus, user.id, reason || null, fcId]);

    await sql.query(`
      INSERT INTO mdr_validation_history 
        (fornecedor_category_id, previous_status, new_status, changed_by, reason)
      VALUES ($1, $2, $3, $4, $5)
    `, [fcId, currentStatus, newStatus, user.id, reason || null]);

    return NextResponse.json({
      success: true,
      status: newStatus,
      message
    });

  } catch (error: any) {
    console.error('Erro ao atualizar status de validação:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Erro ao atualizar status de validação' 
    }, { status: 500 });
  }
}
