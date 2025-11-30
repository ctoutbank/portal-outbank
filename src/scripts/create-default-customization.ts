import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { customers, customerCustomization } from '../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);

/**
 * Script para criar customization padrão para "portal-outbank"
 * 
 * Este script:
 * 1. Verifica se já existe customization com slug "portal-outbank"
 * 2. Se não existir, cria uma customization padrão
 * 3. Se necessário, associa a um customer existente
 */
async function createDefaultCustomization() {
  console.log('🎨 Criando customization padrão para portal-outbank...\n');

  try {
    // Verificar se já existe customization com slug "portal-outbank"
    const existing = await db
      .select()
      .from(customerCustomization)
      .where(eq(customerCustomization.slug, 'portal-outbank'))
      .limit(1);

    if (existing.length > 0) {
      console.log('✅ Customization já existe:');
      console.log(`   ID: ${existing[0].id}`);
      console.log(`   Slug: ${existing[0].slug}`);
      console.log(`   Nome: ${existing[0].name}`);
      console.log(`   Customer ID: ${existing[0].customerId || 'N/A'}\n`);
      return;
    }

    // Buscar customer padrão ou o primeiro disponível
    const allCustomers = await db
      .select({
        id: customers.id,
        name: customers.name,
        slug: customers.slug,
      })
      .from(customers)
      .limit(10);

    console.log(`📊 Encontrados ${allCustomers.length} customer(s) disponível(is)\n`);

    let customerId: number | null = null;

    // Tentar encontrar customer com nome relacionado a "outbank" ou "prisma"
    const matchingCustomer = allCustomers.find(c => 
      c.name?.toLowerCase().includes('outbank') ||
      c.name?.toLowerCase().includes('prisma') ||
      c.slug?.toLowerCase().includes('outbank')
    );

    if (matchingCustomer) {
      customerId = matchingCustomer.id;
      console.log(`✅ Usando customer existente: ${matchingCustomer.name} (ID: ${customerId})\n`);
    } else if (allCustomers.length > 0) {
      // Usar o primeiro customer disponível
      customerId = allCustomers[0].id;
      console.log(`⚠️  Usando primeiro customer disponível: ${allCustomers[0].name} (ID: ${customerId})\n`);
    } else {
      console.log('⚠️  Nenhum customer encontrado. Criando customization sem customer_id.\n');
    }

    // Criar customization padrão
    const newCustomization = await db
      .insert(customerCustomization)
      .values({
        slug: 'portal-outbank',
        name: 'Portal OutBank',
        primaryColor: '#000000', // Preto padrão
        secondaryColor: '#666666', // Cinza padrão
        customerId: customerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    console.log('✅ Customization criada com sucesso:');
    console.log(`   ID: ${newCustomization[0].id}`);
    console.log(`   Slug: ${newCustomization[0].slug}`);
    console.log(`   Nome: ${newCustomization[0].name}`);
    console.log(`   Customer ID: ${newCustomization[0].customerId || 'N/A'}\n`);
  } catch (error: any) {
    if (error.code === '23505') {
      // Unique constraint violation - já existe
      console.log('✅ Customization já existe (constraint única detectada)\n');
      
      // Buscar e exibir
      const existing = await db
        .select()
        .from(customerCustomization)
        .where(eq(customerCustomization.slug, 'portal-outbank'))
        .limit(1);

      if (existing.length > 0) {
        console.log(`   ID: ${existing[0].id}`);
        console.log(`   Nome: ${existing[0].name}\n`);
      }
    } else {
      console.error('❌ Erro ao criar customization:', error);
      process.exit(1);
    }
  }
}

// Executar script
createDefaultCustomization().catch(console.error);

