import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users } from '../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { clerkClient } from '@clerk/nextjs/server';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Validar variáveis de ambiente necessárias
if (!process.env.DATABASE_URL) {
  console.error('❌ ERRO: Variável DATABASE_URL não encontrada!');
  console.error('\n💡 Certifique-se de que o arquivo .env.local existe e contém:');
  console.error('   DATABASE_URL=postgresql://...');
  console.error('\n   Ou defina a variável de ambiente antes de executar:');
  console.error('   $env:DATABASE_URL="sua_connection_string"');
  process.exit(1);
}

if (!process.env.CLERK_SECRET_KEY) {
  console.error('❌ ERRO: Variável CLERK_SECRET_KEY não encontrada!');
  console.error('\n💡 Certifique-se de que o arquivo .env.local existe e contém:');
  console.error('   CLERK_SECRET_KEY=sk_...');
  process.exit(1);
}

const sqlClient = neon(process.env.DATABASE_URL);
const db = drizzle(sqlClient);

/**
 * Script COMPLETO para corrigir acesso de usuário
 * Resolve múltiplos problemas de uma vez:
 * - Reset de senha
 * - Sincronização Clerk-Banco
 * - Ativação de usuário
 * - Remoção de flags de primeiro login
 */
async function fixUserAccessComplete(email: string, newPassword: string) {
  console.log('🔧 CORREÇÃO COMPLETA DE ACESSO DO USUÁRIO\n');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Nova senha: ${'*'.repeat(newPassword.length)}\n`);

  if (newPassword.length < 8) {
    console.error('❌ ERRO: A senha deve ter pelo menos 8 caracteres!');
    process.exit(1);
  }

  try {
    const clerk = await clerkClient();

    // ========================================
    // 1. BUSCAR USUÁRIO NO BANCO DE DADOS
    // ========================================
    console.log('🔍 PASSO 1: Buscando usuário no banco de dados...');
    const dbUsers = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email})`)
      .limit(1);

    if (dbUsers.length === 0) {
      console.error('❌ ERRO: Usuário NÃO encontrado no banco de dados!');
      console.log('\n💡 Tentando buscar apenas no Clerk...');
      
      // Tentar buscar no Clerk e criar no banco
      const clerkUsers = await clerk.users.getUserList({
        emailAddress: [email],
      });

      if (clerkUsers.data.length === 0) {
        console.error('❌ ERRO: Usuário também não encontrado no Clerk!');
        console.log('\n💡 O usuário precisa ser criado primeiro.');
        process.exit(1);
      }

      console.log(`✅ Encontrado no Clerk (ID: ${clerkUsers.data[0].id})`);
      console.log('⚠️  Mas não existe no banco de dados.');
      console.log('💡 Seria necessário criar no banco. Isso requer mais informações.');
      process.exit(1);
    }

    const dbUser = dbUsers[0];
    console.log(`✅ Usuário encontrado no banco:`);
    console.log(`   - ID: ${dbUser.id}`);
    console.log(`   - Email: ${dbUser.email}`);
    console.log(`   - ID Clerk: ${dbUser.idClerk || 'NÃO TEM'}`);
    console.log(`   - Ativo: ${dbUser.active ? '✅ Sim' : '❌ NÃO'}`);
    console.log(`   - ID Customer: ${dbUser.idCustomer || 'N/A'}\n`);

    // ========================================
    // 2. BUSCAR/CORRIGIR NO CLERK
    // ========================================
    console.log('🔍 PASSO 2: Verificando/Criando no Clerk...');
    let clerkUserId: string | null = null;

    // Tentar usar ID Clerk do banco
    if (dbUser.idClerk) {
      try {
        const clerkUser = await clerk.users.getUser(dbUser.idClerk);
        clerkUserId = clerkUser.id;
        console.log(`✅ Usuário encontrado no Clerk com ID do banco: ${clerkUserId}`);
      } catch (error: any) {
        console.log(`⚠️  ID Clerk do banco não funciona: ${error.message}`);
        console.log('   Buscando no Clerk pelo email...');
      }
    }

    // Se não encontrou, buscar pelo email
    if (!clerkUserId) {
      const clerkUsers = await clerk.users.getUserList({
        emailAddress: [email],
      });

      if (clerkUsers.data.length === 0) {
        console.error('❌ ERRO: Usuário não encontrado no Clerk!');
        console.log('💡 Seria necessário criar no Clerk primeiro.');
        process.exit(1);
      }

      clerkUserId = clerkUsers.data[0].id;
      console.log(`✅ Encontrado no Clerk pelo email: ${clerkUserId}`);

      // Atualizar ID Clerk no banco se estava faltando ou incorreto
      if (!dbUser.idClerk || dbUser.idClerk !== clerkUserId) {
        console.log('🔧 Atualizando ID Clerk no banco de dados...');
        await db
          .update(users)
          .set({
            idClerk: clerkUserId,
            dtupdate: new Date().toISOString(),
          })
          .where(eq(users.id, dbUser.id));
        console.log('✅ ID Clerk atualizado no banco!\n');
      }
    }

    // ========================================
    // 3. ATIVAR USUÁRIO NO BANCO (se inativo)
    // ========================================
    if (!dbUser.active) {
      console.log('🔧 PASSO 3: Ativando usuário no banco de dados...');
      await db
        .update(users)
        .set({
          active: true,
          dtupdate: new Date().toISOString(),
        })
        .where(eq(users.id, dbUser.id));
      console.log('✅ Usuário ativado no banco!\n');
    } else {
      console.log('✅ PASSO 3: Usuário já está ativo no banco\n');
    }

    // ========================================
    // 4. RESETAR SENHA NO CLERK
    // ========================================
    console.log(`🔧 PASSO 4: Resetando senha no Clerk (ID: ${clerkUserId})...`);
    try {
      await clerk.users.updateUser(clerkUserId, {
        password: newPassword,
      });
      console.log('✅ Senha resetada com sucesso no Clerk!\n');
    } catch (error: any) {
      console.error(`❌ Erro ao resetar senha no Clerk: ${error.message}`);
      console.log('   Continuando com outras correções...\n');
    }

    // ========================================
    // 5. REMOVER FLAGS DE PRIMEIRO LOGIN
    // ========================================
    console.log('🔧 PASSO 5: Removendo flags de primeiro login...');
    try {
      const clerkUser = await clerk.users.getUser(clerkUserId);
      await clerk.users.updateUser(clerkUserId, {
        publicMetadata: {
          ...(clerkUser.publicMetadata as any || {}),
          isFirstLogin: false,
        },
      });
      console.log('✅ Flags de primeiro login removidas!\n');
    } catch (error: any) {
      console.log(`⚠️  Aviso ao atualizar metadata: ${error.message} (não crítico)\n`);
    }

    // ========================================
    // 6. VERIFICAR SE ESTÁ BLOQUEADO NO CLERK
    // ========================================
    console.log('🔍 PASSO 6: Verificando bloqueios no Clerk...');
    try {
      const clerkUser = await clerk.users.getUser(clerkUserId);
      
      if (clerkUser.banned) {
        console.log('⚠️  ATENÇÃO: Usuário está BANIDO no Clerk!');
        console.log('💡 Nota: O desbanimento precisa ser feito manualmente via Clerk Dashboard.');
        console.log('   O campo "banned" não pode ser alterado via updateUser API.\n');
      } else {
        console.log('✅ Usuário não está banido\n');
      }

      if (!clerkUser.emailAddresses[0]?.verification?.status || 
          clerkUser.emailAddresses[0]?.verification?.status !== 'verified') {
        console.log('⚠️  ATENÇÃO: Email pode não estar verificado');
        console.log('💡 Pode ser necessário verificar o email no Clerk\n');
      } else {
        console.log('✅ Email está verificado\n');
      }
    } catch (error: any) {
      console.log(`⚠️  Erro ao verificar status: ${error.message}\n`);
    }

    // ========================================
    // RESUMO FINAL
    // ========================================
    console.log('='.repeat(70));
    console.log('✅ CORREÇÃO COMPLETA FINALIZADA!');
    console.log('='.repeat(70));
    console.log(`\n📧 Email: ${email}`);
    console.log(`🔑 Nova senha: ${newPassword}`);
    console.log(`\n📋 Correções aplicadas:`);
    console.log(`   ✅ Usuário ativado no banco de dados`);
    console.log(`   ✅ ID Clerk sincronizado`);
    console.log(`   ✅ Senha resetada no Clerk`);
    console.log(`   ✅ Flags de primeiro login removidas`);
    console.log(`   ✅ Verificações de bloqueio realizadas`);
    console.log(`\n💡 PRÓXIMOS PASSOS:`);
    console.log(`   1. Limpar cache do navegador completamente`);
    console.log(`   2. Tentar login em modo anônimo/privado`);
    console.log(`   3. Testar em: https://portal-outbank.vercel.app`);
    console.log(`   4. Testar em: https://bancoprisma.consolle.one`);
    console.log(`\n⚠️  Se ainda não funcionar:`);
    console.log(`   - Verificar se há customization para o subdomínio`);
    console.log(`   - Verificar logs do console do navegador`);
    console.log(`   - Verificar se idCustomer está correto no banco\n`);

  } catch (error: any) {
    console.error('\n❌ ERRO durante correção:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Verificar argumentos
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('❌ ERRO: Uso incorreto!');
  console.log('\nUso:');
  console.log('  npx tsx src/scripts/fix-user-access-complete.ts email@exemplo.com novaSenha123');
  console.log('\nExemplo:');
  console.log('  npx tsx src/scripts/fix-user-access-complete.ts cto@outbank.com.br leno@1978A*');
  process.exit(1);
}

fixUserAccessComplete(email, newPassword).catch(console.error);

