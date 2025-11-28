/**
 * Script para resetar a senha do usuário cto@outbank.com.br
 * 
 * Execute com: npx tsx scripts/reset-password-cto.ts
 * 
 * IMPORTANTE: Configure as variáveis de ambiente:
 * - CLERK_SECRET_KEY: Chave secreta do Clerk
 * - DATABASE_URL ou POSTGRES_URL: URL de conexão do banco
 */

import { clerkClient } from "@clerk/nextjs/server";
import { config } from "dotenv";

config({ path: ".env.local" });

const USER_EMAIL = "cto@outbank.com.br";
const NEW_PASSWORD = "Outb@nkiso2025!"; // Nova senha segura

async function resetPassword() {
  try {
    console.log("🔐 Iniciando reset de senha...");
    console.log(`📧 Email: ${USER_EMAIL}`);
    
    // Verificar se CLERK_SECRET_KEY está configurado
    if (!process.env.CLERK_SECRET_KEY) {
      throw new Error("CLERK_SECRET_KEY não está configurado no .env.local");
    }

    // Inicializar Clerk Client
    const clerk = await clerkClient();
    
    // Buscar usuário por email
    console.log("🔍 Buscando usuário...");
    const usersResponse = await clerk.users.getUserList({
      emailAddress: [USER_EMAIL],
    });

    const users = usersResponse.data || [];

    if (users.length === 0) {
      throw new Error(`Usuário com email ${USER_EMAIL} não encontrado no Clerk`);
    }

    const user = users[0];
    console.log(`✅ Usuário encontrado: ${user.id}`);

    // Resetar senha
    console.log("🔄 Resetando senha...");
    await clerk.users.updateUser(user.id, {
      password: NEW_PASSWORD,
      skipPasswordChecks: false, // Manter validações de segurança
    });

    console.log("✅ Senha resetada com sucesso!");
    console.log(`🔑 Nova senha: ${NEW_PASSWORD}`);
    console.log("\n⚠️  IMPORTANTE: Altere esta senha após o primeiro login!");
    
  } catch (error: any) {
    console.error("❌ Erro ao resetar senha:", error.message);
    
    if (error.errors) {
      console.error("Detalhes do erro:", JSON.stringify(error.errors, null, 2));
    }
    
    process.exit(1);
  }
}

// Executar
resetPassword();

