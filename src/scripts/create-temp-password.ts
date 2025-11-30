import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users } from '../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { clerkClient } from '@clerk/nextjs/server';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Validar variáveis de ambiente necessárias
if (!process.env.DATABASE_URL) {
  console.error('❌ ERRO: Variável DATABASE_URL não encontrada!');
  process.exit(1);
}

if (!process.env.CLERK_SECRET_KEY) {
  console.error('❌ ERRO: Variável CLERK_SECRET_KEY não encontrada!');
  process.exit(1);
}

const sqlClient = neon(process.env.DATABASE_URL);
const db = drizzle(sqlClient);

/**
 * Script para criar senha temporária e restaurar acesso
 */
async function createTempPassword(email: string) {
  console.log('🔐 CRIANDO SENHA TEMPORÁRIA\n');
  console.log(`📧 Email: ${email}\n`);

  try {
    const clerk = await clerkClient();

    // Gerar senha temporária segura
    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!A1`;
    
    console.log(`🔑 Senha temporária gerada: ${tempPassword}\n`);

    // ========================================
    // 1. BUSCAR USUÁRIO NO BANCO DE DADOS
    // ========================================
    console.log('🔍 Buscando usuário no banco de dados...');
    const dbUsers = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email})`)
      .limit(1);

    if (dbUsers.length === 0) {
      console.error('❌ ERRO: Usuário não encontrado no banco de dados!');
      process.exit(1);
    }

    const dbUser = dbUsers[0];
    console.log(`✅ Usuário encontrado no banco (ID: ${dbUser.id})\n`);

    // ========================================
    // 2. BUSCAR NO CLERK
    // ========================================
    console.log('🔍 Buscando usuário no Clerk...');
    let clerkUserId: string | null = dbUser.idClerk || null;

    if (!clerkUserId) {
      const clerkUsers = await clerk.users.getUserList({
        emailAddress: [email],
      });

      if (clerkUsers.data.length === 0) {
        console.error('❌ ERRO: Usuário não encontrado no Clerk!');
        process.exit(1);
      }

      clerkUserId = clerkUsers.data[0].id;
      console.log(`✅ Encontrado no Clerk (ID: ${clerkUserId})`);
      
      // Atualizar ID Clerk no banco
      await db
        .update(users)
        .set({
          idClerk: clerkUserId,
          dtupdate: new Date().toISOString(),
        })
        .where(eq(users.id, dbUser.id));
      console.log('✅ ID Clerk sincronizado no banco\n');
    } else {
      console.log(`✅ Usuário encontrado no Clerk (ID: ${clerkUserId})\n`);
    }

    // ========================================
    // 3. ATIVAR USUÁRIO NO BANCO
    // ========================================
    if (!dbUser.active) {
      console.log('🔧 Ativando usuário no banco...');
      await db
        .update(users)
        .set({
          active: true,
          dtupdate: new Date().toISOString(),
        })
        .where(eq(users.id, dbUser.id));
      console.log('✅ Usuário ativado no banco!\n');
    }

    // ========================================
    // 4. RESETAR SENHA NO CLERK
    // ========================================
    console.log('🔧 Resetando senha no Clerk...');
    await clerk.users.updateUser(clerkUserId, {
      password: tempPassword,
      publicMetadata: {
        isFirstLogin: false,
      },
    });
    console.log('✅ Senha resetada no Clerk!\n');

    // ========================================
    // 5. REMOVER FLAGS DE PRIMEIRO LOGIN
    // ========================================
    console.log('🔧 Removendo flags de primeiro login...');
    const clerkUser = await clerk.users.getUser(clerkUserId);
    await clerk.users.updateUser(clerkUserId, {
      publicMetadata: {
        ...(clerkUser.publicMetadata as any || {}),
        isFirstLogin: false,
      },
    });
    console.log('✅ Flags removidas!\n');

    // ========================================
    // RESUMO FINAL
    // ========================================
    console.log('='.repeat(70));
    console.log('✅ SENHA TEMPORÁRIA CRIADA COM SUCESSO!');
    console.log('='.repeat(70));
    console.log(`\n📧 Email: ${email}`);
    console.log(`🔑 Senha temporária: ${tempPassword}`);
    console.log(`\n💡 PRÓXIMOS PASSOS:`);
    console.log(`   1. Use esta senha para fazer login`);
    console.log(`   2. Após o login, altere a senha para uma mais segura`);
    console.log(`   3. Teste em: https://portal-outbank.vercel.app`);
    console.log(`   4. Teste em: https://bancoprisma.consolle.one\n`);

  } catch (error: any) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Verificar argumentos
const email = process.argv[2];

if (!email) {
  console.error('❌ ERRO: Email é obrigatório!');
  console.log('\nUso:');
  console.log('  npx tsx src/scripts/create-temp-password.ts email@exemplo.com');
  console.log('\nExemplo:');
  console.log('  npx tsx src/scripts/create-temp-password.ts cto@outbank.com.br');
  process.exit(1);
}

createTempPassword(email).catch(console.error);

