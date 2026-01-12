import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Buscar estrutura da tabela mdr
    const { rows: columns } = await sql.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'mdr'
      ORDER BY ordinal_position;
    `);

    // Buscar um registro de exemplo (se existir)
    const { rows: sampleData } = await sql.query(`
      SELECT * FROM mdr LIMIT 1;
    `);

    // Buscar contagem de registros
    const { rows: countResult } = await sql.query(`
      SELECT COUNT(*) as total FROM mdr;
    `);

    return NextResponse.json({
      success: true,
      table_name: 'mdr',
      total_records: countResult[0]?.total || 0,
      columns: columns,
      sample_data: sampleData[0] || null,
      column_names: columns.map(col => col.column_name),
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar schema:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: error 
    }, { status: 500 });
  }
}
