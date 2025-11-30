import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { users } from '../../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { clerkClient } from '@clerk/nextjs/server';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);

/**
 * Script para validar autenticação de usuários ISO
 * Verifica sincronização entre Clerk e Prisma/banco de dados
 */
async function validateUserAuth(email?: string) {
  console.log('🔍 Validando autenticação de usuários...\n');

  try {
    const clerk = await clerkClient();

    // Se email foi fornecido, validar apenas esse usuário
    if (email) {
      console.log(`📧 Validando usuário: ${email}\n`);
      
      // Buscar no banco de dados
      const dbUsers = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.email}) = LOWER(${email})`)
        .limit(10);

      if (dbUsers.length === 0) {
        console.log('❌ Usuário NÃO encontrado no banco de dados');
        return;
      }

      console.log(`✅ Encontrado ${dbUsers.length} registro(s) no banco de dados:\n`);

      for (const dbUser of dbUsers) {
        console.log(`   ID: ${dbUser.id}`);
        console.log(`   Email: ${dbUser.email}`);
        console.log(`   ID Clerk: ${dbUser.idClerk || 'N/A'}`);
        console.log(`   Ativo: ${dbUser.active ? 'Sim' : 'Não'}`);
        console.log(`   ID Customer: ${dbUser.idCustomer || 'N/A'}`);

        // Verificar no Clerk
        if (dbUser.idClerk) {
          try {
            const clerkUser = await clerk.users.getUser(dbUser.idClerk);
            console.log(`   ✅ Usuário encontrado no Clerk:`);
            console.log(`      - Clerk ID: ${clerkUser.id}`);
            console.log(`      - Nome: ${clerkUser.firstName} ${clerkUser.lastName}`);
            console.log(`      - Email Clerk: ${clerkUser.emailAddresses[0]?.emailAddress || 'N/A'}`);
            console.log(`      - Criado em: ${new Date(clerkUser.createdAt).toLocaleString()}`);
            
            // Verificar se email bate
            const clerkEmail = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase();
            const dbEmail = dbUser.email?.toLowerCase();
            if (clerkEmail !== dbEmail) {
              console.log(`      ⚠️  EMAIL DIFERENTE! DB: ${dbEmail}, Clerk: ${clerkEmail}`);
            }
          } catch (error: any) {
            console.log(`   ❌ Erro ao buscar usuário no Clerk: ${error.message}`);
            console.log(`      - Usuário pode não existir no Clerk ou ID está incorreto`);
          }
        } else {
          console.log(`   ⚠️  Usuário não tem ID Clerk (não sincronizado)`);
        }

        console.log('');
      }

      // Tentar buscar no Clerk diretamente pelo email
      console.log(`🔍 Buscando no Clerk por email: ${email}\n`);
      try {
        const clerkUsers = await clerk.users.getUserList({
          emailAddress: [email],
        });

        if (clerkUsers.data.length > 0) {
          console.log(`✅ Encontrado ${clerkUsers.data.length} usuário(s) no Clerk:\n`);
          for (const clerkUser of clerkUsers.data) {
            console.log(`   Clerk ID: ${clerkUser.id}`);
            console.log(`   Nome: ${clerkUser.firstName} ${clerkUser.lastName}`);
            console.log(`   Email: ${clerkUser.emailAddresses[0]?.emailAddress || 'N/A'}`);
            console.log(`   Criado em: ${new Date(clerkUser.createdAt).toLocaleString()}`);
            console.log('');
          }
        } else {
          console.log(`❌ Usuário NÃO encontrado no Clerk\n`);
        }
      } catch (error: any) {
        console.log(`❌ Erro ao buscar no Clerk: ${error.message}\n`);
      }
    } else {
      // Validar todos os usuários
      console.log('📊 Validando todos os usuários...\n');

      const allDbUsers = await db
        .select({
          id: users.id,
          email: users.email,
          idClerk: users.idClerk,
          active: users.active,
          idCustomer: users.idCustomer,
        })
        .from(users)
        .limit(100);

      console.log(`Total de usuários no banco: ${allDbUsers.length}\n`);

      let syncedCount = 0;
      let unsyncedCount = 0;
      let notInClerkCount = 0;

      for (const dbUser of allDbUsers) {
        if (!dbUser.idClerk) {
          unsyncedCount++;
          console.log(`⚠️  ID ${dbUser.id} (${dbUser.email}): SEM ID CLERK`);
          continue;
        }

        try {
          const clerkUser = await clerk.users.getUser(dbUser.idClerk);
          syncedCount++;

          // Verificar se email bate
          const clerkEmail = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase();
          const dbEmail = dbUser.email?.toLowerCase();
          if (clerkEmail !== dbEmail) {
            console.log(`⚠️  ID ${dbUser.id}: Email diferente - DB: ${dbEmail}, Clerk: ${clerkEmail}`);
          }
        } catch (error: any) {
          notInClerkCount++;
          console.log(`❌ ID ${dbUser.id} (${dbUser.email}): Não encontrado no Clerk (ID Clerk: ${dbUser.idClerk})`);
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log('📊 RESUMO:');
      console.log(`   ✅ Sincronizados: ${syncedCount}`);
      console.log(`   ⚠️  Sem ID Clerk: ${unsyncedCount}`);
      console.log(`   ❌ Não encontrados no Clerk: ${notInClerkCount}`);
      console.log('='.repeat(60));
    }
  } catch (error) {
    console.error('❌ Erro ao validar usuários:', error);
    process.exit(1);
  }
}

// Executar script
const email = process.argv[2]; // Email opcional passado como argumento
validateUserAuth(email).catch(console.error);

