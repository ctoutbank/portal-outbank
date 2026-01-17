import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users } from '../drizzle/schema';
import { hashPassword } from '../src/app/utils/password';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!dbUrl) {
    console.error('❌ Erro: DATABASE_URL ou POSTGRES_URL não definida.');
    process.exit(1);
}

const sql = neon(dbUrl);
const db = drizzle(sql);

async function migratePassword() {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.error('❌ Uso: npx tsx scripts/migrate-password.ts <email> <senha>');
        process.exit(1);
    }

    console.log(`🔍 Buscando usuário: ${email}...`);

    try {
        const existingUser = await db.select({
            id: users.id,
            hashedPassword: users.hashedPassword
        }).from(users).where(eq(users.email, email)).limit(1);

        if (existingUser.length === 0) {
            console.error('❌ Usuário não encontrado.');
            process.exit(1);
        }

        const currentHash = existingUser[0].hashedPassword;
        const hashType = currentHash?.length === 96 ? 'scrypt' : 'bcrypt';

        console.log(`📊 Hash atual: ${hashType} (${currentHash?.length} caracteres)`);

        if (hashType === 'scrypt') {
            console.log('✅ Senha já está em formato scrypt. Nenhuma ação necessária.');
            process.exit(0);
        }

        // Criar novo hash com scrypt
        const newHash = hashPassword(password);
        console.log(`🔄 Convertendo para scrypt (${newHash.length} caracteres)...`);

        await db.update(users).set({
            hashedPassword: newHash,
            dtupdate: new Date().toISOString()
        }).where(eq(users.email, email));

        console.log('✅ Senha migrada para scrypt com sucesso!');
        console.log('⚡ O próximo login será ~100x mais rápido.');
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

migratePassword();
