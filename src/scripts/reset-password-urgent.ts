import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users } from '../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { clerkClient } from '@clerk/nextjs/server';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);

/**
 * Script URGENTE para resetar senha de usuário
 * 
 * Uso:
 * npx tsx src/scripts/reset-password-urgent.ts email@exemplo.com novaSenha123
 */
async function resetPasswordUrgent(email: string, newPassword: string) {
  console.log('🔐 RESET URGENTE DE SENHA\n');
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Nova senha: ${'*'.repeat(newPassword.length)}\n`);

  if (newPassword.length < 8) {
    console.error('❌ ERRO: A senha deve ter pelo menos 8 caracteres!');
    process.exit(1);
  }

  try {
    const clerk = await clerkClient();

    // Buscar usuário no banco de dados
    console.log('🔍 Buscando usuário no banco de dados...');
    const dbUsers = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email})`)
      .limit(1);

    if (dbUsers.length === 0) {
      console.error('❌ ERRO: Usuário NÃO encontrado no banco de dados!');
      console.log('\n💡 Verificando se existe no Clerk...');
      
      // Tentar buscar no Clerk mesmo assim
      try {
        const clerkUsers = await clerk.users.getUserList({
          emailAddress: [email],
        });

        if (clerkUsers.data.length > 0) {
          console.log(`✅ Encontrado ${clerkUsers.data.length} usuário(s) no Clerk:`);
          for (const clerkUser of clerkUsers.data) {
            console.log(`   - Clerk ID: ${clerkUser.id}`);
            console.log(`   - Nome: ${clerkUser.firstName} ${clerkUser.lastName}`);
            console.log(`\n💡 O usuário existe no Clerk mas não no banco. Resete a senha no Clerk mesmo assim? (Y/N)`);
          }
        } else {
          console.error('❌ Usuário também NÃO encontrado no Clerk!');
          process.exit(1);
        }
      } catch (error: any) {
        console.error(`❌ Erro ao buscar no Clerk: ${error.message}`);
        process.exit(1);
      }
      return;
    }

    const dbUser = dbUsers[0];
    console.log(`✅ Usuário encontrado no banco:`);
    console.log(`   - ID: ${dbUser.id}`);
    console.log(`   - Email: ${dbUser.email}`);
    console.log(`   - ID Clerk: ${dbUser.idClerk || 'N/A'}`);
    console.log(`   - Ativo: ${dbUser.active ? 'Sim' : 'Não'}\n`);

    // Se usuário não está ativo, avisar
    if (!dbUser.active) {
      console.log('⚠️  ATENÇÃO: Usuário está INATIVO no banco de dados!');
      console.log('   A senha será resetada, mas o usuário pode não conseguir fazer login se estiver inativo.\n');
    }

    // Resetar senha no Clerk
    let clerkUserId: string;

    if (dbUser.idClerk) {
      clerkUserId = dbUser.idClerk;
      console.log(`🔧 Resetando senha no Clerk (ID: ${clerkUserId})...`);
      
      try {
        await clerk.users.updateUser(clerkUserId, {
          password: newPassword,
        });
        console.log('✅ Senha resetada com sucesso no Clerk!\n');
      } catch (error: any) {
        console.error(`❌ Erro ao resetar senha no Clerk: ${error.message}`);
        console.log(`\n💡 Tentando buscar no Clerk pelo email...`);
        
        // Tentar buscar no Clerk pelo email
        const clerkUsers = await clerk.users.getUserList({
          emailAddress: [email],
        });

        if (clerkUsers.data.length > 0) {
          clerkUserId = clerkUsers.data[0].id;
          console.log(`✅ Encontrado no Clerk com ID diferente: ${clerkUserId}`);
          console.log(`🔧 Resetando senha...`);
          
          await clerk.users.updateUser(clerkUserId, {
            password: newPassword,
          });
          console.log('✅ Senha resetada com sucesso no Clerk!\n');
          
          // Atualizar ID Clerk no banco
          console.log('🔧 Atualizando ID Clerk no banco de dados...');
          await db
            .update(users)
            .set({
              idClerk: clerkUserId,
              dtupdate: new Date().toISOString(),
            })
            .where(eq(users.id, dbUser.id));
          console.log('✅ ID Clerk atualizado no banco!\n');
        } else {
          console.error('❌ Usuário não encontrado no Clerk!');
          process.exit(1);
        }
      }
    } else {
      console.log('⚠️  Usuário não tem ID Clerk no banco. Buscando no Clerk pelo email...');
      
      const clerkUsers = await clerk.users.getUserList({
        emailAddress: [email],
      });

      if (clerkUsers.data.length === 0) {
        console.error('❌ Usuário não encontrado no Clerk!');
        process.exit(1);
      }

      clerkUserId = clerkUsers.data[0].id;
      console.log(`✅ Encontrado no Clerk: ${clerkUserId}`);
      console.log(`🔧 Resetando senha...`);
      
      await clerk.users.updateUser(clerkUserId, {
        password: newPassword,
      });
      console.log('✅ Senha resetada com sucesso no Clerk!\n');
      
      // Atualizar ID Clerk no banco
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

    // Remover flag de primeiro login (para permitir login normal)
    try {
      await clerk.users.updateUser(clerkUserId, {
        publicMetadata: {
          isFirstLogin: false,
        },
      });
      console.log('✅ Flag de primeiro login removida!\n');
    } catch (error: any) {
      console.log(`⚠️  Aviso: Não foi possível atualizar metadata (não crítico): ${error.message}\n`);
    }

    console.log('='.repeat(60));
    console.log('✅ RESET DE SENHA CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log(`\n📧 Email: ${email}`);
    console.log(`🔑 Nova senha: ${newPassword}`);
    console.log(`\n💡 O usuário pode fazer login agora com a nova senha.\n`);

  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
    process.exit(1);
  }
}

// Verificar argumentos
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('❌ ERRO: Uso incorreto!');
  console.log('\nUso:');
  console.log('  npx tsx src/scripts/reset-password-urgent.ts email@exemplo.com novaSenha123');
  console.log('\nExemplo:');
  console.log('  npx tsx src/scripts/reset-password-urgent.ts cto@outbank.com.br MinhaSenha123!');
  process.exit(1);
}

resetPasswordUrgent(email, newPassword).catch(console.error);

