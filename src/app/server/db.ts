import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Cria o client do Neon
export const db = neon(process.env.POSTGRES_URL!);

// Cliente Drizzle ORM (para consultas tipadas, se quiser usar depois)
export const vercelSql = drizzle(db);

export const sql = vercelSql;

