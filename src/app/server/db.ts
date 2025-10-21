import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Cria o client do Neon
export const neonClient = neon(process.env.DATABASE_URL!);

// Cliente Drizzle ORM (para consultas tipadas, se quiser usar depois)
export const db = drizzle(neonClient);

// Adapter SQL simples, compatível com sql.query()
export const sql = {
  query: async (text: string, params?: any[]) => {
    // neonClient aceita (text, ...params)
   
    const rows = await neonClient(text, ...(params ?? []));
    return { rows };
  },
  querySingle: async (text: string, params?: any[]) => {
    const res = await sql.query(text, params);
    return res.rows?.[0];
  },
};
