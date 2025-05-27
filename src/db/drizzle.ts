import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env" }); // or .env.local

neonConfig.fetchConnectionCache = true;

// Usar a URL fornecida ou cair para a variável de ambiente
const dbUrl = process.env.DATABASE_URL || "postgresql://outbank_owner:UPjyn54wJgXO@ep-bold-field-a5mbqp2a-pooler.us-east-2.aws.neon.tech/outbank?sslmode=require";

if (!dbUrl) {
  console.error("DATABASE_URL não está definida!");
  throw new Error("DATABASE_URL não está definida!");
}

let sql;
try {
  sql = neon(dbUrl);
  console.log("Conexão com o banco de dados estabelecida com sucesso");
} catch (error) {
  console.error("Erro ao conectar ao banco de dados:", error);
  throw error;
}

export const db = drizzle(sql);
