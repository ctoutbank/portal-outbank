import { sql } from '@vercel/postgres';

async function syncCategoriesToMcc() {
  console.log('🔄 Sincronizando MCCs da tabela categories para a tabela mcc...\n');

  const categoriesResult = await sql`
    SELECT mcc, name FROM categories WHERE active = true AND mcc IS NOT NULL ORDER BY mcc
  `;
  console.log(`📋 Total de categorias no banco: ${categoriesResult.rows.length}`);

  const existingResult = await sql`SELECT code FROM mcc`;
  const existingCodes = new Set(existingResult.rows.map(r => r.code));
  console.log(`📊 MCCs já existentes na tabela mcc: ${existingCodes.size}`);

  const newCategories = categoriesResult.rows.filter(c => !existingCodes.has(c.mcc));
  console.log(`🆕 Novos MCCs a sincronizar: ${newCategories.length}\n`);

  if (newCategories.length === 0) {
    console.log('✅ Todos os MCCs já estão sincronizados!');
    return;
  }

  let synced = 0;
  let errors = 0;

  for (const category of newCategories) {
    try {
      await sql`
        INSERT INTO mcc (code, description, categoria, nivel_risco, tipo_liquidacao, is_active, created_at)
        VALUES (
          ${category.mcc},
          ${category.name},
          'Geral',
          'medio',
          'D1',
          true,
          NOW()
        )
      `;

      synced++;
      if (synced % 50 === 0) {
        console.log(`   ✓ Sincronizados ${synced} de ${newCategories.length}...`);
      }
    } catch (error: any) {
      errors++;
      console.error(`   ❌ Erro ao sincronizar MCC ${category.mcc}: ${error.message}`);
    }
  }

  console.log(`\n✅ Sincronização concluída!`);
  console.log(`   - Sincronizados: ${synced}`);
  console.log(`   - Erros: ${errors}`);
  
  const finalCount = await sql`SELECT COUNT(*) as total FROM mcc`;
  console.log(`   - Total na tabela mcc: ${finalCount.rows[0].total}`);
}

syncCategoriesToMcc()
  .then(() => {
    console.log('\n🎉 Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
