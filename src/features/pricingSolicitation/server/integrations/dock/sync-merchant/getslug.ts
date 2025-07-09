import { db } from "@/server/db";
import { sql } from "drizzle-orm";


export async function getIdBySlug(
  tableName: string,
  slug: string
): Promise<number | null> {
  console.log(`Buscando ID na tabela ${tableName} para slug ${slug}`);
  try {
    const result = await db.execute(
      sql`SELECT id FROM ${sql.identifier(tableName)} WHERE slug = ${slug}`
    );
    console.log(`Resultado da busca: ${result.rows[0]?.id}`);
    return Number(result.rows[0]?.id) || null;
  } catch (error) {
    console.error(
      `Erro ao buscar ID na tabela ${tableName} para slug ${slug}:`,
      error
    );
    return null;
  }
}
