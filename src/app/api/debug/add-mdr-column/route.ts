import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST() {
  try {
    console.log('🔄 Adicionando coluna mdr_id...');
    
    await sql.query(`
      ALTER TABLE fornecedor_categories 
      ADD COLUMN IF NOT EXISTS mdr_id UUID REFERENCES mdr(id);
    `);

    console.log('✅ Coluna adicionada!');

    await sql.query(`
      CREATE INDEX IF NOT EXISTS idx_fornecedor_categories_mdr 
      ON fornecedor_categories(mdr_id);
    `);

    console.log('✅ Índice criado!');

    return NextResponse.json({ 
      success: true, 
      message: 'Coluna mdr_id adicionada com sucesso!' 
    });
    
  } catch (error: any) {
    console.error('❌ Erro:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
