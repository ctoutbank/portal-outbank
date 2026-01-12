import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cnaeId: string }> }
) {
  try {
    const { id: fornecedorId, cnaeId } = await params;
    const body = await request.json();

    const suporta_pos = Boolean(body.suporta_pos);
    const suporta_online = Boolean(body.suporta_online);

    const categoryId = parseInt(cnaeId);
    
    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'ID de categoria inválido' }, { status: 400 });
    }

    await sql.query(
      `UPDATE fornecedor_categories 
       SET suporta_pos = $1, suporta_online = $2
       WHERE fornecedor_id = $3 AND category_id = $4`,
      [suporta_pos, suporta_online, fornecedorId, categoryId]
    );

    return NextResponse.json({ 
      success: true,
      suporta_pos,
      suporta_online
    });

  } catch (error: any) {
    console.error('Error updating channels:', error);
    return NextResponse.json({ 
      error: 'Erro ao atualizar canais',
      details: error.message 
    }, { status: 500 });
  }
}
