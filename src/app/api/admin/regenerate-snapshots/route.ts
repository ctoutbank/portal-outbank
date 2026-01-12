import { NextRequest, NextResponse } from 'next/server';
import { isoMarginsRepository } from '@/lib/db/iso-margins';
import { getCurrentUser } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/permissions/check-permissions';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const superAdmin = await isSuperAdmin();
    if (!superAdmin) {
      return NextResponse.json({ error: 'Apenas Super Admin pode executar esta ação' }, { status: 403 });
    }

    const { rows: validatedLinks } = await sql.query(`
      SELECT id as link_id, customer_id
      FROM iso_mdr_links 
      WHERE status = 'validada' AND is_active = true
    `);

    if (validatedLinks.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'Nenhuma tabela validada encontrada',
        processed: 0
      });
    }

    let processed = 0;
    const errors: string[] = [];

    for (const link of validatedLinks) {
      try {
        await isoMarginsRepository.deleteCostSnapshots(link.link_id);
        await isoMarginsRepository.generateCostSnapshots(link.link_id);
        processed++;
      } catch (error: any) {
        errors.push(`Link ${link.link_id}: ${error.message}`);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Snapshots regenerados para ${processed} tabelas`,
      processed,
      total: validatedLinks.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Erro ao regenerar snapshots:', error);
    return NextResponse.json({ error: error.message || 'Erro ao regenerar snapshots' }, { status: 500 });
  }
}
