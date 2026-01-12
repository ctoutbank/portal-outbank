import { sql } from '@vercel/postgres';
import { nanoid } from 'nanoid';
import * as fs from 'fs';
import * as path from 'path';

interface MccData {
  mcc: string;
  edited_description: string;
  combined_description: string;
  usda_description: string;
  irs_description: string;
  irs_reportable: string;
  id: number;
}

async function importMccCodes() {
  console.log('🚀 Iniciando importação de MCCs ISO 18245...\n');

  const jsonPath = '/tmp/mcc_codes.json';
  
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Arquivo mcc_codes.json não encontrado em /tmp/');
    console.log('Execute primeiro: curl -s "https://raw.githubusercontent.com/greggles/mcc-codes/main/mcc_codes.json" -o /tmp/mcc_codes.json');
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const allMccs: MccData[] = JSON.parse(rawData);

  console.log(`📦 Total de MCCs no arquivo: ${allMccs.length}`);

  const genericMccs = allMccs.filter(m => {
    const mccNum = parseInt(m.mcc);
    return mccNum < 3000 || mccNum >= 4000;
  });

  console.log(`📋 MCCs genéricos (excluindo merchant-specific 3000-3999): ${genericMccs.length}\n`);

  const existingResult = await sql`SELECT mcc FROM categories WHERE mcc IS NOT NULL`;
  const existingMccs = new Set(existingResult.rows.map(r => r.mcc));
  console.log(`📊 MCCs já existentes no banco: ${existingMccs.size}`);

  const newMccs = genericMccs.filter(m => !existingMccs.has(m.mcc));
  console.log(`🆕 Novos MCCs a serem importados: ${newMccs.length}\n`);

  if (newMccs.length === 0) {
    console.log('✅ Todos os MCCs já estão no banco de dados!');
    return;
  }

  let imported = 0;
  let errors = 0;

  for (const mcc of newMccs) {
    try {
      const slug = nanoid(32).toUpperCase();
      const name = mcc.edited_description.substring(0, 255);

      await sql`
        INSERT INTO categories (slug, active, name, mcc, dtinsert, dtupdate)
        VALUES (${slug}, true, ${name}, ${mcc.mcc}, NOW(), NOW())
      `;

      imported++;
      if (imported % 50 === 0) {
        console.log(`   ✓ Importados ${imported} de ${newMccs.length}...`);
      }
    } catch (error: any) {
      errors++;
      console.error(`   ❌ Erro ao importar MCC ${mcc.mcc}: ${error.message}`);
    }
  }

  console.log(`\n✅ Importação concluída!`);
  console.log(`   - Importados: ${imported}`);
  console.log(`   - Erros: ${errors}`);
  console.log(`   - Total no banco agora: ${existingMccs.size + imported}`);
}

importMccCodes()
  .then(() => {
    console.log('\n🎉 Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
