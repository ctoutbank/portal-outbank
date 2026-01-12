import { sql } from '@vercel/postgres';

async function linkMccsToDock() {
  const dockId = '0d51e053-e5aa-449f-8f7c-3129c6c31a30';
  
  console.log('🔗 Vinculando MCCs ao fornecedor DOCK...\n');

  const categoriesResult = await sql`SELECT id, mcc, name FROM categories WHERE active = true ORDER BY mcc`;
  console.log(`📋 Total de categorias no banco: ${categoriesResult.rows.length}`);

  const existingResult = await sql`
    SELECT category_id FROM fornecedor_categories WHERE fornecedor_id = ${dockId}::uuid
  `;
  const existingCategoryIds = new Set(existingResult.rows.map(r => Number(r.category_id)));
  console.log(`📊 MCCs já vinculados ao DOCK: ${existingCategoryIds.size}`);

  const newCategories = categoriesResult.rows.filter(c => !existingCategoryIds.has(Number(c.id)));
  console.log(`🆕 Novos MCCs a vincular: ${newCategories.length}\n`);

  if (newCategories.length === 0) {
    console.log('✅ Todos os MCCs já estão vinculados ao DOCK!');
    return;
  }

  let linked = 0;
  let errors = 0;

  for (const category of newCategories) {
    try {
      await sql`
        INSERT INTO fornecedor_categories (id, fornecedor_id, category_id, created_at)
        VALUES (
          gen_random_uuid(),
          ${dockId}::uuid,
          ${Number(category.id)},
          NOW()
        )
      `;

      linked++;
      if (linked % 50 === 0) {
        console.log(`   ✓ Vinculados ${linked} de ${newCategories.length}...`);
      }
    } catch (error: any) {
      errors++;
      console.error(`   ❌ Erro ao vincular MCC ${category.mcc}: ${error.message}`);
    }
  }

  console.log(`\n✅ Vinculação concluída!`);
  console.log(`   - Vinculados: ${linked}`);
  console.log(`   - Erros: ${errors}`);
  console.log(`   - Total vinculado ao DOCK: ${existingCategoryIds.size + linked}`);
}

linkMccsToDock()
  .then(() => {
    console.log('\n🎉 Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
