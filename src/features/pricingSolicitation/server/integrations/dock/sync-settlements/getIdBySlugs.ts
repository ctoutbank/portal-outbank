import { Client, ClientConfig } from "pg";

// Database connection configuration
const dbConfig: ClientConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: true,
};

type QueryResult = {
  rows: Array<{ id: number; slug: string }>;
};

export async function getIdBySlugs(
  tableName: string,
  slugs: string[]
): Promise<Array<{ id: number; slug: string }> | null> {
  const client = new Client(dbConfig as ClientConfig);
  try {
    await client.connect();
    const slugsString = `'${slugs.join(`','`)}'`;
    const result: QueryResult = await client.query(
      `SELECT id, slug FROM ${tableName} WHERE slug in (${slugsString})`
    );
    return result.rows;
  } catch (error) {
    console.error(`Erro ao buscar ID na tabela ${tableName}`, error);
    return null;
  }
}
