// lib/db.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import * as schema from "../../drizzle/schema";

config({ path: ".env" });

const dbUrl = process.env.POSTGRES_URL;


if (!dbUrl) {
  throw new Error("DATABASE_URL não está definida!");
}

const sql = neon(dbUrl);

export const db = drizzle(sql, { schema });  // <- aqui passa o schema!

export * from "../../drizzle/schema"
