import { sql } from "@vercel/postgres";
import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { config } from "dotenv";

// Carregar variáveis de ambiente
config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lista de migrations a executar (em ordem)
const migrations = [
  '0005_add_customer_modules_table.sql',
  '0006_add_merchant_modules_table.sql',
  '0007_add_module_consents_table.sql',
  '0008_add_stakeholders_table.sql',
  '0009_add_stakeholder_customers_table.sql',
  '0010_add_dock_columns.sql',
];

async function checkTableExists(tableName) {
  try {
    const result = await sql.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as exists;
    `, [tableName]);
    return result.rows[0]?.exists || false;
  } catch (error) {
    console.error(`Erro ao verificar tabela ${tableName}:`, error);
    return false;
  }
}

async function executeMigration(migrationFile) {
  const migrationPath = join(__dirname, '..', 'drizzle', 'migrations', migrationFile);

  try {
    console.log(`\n📄 Lendo migration: ${migrationFile}...`);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Extrair nome da tabela principal da migration
    const tableMatch = migrationSQL.match(/CREATE TABLE.*?"(\w+)"/i);
    const tableName = tableMatch ? tableMatch[1] : null;

    if (tableName) {
      const exists = await checkTableExists(tableName);
      if (exists) {
        console.log(`⏭️  Tabela ${tableName} já existe. Pulando migration ${migrationFile}...`);
        return { success: true, skipped: true };
      }
    }

    console.log(`🔄 Executando migration: ${migrationFile}...`);

    // Executar o SQL usando @vercel/postgres
    // Remover comentários
    const cleanSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .trim();

    // Executar o SQL completo
    await sql.query(cleanSQL);

    console.log(`✅ Migration ${migrationFile} executada com sucesso!`);
    return { success: true, skipped: false };

  } catch (error) {
    // Se a tabela já existe, pode ser um erro de "already exists" - isso é OK
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log(`⚠️  Tabela já existe (pode ter sido criada manualmente). Continuando...`);
      return { success: true, skipped: true };
    }

    console.error(`❌ Erro ao executar migration ${migrationFile}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  EXECUTANDO MIGRATIONS - FASE 2: ESTRUTURA BASE DE MÓDULOS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`📊 Total de migrations: ${migrations.length}`);
  console.log(`🔗 Conectando ao banco de dados...\n`);

  const results = [];

  for (const migration of migrations) {
    const result = await executeMigration(migration);
    results.push({ migration, ...result });

    // Pequena pausa entre migrations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  RESUMO DA EXECUÇÃO');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const successful = results.filter(r => r.success).length;
  const skipped = results.filter(r => r.skipped).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(({ migration, success, skipped, error }) => {
    if (skipped) {
      console.log(`⏭️  ${migration} - Pulada (já existe)`);
    } else if (success) {
      console.log(`✅ ${migration} - Executada com sucesso`);
    } else {
      console.log(`❌ ${migration} - Erro: ${error}`);
    }
  });

  console.log(`\n📊 Estatísticas:`);
  console.log(`   ✅ Executadas: ${successful - skipped}`);
  console.log(`   ⏭️  Puladas: ${skipped}`);
  console.log(`   ❌ Falhas: ${failed}`);

  if (failed === 0) {
    console.log(`\n✅ Todas as migrations foram processadas com sucesso!`);
    console.log(`\n🎉 Fase 2 concluída! As tabelas estão prontas para uso.`);
  } else {
    console.log(`\n⚠️  Algumas migrations falharam. Verifique os erros acima.`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});

