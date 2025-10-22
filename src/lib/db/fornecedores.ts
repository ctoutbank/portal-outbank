import { sql } from '@vercel/postgres';
import { FornecedorFormData } from '@/types/fornecedor';

export class FornecedoresRepository {
  // Listar com paginação, filtros e CNAEs
  async getAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string;
      ativo?: boolean;
    }
  ) {
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters?.search) {
      whereClause += ` AND (f.nome ILIKE $${paramIndex} OR f.cnpj ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters?.ativo !== undefined) {
      whereClause += ` AND f.ativo = $${paramIndex}`;
      params.push(filters.ativo);
      paramIndex++;
    }

    const limitIndex = paramIndex;
    const offsetIndex = paramIndex + 1;
    params.push(limit, offset);

    // Query principal
    const { rows } = await sql.query(
      `SELECT f.*
       FROM fornecedores f
       WHERE ${whereClause} 
       ORDER BY f.created_at DESC 
       LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      params
    );

    // Buscar CNAEs para cada fornecedor
    const fornecedoresComCnaes = await Promise.all(
      rows.map(async (fornecedor: any) => {
        const { rows: cnaes } = await sql.query(
          `SELECT c.id, c.codigo, c.descricao, c.created_at
           FROM cnaes c
           INNER JOIN fornecedor_cnaes fc ON c.codigo = fc.cnae_codigo
           WHERE fc.fornecedor_id = $1`,
          [fornecedor.id]
        );

        return {
          ...fornecedor,
          cnaes: cnaes,
          total_cnaes: cnaes.length
        };
      })
    );

    const countParams = params.slice(0, -2);
    const { rows: countRows } = await sql.query(
      `SELECT COUNT(*) as total FROM fornecedores f WHERE ${whereClause}`,
      countParams
    );

    const total = parseInt(countRows[0].total);
    const totalPages = Math.ceil(total / limit);

    return {
      data: fornecedoresComCnaes,
      total,
      page,
      totalPages
    };
  }

  // Buscar por ID com CNAEs
  async findById(id: string) {
    const { rows } = await sql.query(
      `SELECT * FROM fornecedores WHERE id = $1`,
      [id]
    );
    
    if (rows.length === 0) {
      return null;
    }

    // Buscar CNAEs
    const { rows: cnaes } = await sql.query(
      `SELECT c.id, c.codigo, c.descricao, c.created_at
       FROM cnaes c
       INNER JOIN fornecedor_cnaes fc ON c.codigo = fc.cnae_codigo
       WHERE fc.fornecedor_id = $1`,
      [id]
    );

    // Buscar documentos
    const { rows: docs } = await sql.query(
      'SELECT * FROM fornecedor_documents WHERE fornecedor_id = $1 ORDER BY uploaded_at DESC',
      [id]
    );

    return {
      ...rows[0],
      cnaes: cnaes,
      total_cnaes: cnaes.length,
      documentos: docs
    };
  }

  // Criar fornecedor
  async create(data: FornecedorFormData) {
    const { rows } = await sql.query(
      `INSERT INTO fornecedores (
        nome, cnpj, email, telefone, endereco, cidade, estado, cep, ativo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        data.nome,
        data.cnpj,
        data.email,
        data.telefone || null,
        data.endereco || null,
        data.cidade || null,
        data.estado || null,
        data.cep || null,
        data.ativo !== false
      ]
    );

    const fornecedor = rows[0];

    // Adicionar CNAEs se fornecidos
    if (data.cnae_codigos && data.cnae_codigos.length > 0) {
      await this.setCnaes(fornecedor.id, data.cnae_codigos);
    }

    return this.findById(fornecedor.id);
  }

  // Atualizar fornecedor
  async update(id: string, data: Partial<FornecedorFormData>) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.nome !== undefined) {
      fields.push(`nome = $${paramIndex}`);
      values.push(data.nome);
      paramIndex++;
    }
    if (data.cnpj !== undefined) {
      fields.push(`cnpj = $${paramIndex}`);
      values.push(data.cnpj);
      paramIndex++;
    }
    if (data.email !== undefined) {
      fields.push(`email = $${paramIndex}`);
      values.push(data.email);
      paramIndex++;
    }
    if (data.telefone !== undefined) {
      fields.push(`telefone = $${paramIndex}`);
      values.push(data.telefone);
      paramIndex++;
    }
    if (data.endereco !== undefined) {
      fields.push(`endereco = $${paramIndex}`);
      values.push(data.endereco);
      paramIndex++;
    }
    if (data.cidade !== undefined) {
      fields.push(`cidade = $${paramIndex}`);
      values.push(data.cidade);
      paramIndex++;
    }
    if (data.estado !== undefined) {
      fields.push(`estado = $${paramIndex}`);
      values.push(data.estado);
      paramIndex++;
    }
    if (data.cep !== undefined) {
      fields.push(`cep = $${paramIndex}`);
      values.push(data.cep);
      paramIndex++;
    }
    if (data.ativo !== undefined) {
      fields.push(`ativo = $${paramIndex}`);
      values.push(data.ativo);
      paramIndex++;
    }

    if (fields.length > 0) {
      fields.push(`updated_at = NOW()`);
      values.push(id);

      await sql.query(
        `UPDATE fornecedores 
         SET ${fields.join(', ')}
         WHERE id = $${paramIndex}`,
        values
      );
    }

    // Atualizar CNAEs se fornecidos
    if (data.cnae_codigos !== undefined) {
      await this.setCnaes(id, data.cnae_codigos);
    }

    return this.findById(id);
  }

  // Deletar
  async delete(id: string) {
    const { rowCount } = await sql.query(
      'DELETE FROM fornecedores WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      throw new Error('Fornecedor não encontrado');
    }
  }

  // Verificar CNPJ
  async existsByCnpj(cnpj: string, excludeId?: string): Promise<boolean> {
    let query = 'SELECT COUNT(*) as count FROM fornecedores WHERE cnpj = $1';
    const params: unknown[] = [cnpj];

    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId);
    }

    const { rows } = await sql.query(query, params);
    return parseInt(rows[0].count) > 0;
  }

  // ====================================
  // MÉTODOS PARA GERENCIAR CNAEs
  // ====================================

  // Definir CNAEs do fornecedor (substitui todos)
  async setCnaes(fornecedorId: string, cnaeCodigos: string[]) {
    // Remover CNAEs existentes
    await sql.query(
      'DELETE FROM fornecedor_cnaes WHERE fornecedor_id = $1',
      [fornecedorId]
    );

    // Adicionar novos CNAEs
    if (cnaeCodigos.length > 0) {
      const values = cnaeCodigos.map((codigo, i) => 
        `($1, $${i + 2})`
      ).join(', ');

      await sql.query(
        `INSERT INTO fornecedor_cnaes (fornecedor_id, cnae_codigo) 
         VALUES ${values}`,
        [fornecedorId, ...cnaeCodigos]
      );
    }
  }

  // Adicionar um CNAE
  async addCnae(fornecedorId: string, cnaeCodigo: string) {
    await sql.query(
      `INSERT INTO fornecedor_cnaes (fornecedor_id, cnae_codigo) 
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [fornecedorId, cnaeCodigo]
    );
  }

  // Remover um CNAE
  async removeCnae(fornecedorId: string, cnaeCodigo: string) {
    await sql.query(
      'DELETE FROM fornecedor_cnaes WHERE fornecedor_id = $1 AND cnae_codigo = $2',
      [fornecedorId, cnaeCodigo]
    );
  }

  // Listar CNAEs disponíveis
  async getAllCnaes() {
    const { rows } = await sql.query(
      'SELECT * FROM cnaes ORDER BY codigo'
    );
    return rows;
  }

  // ====================================
  // MÉTODOS DE DOCUMENTOS
  // ====================================

  async addDocument(fornecedorId: string, url: string) {
    const fileName = url.split('/').pop() || 'documento';
    const extension = fileName.split('.').pop() || '';
    const tipo = extension ? `application/${extension}` : 'application/octet-stream';

    const { rows } = await sql.query(
      `INSERT INTO fornecedor_documents (fornecedor_id, nome, tipo, url, size)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [fornecedorId, fileName, tipo, url, 0]
    );
    return rows[0];
  }

  async getDocuments(fornecedorId: string) {
    const { rows } = await sql.query(
      'SELECT * FROM fornecedor_documents WHERE fornecedor_id = $1 ORDER BY uploaded_at DESC',
      [fornecedorId]
    );
    return rows;
  }

  async deleteDocument(documentId: string) {
    const { rowCount } = await sql.query(
      'DELETE FROM fornecedor_documents WHERE id = $1',
      [documentId]
    );

    if (rowCount === 0) {
      throw new Error('Documento não encontrado');
    }
  }
}

export const fornecedoresRepository = new FornecedoresRepository();