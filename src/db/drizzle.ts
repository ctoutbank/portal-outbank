// lib/db.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import * as schema from "../../drizzle/schema";

config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;

let _db: ReturnType<typeof drizzle> | null = null;

if (dbUrl) {
  const sql = neon(dbUrl);
  _db = drizzle(sql, { schema });
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    if (!_db) {
      throw new Error("DATABASE_URL não está definida! Configure DATABASE_URL, POSTGRES_URL ou NEON_DATABASE_URL.");
    }
    return Reflect.get(_db, prop);
  }
});

export * from "../../drizzle/schema"
