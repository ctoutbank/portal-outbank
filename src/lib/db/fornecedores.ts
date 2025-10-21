// server/repositories/fornecedores-repository.ts
import { sql } from "@/server/db";
import { Fornecedor, FornecedorDocument, FornecedorFormData } from "@/types/fornecedor";
import { neonClient } from "@/server/db";
// nota: estou mantendo sua API original (sql.query) pra você não precisar refatorar agora.
export class FornecedorRepository {
   static async getAll() {
    try {
      // Run your query
      const rows = await neonClient(
        "SELECT * FROM fornecedores ORDER BY nome"
      );

      // Make sure rows is an array before mapping
      if (!Array.isArray(rows)) {
        console.error("Unexpected result from database:", rows);
        return [];
      }

      // Map the rows to whatever shape you need
      return rows.map((f) => ({
        id: f.id,
        nome: f.nome,
        cnpj: f.cnpj,
        email: f.email,
        telefone: f.telefone,
        endereco: f.endereco,
        cidade: f.cidade,
        estado: f.estado,
        cep: f.cep,
        ativo: f.ativo,
      }));
    } catch (error) {
      console.error("Error fetching fornecedores:", error);
      return [];
    }
  }


  async findById(id: string) {
    const { rows } = await sql.query("SELECT * FROM fornecedores WHERE id = $1", [id]);
    if (!rows || rows.length === 0) return null;
    const { rows: docs } = await sql.query(
      "SELECT * FROM fornecedor_documents WHERE fornecedor_id = $1 ORDER BY created_at DESC",
      [id]
    );
    return { ...rows[0], documentos: docs } as unknown as Fornecedor;
  }

async create(data: FornecedorFormData): Promise<Fornecedor> {
  if (!data.nome || !data.cnpj || !data.email) {
    throw new Error("Campos obrigatórios ausentes");
  }

  const { rows } = await sql.query(
    `INSERT INTO fornecedores 
      (nome, cnpj, email, telefone, endereco, cidade, estado, cep, ativo,contato_principal, observacoes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, $10, $11)
     RETURNING *`,
    [
      data.nome,
      data.cnpj,  // usa CNPJ, que existe no banco
      data.email,
      data.telefone ?? null,
      data.endereco ?? null,
      data.cidade ?? null,
      data.estado ?? null,
      data.cep ?? null,
      data.ativo || "ativo",
      data.observacoes ?? null,
      data.contato_principal ?? null,
    ]
  );

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    throw new Error("Erro ao criar fornecedor");
  }

  return rows[0] as Fornecedor;
}

  async update(id: string, data: Partial<FornecedorFormData>) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) {
        fields.push(`${k} = $${idx}`);
        values.push(v);
        idx++;
      }
    }
    fields.push(`updated_at = NOW()`);
    const query = `UPDATE fornecedores SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;
    values.push(id);
    const { rows } = await sql.query(query, values);
    return rows[0] as Fornecedor;
  }

  async delete(id: string) {
    await sql.query("DELETE FROM fornecedores WHERE id = $1", [id]);
  }

  async addDocument(fornecedor_id: string, nome: string, tipo: string, url: string, size: number) {
    const { rows } = await sql.query(
      `INSERT INTO fornecedor_documents (fornecedor_id, nome, tipo, url, size)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [fornecedor_id, nome, tipo, url, size]
    );
    return rows[0] as FornecedorDocument;
  }

  async getDocuments(fornecedorId: string) {
    const { rows } = await sql.query(
      "SELECT * FROM fornecedor_documents WHERE fornecedor_id = $1 ORDER BY created_at DESC",
      [fornecedorId]
    );
    return rows as FornecedorDocument[];
  }

  async deleteDocument(documentId: string) {
    await sql.query("DELETE FROM fornecedor_documents WHERE id = $1", [documentId]);
  }

  async existsByCnpj(cnpj: string, excludeId?: string) {
    if (excludeId) {
      const { rows } = await sql.query(
        "SELECT COUNT(*) as count FROM fornecedores WHERE documento = $1 AND id != $2",
        [cnpj, excludeId]
      );
      return parseInt(rows[0].count, 10) > 0;
    } else {
      const { rows } = await sql.query(
        "SELECT COUNT(*) as count FROM fornecedores WHERE documento = $1",
        [cnpj]
      );
      return parseInt(rows[0].count, 10) > 0;
    }
  }
}

export const fornecedoresRepository = new FornecedorRepository();
