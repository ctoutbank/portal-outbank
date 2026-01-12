import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users } from '../drizzle/schema';
import * as bcrypt from 'bcryptjs';
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

async function createAdmin() {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.error('❌ Uso: npx tsx scripts/create-admin-user.ts <email> <senha>');
        process.exit(1);
    }

    console.log(`🔍 Verificando usuário: ${email}...`);

    try {
        const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

        const hashedPassword = await bcrypt.hash(password, 10);

        if (existingUser.length > 0) {
            console.log('⚠️ Usuário já existe. Atualizando senha e permissões...');
            await db.update(users).set({
                hashedPassword,
                userType: 'SUPER_ADMIN',
                fullAccess: true,
                active: true,
                dtupdate: new Date().toISOString()
            }).where(eq(users.email, email));
            console.log('✅ Usuário atualizado com sucesso!');
        } else {
            console.log('➕ Criando novo usuário Super Admin...');
            await db.insert(users).values({
                email,
                hashedPassword,
                userType: 'SUPER_ADMIN',
                firstName: 'Super',
                lastName: 'Admin',
                slug: 'super-admin-' + Date.now(),
                fullAccess: true,
                active: true,
                idCustomer: null, // Ajuste se necessário
                idProfile: null   // Ajuste se necessário
            });
            console.log('✅ Usuário criado com sucesso!');
        }
    } catch (error) {
        console.error('❌ Erro ao criar/atualizar usuário:', error);
    }
}

createAdmin();
