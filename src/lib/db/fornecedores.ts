import { sql } from '@vercel/postgres';
import { Fornecedor, FornecedorFormData, FornecedorDocument } from '@/types/fornecedor';

export class FornecedoresRepository {
  // Listar com paginação, filtros e CNAE
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
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.search) {
      whereClause += ` AND (s.nome ILIKE $${paramIndex} OR s.cnpj ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters?.ativo !== undefined) {
      whereClause += ` AND s.ativo = $${paramIndex}`;
      params.push(filters.ativo);
      paramIndex++;
    }

    const limitIndex = paramIndex;
    const offsetIndex = paramIndex + 1;
    params.push(limit, offset);

    // Query com JOIN para incluir dados do CNAE
    const { rows } = await sql.query(
      `SELECT 
        s.*,
        c.id as cnae_id,
        c.codigo as cnae_codigo,
        c.descricao as cnae_descricao
       FROM fornecedores s
       LEFT JOIN cnaes c ON s.cnae_codigo = c.codigo
       WHERE ${whereClause} 
       ORDER BY s.created_at DESC 
       LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      params
    );

    const countParams = params.slice(0, -2);
    const { rows: countRows } = await sql.query(
      `SELECT COUNT(*) as total FROM fornecedores s WHERE ${whereClause}`,
      countParams
    );

    const total = parseInt(countRows[0].total);
    const totalPages = Math.ceil(total / limit);

    // Formatar dados com CNAE aninhado
    const data = rows.map((row: {
      cnae_id: any; id: any; nome: any; cnpj: any; email: any; telefone: any; endereco: any; cidade: any; estado: any; cep: any; cnae_codigo: any; cnae_descricao: any; created_at: any; ativo: any; updated_at: any; 
}) => ({
      id: row.id,
      nome: row.nome,
      cnpj: row.cnpj,
      email: row.email,
      telefone: row.telefone,
      endereco: row.endereco,
      cidade: row.cidade,
      estado: row.estado,
      cep: row.cep,
      cnae_codigo: row.cnae_codigo, 
      cnae: row.cnae_id ? {
        id: row.cnae_id,
        codigo: row.cnae_codigo,
        descricao: row.cnae_descricao,
        created_at: row.created_at
      } : null,
      ativo: row.ativo,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    return {
      data,
      total,
      page,
      totalPages
    };
  }

  // Buscar por ID com CNAE
  async findById(id: string) {
    const { rows } = await sql.query(
      `SELECT 
        s.*,
        c.id as cnae_codigo,
        c.codigo as cnae_codigo,
        c.descricao as cnae_descricao
       FROM fornecedores s
       LEFT JOIN cnaes c ON s.cnae_codigo = c.id
       WHERE s.id = $1`,
      [id]
    );
    
    if (rows.length === 0) {
      return null;
    }

    // Buscar documentos
    const { rows: docs } = await sql.query(
      'SELECT * FROM fornecedor_documents WHERE fornecedor_id = $1 ORDER BY uploaded_at DESC',
      [id]
    );

    const row = rows[0];
    return {
      id: row.id,
      nome: row.nome,
      cnpj: row.cnpj,
      email: row.email,
      telefone: row.telefone,
      endereco: row.endereco,
      cidade: row.cidade,
      estado: row.estado,
      cep: row.cep,
      cnae_codigo: row.cnae_codigo,
      cnae: row.cnae_codigo ? {
        id: row.cnae_codigo,
        codigo: row.cnae_codigo,
        descricao: row.cnae_descricao,
        created_at: row.created_at
      } : null,
      ativo: row.ativo,
      created_at: row.created_at,
      updated_at: row.updated_at,
      documentos: docs
    };
  }

  // Criar com CNAE
  async create(data: FornecedorFormData) {
    const { rows } = await sql.query(
      `INSERT INTO fornecedores (
        nome, cnpj, email, telefone, endereco, cidade, estado, cep, cnae_codigo, ativo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        data.cnae_codigo || null,
        data.ativo !== false
      ]
    );
    return rows[0];
  }

  // Atualizar com CNAE
  async update(id: string, data: Partial<FornecedorFormData>) {
    const fields: string[] = [];
    const values: any[] = [];
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
    if (data.cnae_codigo !== undefined) {
      fields.push(`cnae_codigo = $${paramIndex}`);
      values.push(data.cnae_codigo);
      paramIndex++;
    }
    if (data.ativo !== undefined) {
      fields.push(`ativo = $${paramIndex}`);
      values.push(data.ativo);
      paramIndex++;
    }

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await sql.query(
      `UPDATE fornecedores 
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (rows.length === 0) {
      throw new Error('Fornecedor não encontrado');
    }

    return rows[0];
  }

  // Deletar (sem alteração)
  async delete(id: string) {
    const { rowCount } = await sql.query(
      'DELETE FROM fornecedores WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      throw new Error('Fornecedor não encontrado');
    }
  }

  // Verificar CNPJ (sem alteração)
  async existsByCnpj(cnpj: string, excludeId?: string): Promise<boolean> {
    let query = 'SELECT COUNT(*) as count FROM fornecedores WHERE cnpj = $1';
    const params: any[] = [cnpj];

    if (excludeId) {
      query += ' AND id != $2';
      params.push(excludeId);
    }

    const { rows } = await sql.query(query, params);
    return parseInt(rows[0].count) > 0;
  }

  // Métodos de documentos (sem alteração)
  async addDocument(supplierId: string, url: string) {
    // Extrair nome do arquivo da URL
    const fileName = url.split('/').pop() || 'documento';
    
    // Extrair tipo/extensão do arquivo
    const extension = fileName.split('.').pop() || '';
    const tipo = extension ? `application/${extension}` : 'application/octet-stream';

    const { rows } = await sql.query(
      `INSERT INTO supplier_documents (supplier_id, nome, tipo, url, size)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [supplierId, fileName, tipo, url, 0] // size como 0 já que não está sendo enviado
    );
    return rows[0];
  }

  async getDocuments(supplierId: string) {
    const { rows } = await sql.query(
      'SELECT * FROM fornecedor_documents WHERE fornecedor_id = $1 ORDER BY uploaded_at DESC',
      [supplierId]
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
