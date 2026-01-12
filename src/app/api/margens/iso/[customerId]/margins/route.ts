import { NextRequest, NextResponse } from 'next/server';
import { isoMarginsRepository } from '@/lib/db/iso-margins';
import { getCurrentUser } from '@/lib/auth';
import { isSuperAdmin, getUserMultiIsoAccess } from '@/lib/permissions/check-permissions';
import { sql } from '@vercel/postgres';

async function validateIsoAccess(customerId: number, userId: number): Promise<boolean> {
  const superAdmin = await isSuperAdmin();
  if (superAdmin) return true;
  
  const allowedIds = await getUserMultiIsoAccess(userId);
  return allowedIds.includes(customerId);
}

async function validateLinkOwnership(linkId: string, customerId: number): Promise<boolean> {
  const { rows } = await sql.query(`
    SELECT id FROM iso_mdr_links WHERE id = $1 AND customer_id = $2
  `, [linkId, customerId]);
  return rows.length > 0;
}

function validateMarginValue(value: any): { valid: boolean; normalized: string; error?: string } {
  if (value === undefined || value === null) {
    return { valid: false, normalized: '', error: 'Valor obrigatório' };
  }
  
  const strValue = String(value).trim().replace(',', '.');
  
  if (!/^-?\d+(\.\d+)?$/.test(strValue)) {
    return { valid: false, normalized: '', error: 'Formato numérico inválido' };
  }
  
  const numValue = parseFloat(strValue);
  
  if (isNaN(numValue)) {
    return { valid: false, normalized: '', error: 'Valor não numérico' };
  }
  
  if (numValue < 0) {
    return { valid: false, normalized: '', error: 'Margem deve ser >= 0' };
  }
  
  const normalizedValue = numValue.toFixed(4);
  return { valid: true, normalized: normalizedValue };
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

    const hasAccess = await validateIsoAccess(customerIdNum, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acesso negado a este ISO' }, { status: 403 });
    }

    const linkedTables = await isoMarginsRepository.getLinkedMdrTablesWithIsoMargins(customerIdNum);

    return NextResponse.json({ linkedTables });

  } catch (error: any) {
    console.error('Erro ao buscar tabelas com margens ISO:', error);
    return NextResponse.json({ error: 'Erro ao buscar tabelas com margens ISO' }, { status: 500 });
  }
}

export async function PUT(
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

    const hasAccess = await validateIsoAccess(customerIdNum, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acesso negado a este ISO' }, { status: 403 });
    }

    const body = await request.json();
    const { linkId, bandeira, modalidade, marginIso } = body;

    if (!linkId || !bandeira || !modalidade) {
      return NextResponse.json({ 
        error: 'linkId, bandeira e modalidade são obrigatórios' 
      }, { status: 400 });
    }

    const linkOwnership = await validateLinkOwnership(linkId, customerIdNum);
    if (!linkOwnership) {
      return NextResponse.json({ 
        error: 'Link não pertence a este ISO' 
      }, { status: 403 });
    }

    const validation = validateMarginValue(marginIso);
    if (!validation.valid) {
      return NextResponse.json({ 
        error: validation.error || 'Margem inválida'
      }, { status: 400 });
    }

    await isoMarginsRepository.upsertIsoMdrMargin(linkId, bandeira, modalidade, validation.normalized);

    return NextResponse.json({ 
      success: true,
      message: 'Margem ISO atualizada com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao atualizar margem ISO:', error);
    return NextResponse.json({ error: error.message || 'Erro ao atualizar margem ISO' }, { status: 500 });
  }
}

export async function PATCH(
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

    const hasAccess = await validateIsoAccess(customerIdNum, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acesso negado a este ISO' }, { status: 403 });
    }

    const body = await request.json();
    const { margins } = body;

    if (!margins || !Array.isArray(margins)) {
      return NextResponse.json({ 
        error: 'margins deve ser um array de alterações' 
      }, { status: 400 });
    }

    const validatedMargins: Array<{ linkId: string; bandeira: string; modalidade: string; marginIso: string }> = [];
    const errors: string[] = [];

    for (const margin of margins) {
      const { linkId, bandeira, modalidade, marginIso } = margin;
      
      if (!linkId || !bandeira || !modalidade) {
        errors.push(`Entrada inválida: linkId, bandeira e modalidade são obrigatórios`);
        continue;
      }

      const linkOwnership = await validateLinkOwnership(linkId, customerIdNum);
      if (!linkOwnership) {
        errors.push(`linkId ${linkId} não pertence a este ISO`);
        continue;
      }

      const validation = validateMarginValue(marginIso);
      if (!validation.valid) {
        errors.push(`${bandeira}/${modalidade}: ${validation.error}`);
        continue;
      }

      validatedMargins.push({ linkId, bandeira, modalidade, marginIso: validation.normalized });
    }

    if (validatedMargins.length === 0 && errors.length > 0) {
      return NextResponse.json({ 
        error: 'Nenhuma margem válida para atualizar',
        details: errors
      }, { status: 400 });
    }

    for (const margin of validatedMargins) {
      await isoMarginsRepository.upsertIsoMdrMargin(
        margin.linkId, 
        margin.bandeira, 
        margin.modalidade, 
        margin.marginIso
      );
    }

    return NextResponse.json({ 
      success: true,
      message: `${validatedMargins.length} margem(ns) ISO atualizada(s) com sucesso`,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Erro ao atualizar margens ISO em lote:', error);
    return NextResponse.json({ error: error.message || 'Erro ao atualizar margens ISO' }, { status: 500 });
  }
}
