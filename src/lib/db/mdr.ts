import { sql } from '@vercel/postgres';
import { FornecedorMDRForm } from '@/types/fornecedor';

export class MdrRepository {
  /**
   * Buscar MDR de um fornecedor + category específicos
   */
  async findByFornecedorAndCategory(fornecedorId: string, categoryId: number) {
    console.log('🔍 Buscando MDR - Fornecedor:', fornecedorId, 'Category:', categoryId);
    
    const { rows } = await sql.query(
      `SELECT m.*, fc.fornecedor_id, fc.category_id
       FROM mdr m
       INNER JOIN fornecedor_categories fc ON m.id = fc.mdr_id
       WHERE fc.fornecedor_id = $1 AND fc.category_id = $2
       ORDER BY m.created_at DESC
       LIMIT 1`,
      [fornecedorId, categoryId]
    );

    console.log('🔍 MDR encontrado:', rows[0] ? 'Sim' : 'Não');
    if (rows[0]) {
      console.log('🔍 MDR ID:', rows[0].id);
    }

    return rows[0] || null;
  }

  /**
   * Criar ou atualizar MDR
   */
  async upsert(fornecedorId: string, categoryId: number, data: FornecedorMDRForm) {
    console.log('💾 Iniciando upsert - Fornecedor:', fornecedorId, 'Category:', categoryId);
    
    // Verificar se já existe um MDR para esse fornecedor + category
    const existing = await this.findByFornecedorAndCategory(fornecedorId, categoryId);

    if (existing) {
      console.log('✏️ Atualizando MDR existente ID:', existing.id);
      
      // Atualizar MDR existente
      const { rows } = await sql.query(
        `UPDATE mdr SET
          bandeiras = $1, debitopos = $2, creditopos = $3,
          credito2xpos = $4, credito7xpos = $5, voucherpos = $6,
          prepos = $7, mdrpos = $8, cminpos = $9, cmaxpos = $10, antecipacao = $11,
          debitoonline = $12, creditoonline = $13, credito2xonline = $14,
          credito7xonline = $15, voucheronline = $16, preonline = $17,
          mdronline = $18, cminonline = $19, cmaxonline = $20, antecipacaoonline = $21,
          updated_at = NOW()
        WHERE id = $22
        RETURNING *`,
        [
          data.bandeiras, data.debitopos, data.creditopos,
          data.credito2xpos, data.credito7xpos, data.voucherpos,
          data.prepos, data.mdrpos, data.cminpos, data.cmaxpos, data.antecipacao,
          data.debitoonline, data.creditoonline, data.credito2xonline,
          data.credito7xonline, data.voucheronline, data.preonline,
          data.mdronline, data.cminonline, data.cmaxonline, data.antecipacaoonline,
          existing.id
        ]
      );

      console.log('✅ MDR atualizado com sucesso!');
      return rows[0];
    } else {
      console.log('➕ Criando novo MDR');
      
      // 🔥 PRIMEIRO: Verificar se a relação fornecedor_categories existe
      const { rows: existingRelation } = await sql.query(
        `SELECT id, mdr_id FROM fornecedor_categories 
         WHERE fornecedor_id = $1 AND category_id = $2`,
        [fornecedorId, categoryId]
      );

      if (existingRelation.length === 0) {
        throw new Error(`Relação fornecedor_categories não encontrada para fornecedor ${fornecedorId} e category ${categoryId}`);
      }

      console.log('✅ Relação fornecedor_categories encontrada:', existingRelation[0].id);

      // Criar novo MDR
      const { rows: mdrRows } = await sql.query(
        `INSERT INTO mdr (
          bandeiras, debitopos, creditopos, credito2xpos, credito7xpos, voucherpos,
          prepos, mdrpos, cminpos, cmaxpos, antecipacao,
          debitoonline, creditoonline, credito2xonline, credito7xonline, voucheronline,
          preonline, mdronline, cminonline, cmaxonline, antecipacaoonline,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW()
        ) RETURNING *`,
        [
          data.bandeiras, data.debitopos, data.creditopos,
          data.credito2xpos, data.credito7xpos, data.voucherpos,
          data.prepos, data.mdrpos, data.cminpos, data.cmaxpos, data.antecipacao,
          data.debitoonline, data.creditoonline, data.credito2xonline,
          data.credito7xonline, data.voucheronline, data.preonline,
          data.mdronline, data.cminonline, data.cmaxonline, data.antecipacaoonline
        ]
      );

      const mdr = mdrRows[0];
      console.log('✅ MDR criado com ID:', mdr.id);

      // Atualizar a tabela fornecedor_categories para incluir o mdr_id
      const { rowCount } = await sql.query(
        `UPDATE fornecedor_categories
         SET mdr_id = $1, updated_at = NOW()
         WHERE fornecedor_id = $2 AND category_id = $3`,
        [mdr.id, fornecedorId, categoryId]
      );

      console.log('✅ Relação atualizada. Linhas afetadas:', rowCount);

      // 🔥 VERIFICAR se a atualização funcionou
      const { rows: verifyRows } = await sql.query(
        `SELECT mdr_id FROM fornecedor_categories 
         WHERE fornecedor_id = $1 AND category_id = $2`,
        [fornecedorId, categoryId]
      );

      console.log('🔍 Verificação - mdr_id na relação:', verifyRows[0]?.mdr_id);

      return mdr;
    }
  }

  /**
   * Deletar MDR
   */
  async delete(mdrId: string) {
    console.log('🗑️ Deletando MDR ID:', mdrId);
    
    // Remover referência na tabela intermediária
    await sql.query(
      'UPDATE fornecedor_categories SET mdr_id = NULL WHERE mdr_id = $1',
      [mdrId]
    );

    // Deletar o MDR
    await sql.query('DELETE FROM mdr WHERE id = $1', [mdrId]);
    
    console.log('✅ MDR deletado com sucesso!');
  }
}

export const mdrRepository = new MdrRepository();
