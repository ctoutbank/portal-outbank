import { NextRequest, NextResponse } from 'next/server';
import { isoMarginsRepository, MdrValidationStatus } from '@/lib/db/iso-margins';
import { getCurrentUser } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/permissions/check-permissions';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * Verifica se o usuário tem acesso EXPLÍCITO a um ISO específico para validação MDR.
 * NÃO considera fullAccess - para validar tabelas MDR, o usuário deve estar
 * explicitamente vinculado ao ISO via user_customers ou admin_customers.
 * Isso garante isolamento de tenant mesmo para usuários com fullAccess.
 */
async function hasExplicitIsoAccess(userId: number, customerId: number): Promise<boolean> {
  const { rows } = await sql.query(`
    SELECT 1 FROM users u
    WHERE u.id = $1 AND (
      EXISTS (
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

const VALID_TRANSITIONS: Record<MdrValidationStatus, MdrValidationStatus[]> = {
  'rascunho': ['validada', 'pendente_validacao'],
  'pendente_validacao': ['validada', 'rejeitada', 'rascunho'],
  'validada': ['inativa'],
  'rejeitada': ['rascunho'],
  'inativa': ['validada']
};

function isValidTransition(currentStatus: MdrValidationStatus, newStatus: MdrValidationStatus): boolean {
  const validNextStatuses = VALID_TRANSITIONS[currentStatus];
  return validNextStatuses?.includes(newStatus) ?? false;
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
      return NextResponse.json({ error: 'Apenas Super Admin pode acessar o histórico de validação' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('linkId');

    const history = await isoMarginsRepository.getValidationHistory(customerIdNum, linkId || undefined);

    return NextResponse.json({ history });

  } catch (error: any) {
    console.error('Erro ao buscar histórico de validação:', error);
    return NextResponse.json({ error: 'Erro ao buscar histórico de validação' }, { status: 500 });
  }
}

export async function POST(
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

    const body = await request.json();
    const { linkId, newStatus, reason } = body;

    if (!linkId || !newStatus) {
      return NextResponse.json({ error: 'linkId e newStatus são obrigatórios' }, { status: 400 });
    }

    const validStatuses: MdrValidationStatus[] = ['rascunho', 'validada', 'inativa'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    const superAdmin = await isSuperAdmin();

    // Buscar permissão can_validate_mdr diretamente do banco de dados
    let canValidateMdr = false;
    if (!superAdmin) {
      const { rows: userRows } = await sql.query(
        `SELECT can_validate_mdr FROM users WHERE id = $1`,
        [user.id]
      );
      canValidateMdr = userRows[0]?.can_validate_mdr === true;
    }

    if (!superAdmin && !canValidateMdr) {
      return NextResponse.json({ error: 'Você não tem permissão para aprovar tabelas de taxas' }, { status: 403 });
    }

    // Verificar acesso EXPLÍCITO ao ISO para usuários não-Super Admin
    // Requer vínculo direto via user_customers ou admin_customers (não considera fullAccess)
    if (!superAdmin) {
      const hasAccess = await hasExplicitIsoAccess(user.id, customerIdNum);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Você não tem acesso a este ISO' }, { status: 403 });
      }
    }

    const { rows: linkRows } = await sql.query(
      `SELECT status FROM iso_mdr_links WHERE id = $1 AND customer_id = $2`,
      [linkId, customerIdNum]
    );

    if (!linkRows[0]) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 });
    }

    const currentStatus = (linkRows[0].status || 'rascunho') as MdrValidationStatus;

    if (!isValidTransition(currentStatus, newStatus)) {
      return NextResponse.json({
        error: `Transição inválida: ${currentStatus} → ${newStatus}`,
        currentStatus,
        validTransitions: VALID_TRANSITIONS[currentStatus]
      }, { status: 400 });
    }

    const isoConfig = await isoMarginsRepository.getIsoConfig(customerIdNum);
    if (!isoConfig?.id) {
      return NextResponse.json({ error: 'Configure as margens do ISO antes de validar tabelas' }, { status: 400 });
    }

    const marginOutbank = parseFloat(isoConfig.marginOutbank);
    if (newStatus === 'validada' && marginOutbank <= 0) {
      return NextResponse.json({ error: 'Margem Outbank deve ser configurada antes de validar' }, { status: 400 });
    }

    await isoMarginsRepository.updateLinkStatus(customerIdNum, linkId, newStatus, user.id, reason);

    if (newStatus === 'validada') {
      const { rows: linkData } = await sql.query(
        `SELECT fornecedor_category_id FROM iso_mdr_links WHERE id = $1`,
        [linkId]
      );

      if (linkData[0]?.fornecedor_category_id) {
        await isoMarginsRepository.initializeIsoMdrMarginsFromMdr(
          linkId,
          linkData[0].fornecedor_category_id
        );
      }

      await isoMarginsRepository.generateCostSnapshots(linkId);
    } else if (newStatus === 'inativa' || newStatus === 'rascunho') {
      await isoMarginsRepository.deleteCostSnapshots(linkId);
    }

    return NextResponse.json({
      success: true,
      message: `Status atualizado para ${newStatus}`
    });

  } catch (error: any) {
    console.error('Erro ao atualizar status de validação:', error);
    return NextResponse.json({ error: error.message || 'Erro ao atualizar status' }, { status: 500 });
  }
}
