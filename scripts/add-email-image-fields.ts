import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Erro: POSTGRES_URL, DATABASE_URL ou NEON_DATABASE_URL não encontrada nas variáveis de ambiente!');
  console.error('Por favor, configure uma dessas variáveis no arquivo .env.local');
  process.exit(1);
}

console.log('📡 Conectando ao banco de dados...');
const sql = neon(dbUrl);

async function addEmailImageFields() {
  try {
    console.log('🔄 Adicionando colunas email_image_url e email_image_file_id...');
    
    await sql`
      ALTER TABLE customer_customization 
      ADD COLUMN IF NOT EXISTS email_image_url varchar(100);
    `;

    console.log('✅ Coluna email_image_url adicionada!');

    await sql`
      ALTER TABLE customer_customization 
      ADD COLUMN IF NOT EXISTS email_image_file_id bigint;
    `;

    console.log('✅ Coluna email_image_file_id adicionada!');

    console.log('✅ Migration concluída com sucesso!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
  }
}

addEmailImageFields();

