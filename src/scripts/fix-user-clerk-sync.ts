import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users } from '../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { clerkClient } from '@clerk/nextjs/server';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);

/**
 * Script para corrigir sincronização entre Clerk e Prisma
 * 
 * Este script:
 * 1. Encontra usuários no banco sem ID Clerk
 * 2. Busca correspondência no Clerk por email
 * 3. Atualiza o ID Clerk no banco de dados
 */
async function fixUserClerkSync(dryRun: boolean = true) {
  console.log(`🔧 ${dryRun ? '[DRY RUN] ' : ''}Corrigindo sincronização Clerk-Prisma...\n`);

  try {
    const clerk = await clerkClient();

    // Buscar usuários sem ID Clerk
    const usersWithoutClerkId = await db
      .select({
        id: users.id,
        email: users.email,
        idClerk: users.idClerk,
        active: users.active,
        idCustomer: users.idCustomer,
      })
      .from(users)
      .where(sql`${users.idClerk} IS NULL OR ${users.idClerk} = ''`)
      .limit(100);

    console.log(`📊 Encontrados ${usersWithoutClerkId.length} usuários sem ID Clerk\n`);

    if (usersWithoutClerkId.length === 0) {
      console.log('✅ Todos os usuários já estão sincronizados!\n');
      return;
    }

    let fixedCount = 0;
    let notFoundCount = 0;

    for (const dbUser of usersWithoutClerkId) {
      if (!dbUser.email) {
        console.log(`⚠️  Usuário ID ${dbUser.id}: Sem email, pulando...`);
        continue;
      }

      console.log(`🔍 Buscando no Clerk: ${dbUser.email}...`);

      try {
        // Buscar no Clerk por email
        const clerkUsers = await clerk.users.getUserList({
          emailAddress: [dbUser.email],
        });

        if (clerkUsers.data.length === 0) {
          notFoundCount++;
          console.log(`   ❌ Não encontrado no Clerk`);
          continue;
        }

        // Usar o primeiro resultado (em teoria deveria ser único)
        const clerkUser = clerkUsers.data[0];
        console.log(`   ✅ Encontrado no Clerk: ${clerkUser.id} (${clerkUser.firstName} ${clerkUser.lastName})`);

        if (!dryRun) {
          // Atualizar banco de dados
          await db
            .update(users)
            .set({
              idClerk: clerkUser.id,
              dtupdate: new Date().toISOString(),
            })
            .where(eq(users.id, dbUser.id));

          console.log(`   ✅ Atualizado no banco de dados`);
          fixedCount++;
        } else {
          console.log(`   [DRY RUN] Seria atualizado no banco de dados`);
          fixedCount++;
        }
      } catch (error: any) {
        console.log(`   ❌ Erro ao buscar no Clerk: ${error.message}`);
        notFoundCount++;
      }

      console.log('');
    }

    console.log('='.repeat(60));
    console.log('📊 RESUMO:');
    console.log(`   ${dryRun ? '[DRY RUN] ' : ''}✅ Corrigidos: ${fixedCount}`);
    console.log(`   ❌ Não encontrados no Clerk: ${notFoundCount}`);
    console.log('='.repeat(60));

    if (dryRun && fixedCount > 0) {
      console.log('\n💡 Para aplicar as correções, execute:');
      console.log('   npm run fix-user-sync -- --apply\n');
    }
  } catch (error) {
    console.error('❌ Erro ao corrigir sincronização:', error);
    process.exit(1);
  }
}

// Verificar argumentos
const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');

async function run() {
  if (!dryRun) {
    console.log('⚠️  ATENÇÃO: Executando em modo APLICAR (não é dry-run)!\n');
    // Aguardar confirmação
    console.log('Pressione Ctrl+C para cancelar ou aguarde 3 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  await fixUserClerkSync(dryRun);
}

run().catch(console.error);

