/**
 * Script para atribuir Super Admin a um usuário
 * Executar: npx tsx scripts/assign-super-admin.ts
 */

import { config } from "dotenv";

// Carregar variáveis de ambiente
config({ path: ".env.local" });

// Importar após carregar env
import { assignSuperAdminToUser } from "../src/features/users/server/admin-users";

async function main() {
  const email = "cto@outbank.com.br";
  
  try {
    console.log("════════════════════════════════════════");
    console.log("  Atribuindo Super Admin ao Usuário");
    console.log("════════════════════════════════════════\n");
    console.log(`📧 Email: ${email}\n`);
    console.log("🔄 Processando...\n");
    
    const result = await assignSuperAdminToUser(email);
    
    console.log("════════════════════════════════════════");
    console.log("  ✅ Sucesso! Usuário promovido a Super Admin");
    console.log("════════════════════════════════════════\n");
    console.log(`   User ID: ${result.userId}`);
    console.log(`   Email: ${result.email}`);
    console.log(`   Profile ID: ${result.profileId}`);
    console.log(`   Profile Name: ${result.profileName}`);
    console.log("\n════════════════════════════════════════\n");
  } catch (error: any) {
    console.error("\n════════════════════════════════════════");
    console.error("  ❌ Erro ao atribuir Super Admin");
    console.error("════════════════════════════════════════\n");
    console.error(`   ${error?.message || error}\n`);
    console.error("════════════════════════════════════════\n");
    process.exit(1);
  }
}

main();
