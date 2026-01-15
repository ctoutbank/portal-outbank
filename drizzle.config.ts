import * as dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: 'env.local' });
dotenv.config({ path: '.env' });

export default defineConfig({
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',
  },
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
});
