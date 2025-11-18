import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST() {
  try {
    console.log('🔄 Adicionando colunas email_image_url e email_image_file_id...');
    
    await sql.query(`
      ALTER TABLE customer_customization 
      ADD COLUMN IF NOT EXISTS email_image_url varchar(100);
    `);

    console.log('✅ Coluna email_image_url adicionada!');

    await sql.query(`
      ALTER TABLE customer_customization 
      ADD COLUMN IF NOT EXISTS email_image_file_id bigint;
    `);

    console.log('✅ Coluna email_image_file_id adicionada!');

    return NextResponse.json({ 
      success: true, 
      message: 'Colunas adicionadas com sucesso!' 
    });
    
  } catch (error: any) {
    console.error('❌ Erro:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

