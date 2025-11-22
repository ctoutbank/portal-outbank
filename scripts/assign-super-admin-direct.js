/**
 * Script para atribuir Super Admin ao cto@outbank.com.br
 * Executa SQL diretamente no banco de dados
 * Executar: node scripts/assign-super-admin-direct.js
 */

const { neon } = require("@neondatabase/serverless");
const { config } = require("dotenv");

// Carregar variáveis de ambiente
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
    console.log("════════════════════════════════════════");
    console.log("  Atribuindo Super Admin ao Usuário");
    console.log("════════════════════════════════════════\n");
    console.log(`📧 Email: ${userEmail}\n`);
    console.log("🔄 Processando...\n");

    // 1. Buscar perfil SUPER_ADMIN (ou ADMIN se não existir)
    console.log("1️⃣  Buscando perfil SUPER_ADMIN...");
    let superAdminProfile = await sql`
      SELECT id, name, description
      FROM profiles
      WHERE UPPER(name) LIKE '%SUPER%'
        AND active = true
      ORDER BY name
      LIMIT 1
    `;

    // Se não encontrar perfil SUPER, buscar perfil ADMIN
    if (!superAdminProfile || superAdminProfile.length === 0) {
      console.log("   ⚠️  Perfil SUPER não encontrado. Buscando perfil ADMIN...");
      superAdminProfile = await sql`
        SELECT id, name, description
        FROM profiles
        WHERE UPPER(name) LIKE '%ADMIN%'
          AND active = true
        ORDER BY name
        LIMIT 1
      `;
    }

    if (!superAdminProfile || superAdminProfile.length === 0) {
      throw new Error("❌ Nenhum perfil ADMIN ou SUPER_ADMIN encontrado. Crie um perfil primeiro.");
    }

    const superAdminProfileId = superAdminProfile[0].id;
    const superAdminProfileName = superAdminProfile[0].name;
    
    console.log(`   ✅ Perfil encontrado: ${superAdminProfileName} (ID: ${superAdminProfileId})\n`);

    // 2. Buscar usuário por email
    console.log("2️⃣  Buscando usuário por email...");
    const userResult = await sql`
      SELECT id, email, active, id_profile
      FROM users
      WHERE LOWER(email) = LOWER(${userEmail})
      LIMIT 1
    `;

    if (!userResult || userResult.length === 0) {
      throw new Error(`❌ Usuário com email ${userEmail} não encontrado.`);
    }

    const userId = userResult[0].id;
    const userCurrentEmail = userResult[0].email;
    const userCurrentProfile = userResult[0].id_profile;
    
    console.log(`   ✅ Usuário encontrado: ${userCurrentEmail} (ID: ${userId})\n`);
    console.log(`   📋 Perfil atual: ${userCurrentProfile}\n`);

    // 3. Atualizar perfil do usuário
    console.log("3️⃣  Atualizando perfil do usuário...");
    await sql`
      UPDATE users
      SET 
        id_profile = ${superAdminProfileId},
        dtupdate = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `;

    console.log(`   ✅ Perfil atualizado com sucesso!\n`);

    // 4. Verificar resultado
    console.log("4️⃣  Verificando resultado...");
    const verifyResult = await sql`
      SELECT 
        u.id,
        u.email,
        u.active,
        p.name as profile_name,
        p.description as profile_description
      FROM users u
      LEFT JOIN profiles p ON p.id = u.id_profile
      WHERE LOWER(u.email) = LOWER(${userEmail})
    `;

    if (verifyResult && verifyResult.length > 0) {
      const user = verifyResult[0];
      
      console.log("════════════════════════════════════════");
      console.log("  ✅ Sucesso! Usuário promovido a Super Admin");
      console.log("════════════════════════════════════════\n");
      console.log(`   User ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Perfil: ${user.profile_name}`);
      console.log(`   Status: ${user.active ? "Ativo" : "Inativo"}`);
      if (user.profile_description) {
        console.log(`   Descrição: ${user.profile_description}`);
      }
      console.log("\n════════════════════════════════════════\n");
    }

    process.exit(0);
  } catch (error) {
    console.error("\n════════════════════════════════════════");
    console.error("  ❌ Erro ao atribuir Super Admin");
    console.error("════════════════════════════════════════\n");
    console.error(`   ${error?.message || error}\n`);
    console.error("════════════════════════════════════════\n");
    process.exit(1);
  }
}

assignSuperAdmin();





