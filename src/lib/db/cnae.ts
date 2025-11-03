import { sql } from '@vercel/postgres';
import { Category } from '@/types/fornecedor';

export class CnaesRepository {
  // Listar todos os CNAEs
  async getAll(search?: string) {
    let query = 'SELECT * FROM cnaes';
    // @typescript-eslint/no-explicit-any
    const params: unknown[] = [];

    if (search) {
      query += ' WHERE codigo ILIKE $1 OR descricao ILIKE $1';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY codigo ASC';

    const { rows } = await sql.query(query, params);
    return rows as Category[];
  }

  // Buscar por ID
  async findById(id: string) {
    const { rows } = await sql.query(
      'SELECT * FROM cnaes WHERE id = $1',
      [id]
    );
    return rows[0] as Category || null;
  }

  // Buscar por código
  async findByCodigo(codigo: string) {
    const { rows } = await sql.query(
      'SELECT * FROM cnaes WHERE codigo = $1',
      [codigo]
    );
    return rows[0] as Category || null;
  }

  // Criar CNAE
  async create(codigo: string, descricao: string) {
    const { rows } = await sql.query(
      `INSERT INTO cnaes (codigo, descricao)
       VALUES ($1, $2)
       RETURNING *`,
      [codigo, descricao]
    );
    return rows[0] as Category;
  }

  // Atualizar CNAE
  async update(id: string, codigo: string, descricao: string) {
    const { rows } = await sql.query(
      `UPDATE cnaes 
       SET codigo = $1, descricao = $2
       WHERE id = $3
       RETURNING *`,
      [codigo, descricao, id]
    );
    return rows[0] as Category;
  }

  // Deletar CNAE
  async delete(id: string) {
    await sql.query('DELETE FROM cnaes WHERE id = $1', [id]);
  }
}

export const cnaesRepository = new CnaesRepository();
