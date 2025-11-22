import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const dbUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Erro: POSTGRES_URL, DATABASE_URL ou NEON_DATABASE_URL não encontrada nas variáveis de ambiente!');
  console.error('Por favor, configure uma dessas variáveis no arquivo .env.local');
  process.exit(1);
}

console.log('📡 Conectando ao banco de dados...');
const sql = neon(dbUrl);

async function assignSuperAdmin() {
  const userEmail = "cto@outbank.com.br";
  
  try {
    console.log('════════════════════════════════════════');
    console.log('  Atribuindo Super Admin ao Usuário');
    console.log('════════════════════════════════════════\n');
    console.log(`📧 Email: ${userEmail}\n`);

    // 1. Buscar perfil SUPER_ADMIN (ou ADMIN se não existir)
    console.log('🔍 Buscando perfil SUPER_ADMIN...');
    let superAdminProfile = await sql`
      SELECT id, name, description, active
      FROM profiles
      WHERE UPPER(name) LIKE '%SUPER%'
        AND active = true
      ORDER BY name
      LIMIT 1
    `;

    // Se não encontrar SUPER, buscar ADMIN
    if (!superAdminProfile || superAdminProfile.length === 0) {
      console.log('   Perfil SUPER não encontrado, buscando perfil ADMIN...');
      superAdminProfile = await sql`
        SELECT id, name, description, active
        FROM profiles
        WHERE UPPER(name) LIKE '%ADMIN%'
          AND active = true
        ORDER BY name
        LIMIT 1
      `;
    }

    if (!superAdminProfile || superAdminProfile.length === 0) {
      throw new Error('Nenhum perfil ADMIN ou SUPER_ADMIN encontrado. Crie um perfil primeiro.');
    }

    const profile = superAdminProfile[0];
    console.log(`✅ Perfil encontrado: ${profile.name} (ID: ${profile.id})\n`);

    // 2. Buscar usuário por email
    console.log(`🔍 Buscando usuário com email ${userEmail}...`);
    const users = await sql`
      SELECT id, email, active, id_profile
      FROM users
      WHERE LOWER(email) = LOWER(${userEmail})
      LIMIT 1
    `;

    if (!users || users.length === 0) {
      throw new Error(`Usuário com email ${userEmail} não encontrado.`);
    }

    const user = users[0];
    console.log(`✅ Usuário encontrado: ${user.email} (ID: ${user.id})\n`);

    // 3. Atualizar perfil do usuário
    console.log('🔄 Atualizando perfil do usuário...');
    await sql`
      UPDATE users
      SET 
        id_profile = ${profile.id},
        dtupdate = CURRENT_TIMESTAMP
      WHERE id = ${user.id}
    `;

    console.log('✅ Perfil atualizado com sucesso!\n');

    // 4. Verificar resultado
    console.log('🔍 Verificando resultado...');
    const updatedUser = await sql`
      SELECT 
        u.id,
        u.email,
        u.active,
        p.name as profile_name,
        p.description as profile_description
      FROM users u
      LEFT JOIN profiles p ON p.id = u.id_profile
      WHERE u.id = ${user.id}
    `;

    if (updatedUser && updatedUser.length > 0) {
      const result = updatedUser[0];
      console.log('════════════════════════════════════════');
      console.log('  ✅ Sucesso! Usuário promovido a Super Admin');
      console.log('════════════════════════════════════════\n');
      console.log(`   User ID: ${result.id}`);
      console.log(`   Email: ${result.email}`);
      console.log(`   Profile: ${result.profile_name}`);
      console.log(`   Profile Description: ${result.profile_description || 'N/A'}`);
      console.log(`   Active: ${result.active ? 'Sim' : 'Não'}`);
      console.log('\n════════════════════════════════════════\n');
    }

    process.exit(0);
  } catch (error: any) {
    console.error('\n════════════════════════════════════════');
    console.error('  ❌ Erro ao atribuir Super Admin');
    console.error('════════════════════════════════════════\n');
    console.error(`   ${error?.message || error}\n`);
    console.error('════════════════════════════════════════\n');
    process.exit(1);
  }
}

assignSuperAdmin();

