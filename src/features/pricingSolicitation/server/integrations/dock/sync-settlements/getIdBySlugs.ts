import { Client, ClientConfig } from "pg";
import { dbConfig } from "../../../../server/db/pgConfig";

export async function getIdBySlugs(
  tableName: string,
  slugs: string[]
): Promise<[{ id: number; slug: string }] | null> {
  const client = new Client(dbConfig as ClientConfig);
  try {
    await client.connect();
    const slugsString = `'${slugs.join(`','`)}'`;
    const result: any = await client.query(
      `SELECT id, slug FROM ${tableName} WHERE slug in (${slugsString})`
    );
    return result.rows;
  } catch (error) {
    console.error(`Erro ao buscar ID na tabela ${tableName}`, error);
    return null;
  }
}
