import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { customers } from './drizzle/schema.ts';
import { sql } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL não encontrada');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function main() {
  console.log('🔍 Verificando ISOs antes da deleção...');
  
  const allCustomers = await db.select().from(customers);
  console.log(`📊 Total de ISOs encontrados: ${allCustomers.length}`);
  
  const bancoPrisma = allCustomers.find(c => c.id === 1);
  if (bancoPrisma) {
    console.log(`✅ Banco Prisma encontrado: ${bancoPrisma.name} (ID: ${bancoPrisma.id})`);
  } else {
    console.error('❌ Banco Prisma (ID: 1) não encontrado!');
    process.exit(1);
  }
  
  console.log('\n🗑️  Deletando todos os ISOs exceto Banco Prisma (ID: 1)...');
  
  const result = await db
    .delete(customers)
    .where(sql`${customers.id} != 1`)
    .returning({ id: customers.id, name: customers.name });
  
  console.log(`\n✅ ${result.length} ISOs deletados com sucesso!`);
  console.log('✅ Banco Prisma (ID: 1) foi mantido.');
  
  console.log('\n🔍 Verificando ISOs após a deleção...');
  const remainingCustomers = await db.select().from(customers);
  console.log(`📊 ISOs restantes: ${remainingCustomers.length}`);
  remainingCustomers.forEach(c => {
    console.log(`   - ${c.name} (ID: ${c.id})`);
  });
  
  await client.end();
}

main().catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
});
