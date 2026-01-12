import { sql } from '@vercel/postgres';
import { FornecedorFormData, Fornecedor } from '@/types/fornecedor';

export class FornecedoresRepository {
  
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

    const { rows } = await sql.query(
      `SELECT 
        f.id, f.nome, f.cnpj, f.email, f.telefone, f.endereco, f.cidade, f.estado,
        f.cep, f.contato_principal, f.observacoes, f.documentos, f.cnae_codigo,
        f.ativo, f.created_at, f.updated_at, f.created_by,
        COALESCE(
          json_agg(
            json_build_object(
              'id', c.id,
              'slug', c.slug,
              'name', c.name,
              'mcc', c.mcc,
              'cnae', c.cnae,
              'active', c.active,
              'has_mdr', CASE WHEN fc.mdr_id IS NOT NULL THEN true ELSE false END,
              'suporta_pos', COALESCE(fc.suporta_pos, true),
              'suporta_online', COALESCE(fc.suporta_online, true)
            )
          ) FILTER (WHERE c.id IS NOT NULL AND c.active = true),
          '[]'
        ) as categories
       FROM fornecedores f
       LEFT JOIN fornecedor_categories fc ON f.id = fc.fornecedor_id
       LEFT JOIN categories c ON fc.category_id = c.id AND c.active = true
       WHERE ${whereClause}
       GROUP BY f.id, f.nome, f.cnpj, f.email, f.telefone, f.endereco, f.cidade, f.estado,
                f.cep, f.contato_principal, f.observacoes, f.documentos, f.cnae_codigo,
                f.ativo, f.created_at, f.updated_at, f.created_by
       ORDER BY f.created_at DESC
       LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      params
    );

    const fornecedoresComCategories = rows.map((fornecedor: Fornecedor & { categories: unknown[] }) => {
      const categories = Array.isArray(fornecedor.categories) ? fornecedor.categories : [];
      return {
        ...fornecedor,
        categories: categories,
        total_categories: categories.length,
        mccs: categories.map((c: { id: number }) => String(c.id)),
        cnaes: categories.map((c: { cnae: string | null }) => c.cnae).filter(Boolean)
      };
    });

    const countParams = params.slice(0, -2);
    const { rows: countRows } = await sql.query(
      `SELECT COUNT(*) as total FROM fornecedores f WHERE ${whereClause}`,
      countParams
    );

    const total = parseInt(countRows[0].total);
    const totalPages = Math.ceil(total / limit);

    return {
      data: fornecedoresComCategories,
      total,
      page,
      totalPages
    };
  }

  async findById(id: string) {
    const { rows } = await sql.query(
      `SELECT 
        f.id, f.nome, f.cnpj, f.email, f.telefone, f.endereco, f.cidade, f.estado,
        f.cep, f.contato_principal, f.observacoes, f.documentos, f.cnae_codigo,
        f.ativo, f.created_at, f.updated_at, f.created_by,
        COALESCE(
          json_agg(
            json_build_object(
              'id', c.id,
              'slug', c.slug,
              'name', c.name,
              'mcc', c.mcc,
              'cnae', c.cnae,
              'active', c.active,
              'has_mdr', CASE WHEN fc.mdr_id IS NOT NULL THEN true ELSE false END,
              'mdr_id', fc.mdr_id,
              'suporta_pos', COALESCE(fc.suporta_pos, true),
              'suporta_online', COALESCE(fc.suporta_online, true),
              'mdr_data', CASE WHEN m.id IS NOT NULL THEN json_build_object(
                'debitopos', m.debitopos,
                'creditopos', m.creditopos,
                'credito2xpos', m.credito2xpos,
                'credito7xpos', m.credito7xpos,
                'voucherpos', m.voucherpos,
                'prepos', m.prepos,
                'mdrpos', m.mdrpos,
                'cminpos', m.cminpos,
                'cmaxpos', m.cmaxpos,
                'antecipacao', m.antecipacao,
                'custo_pix_pos', m.custo_pix_pos,
                'debitoonline', m.debitoonline,
                'creditoonline', m.creditoonline,
                'credito2xonline', m.credito2xonline,
                'credito7xonline', m.credito7xonline,
                'voucheronline', m.voucheronline,
                'preonline', m.preonline,
                'mdronline', m.mdronline,
                'cminonline', m.cminonline,
                'cmaxonline', m.cmaxonline,
                'antecipacaoonline', m.antecipacaoonline,
                'custo_pix_online', m.custo_pix_online
              ) ELSE NULL END
            )
          ) FILTER (WHERE c.id IS NOT NULL AND c.active = true),
          '[]'
        ) as categories,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', fd.id,
              'nome', fd.nome,
              'tipo', fd.tipo,
              'url', fd.url,
              'size', fd.size,
              'uploaded_at', fd.uploaded_at
            )
          ) FROM fornecedor_documents fd WHERE fd.fornecedor_id = f.id),
          '[]'
        ) as documentos
       FROM fornecedores f
       LEFT JOIN fornecedor_categories fc ON f.id = fc.fornecedor_id
       LEFT JOIN categories c ON fc.category_id = c.id AND c.active = true
       LEFT JOIN mdr m ON fc.mdr_id = m.id
       WHERE f.id = $1
       GROUP BY f.id, f.nome, f.cnpj, f.email, f.telefone, f.endereco, f.cidade, f.estado,
                f.cep, f.contato_principal, f.observacoes, f.documentos, f.cnae_codigo,
                f.ativo, f.created_at, f.updated_at, f.created_by`,
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    const fornecedor = rows[0];
    const categories = Array.isArray(fornecedor.categories) ? fornecedor.categories : [];
    const docs = Array.isArray(fornecedor.documentos) ? fornecedor.documentos : [];

    return {
      ...fornecedor,
      categories: categories,
      total_categories: categories.length,
      mcc: categories.map((c: { id: number }) => String(c.id)),
      mccs: categories.map((c: { id: number }) => String(c.id)),
      cnaes: categories.map((c: { cnae: string | null }) => c.cnae).filter(Boolean),
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

    // Adicionar Categories se fornecidos
    if (data.mcc && data.mcc.length > 0) {
      await this.setCategories(fornecedor.id, data.mcc);
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

    // Atualizar Categories se fornecidos
    if (data.mcc !== undefined) {
      await this.setCategories(id, data.mcc);
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
  // MÉTODOS PARA GERENCIAR CATEGORIES
  // ====================================

  // Definir Categories do fornecedor (substitui todos)
  async setCategories(fornecedorId: string, categoryIds: string[]) {
    // Remover Categories existentes
    await sql.query(
      'DELETE FROM fornecedor_categories WHERE fornecedor_id = $1',
      [fornecedorId]
    );

    // Adicionar novas Categories
    if (categoryIds.length > 0) {
      const values = categoryIds.map((id, i) =>
        `($1, $${i + 2})`
      ).join(', ');

      await sql.query(
        `INSERT INTO fornecedor_categories (fornecedor_id, category_id)
         VALUES ${values}`,
        [fornecedorId, ...categoryIds]
      );
    }
  }

  // Adicionar uma Category
  async addCategory(fornecedorId: string, categoryId: number) {
    await sql.query(
      `INSERT INTO fornecedor_categories (fornecedor_id, category_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [fornecedorId, categoryId]
    );
  }

  // Remover uma Category
  async removeCategory(fornecedorId: string, categoryId: number) {
    await sql.query(
      'DELETE FROM fornecedor_categories WHERE fornecedor_id = $1 AND category_id = $2',
      [fornecedorId, categoryId]
    );
  }

  // Listar Categories disponíveis
  async getAllCategories() {
    const { rows } = await sql.query(
      'SELECT * FROM categories WHERE active = true ORDER BY mcc, name'
    );
    return rows;
  }

  // Buscar Categories por MCC
  async getCategoriesByMcc(mcc: string) {
    const { rows } = await sql.query(
      'SELECT * FROM categories WHERE mcc = $1 AND active = true',
      [mcc]
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
