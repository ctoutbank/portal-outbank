import { sql } from '@vercel/postgres';
import { CostTemplate } from '@/types/margins';

export class MarginsRepository {
  async listCostTemplates(): Promise<CostTemplate[]> {
    const { rows } = await sql.query(`
      SELECT 
        ct.*,
        f.nome as fornecedor_nome,
        m.code as mcc_code,
        m.description as mcc_description
      FROM mdr_cost_templates ct
      JOIN fornecedores f ON ct.fornecedor_id = f.id
      JOIN mcc m ON ct.mcc_id = m.id
      ORDER BY m.code, f.nome
    `);

    return rows.map(this.mapCostTemplate);
  }

  async findCostTemplateById(id: string): Promise<CostTemplate | null> {
    const { rows } = await sql.query(`
      SELECT 
        ct.*,
        f.nome as fornecedor_nome,
        m.code as mcc_code,
        m.description as mcc_description
      FROM mdr_cost_templates ct
      JOIN fornecedores f ON ct.fornecedor_id = f.id
      JOIN mcc m ON ct.mcc_id = m.id
      WHERE ct.id = $1
    `, [id]);

    return rows[0] ? this.mapCostTemplate(rows[0]) : null;
  }

  async createCostTemplate(data: Partial<CostTemplate>): Promise<CostTemplate> {
    const { rows } = await sql.query(`
      INSERT INTO mdr_cost_templates (
        fornecedor_id, mcc_id, bandeiras,
        custo_debito_pos, custo_credito_pos, custo_credito_2x_pos, custo_credito_7x_pos,
        custo_voucher_pos, custo_pix_pos_percent, custo_pix_pos_fixo, custo_antecipacao_pos,
        custo_debito_online, custo_credito_online, custo_credito_2x_online, custo_credito_7x_online,
        custo_voucher_online, custo_pix_online_percent, custo_pix_online_fixo, custo_antecipacao_online
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `, [
      data.fornecedorId, data.mccId, data.bandeiras,
      data.custoDebitoPos, data.custoCreditoPos, data.custoCredito2xPos, data.custoCredito7xPos,
      data.custoVoucherPos, data.custoPixPosPercent, data.custoPixPosFixo, data.custoAntecipacaoPos,
      data.custoDebitoOnline, data.custoCreditoOnline, data.custoCredito2xOnline, data.custoCredito7xOnline,
      data.custoVoucherOnline, data.custoPixOnlinePercent, data.custoPixOnlineFixo, data.custoAntecipacaoOnline
    ]);

    return this.mapCostTemplate(rows[0]);
  }

  async updateCostTemplate(id: string, data: Partial<CostTemplate>): Promise<CostTemplate> {
    const { rows } = await sql.query(`
      UPDATE mdr_cost_templates SET
        bandeiras = $2,
        custo_debito_pos = $3, custo_credito_pos = $4, custo_credito_2x_pos = $5, custo_credito_7x_pos = $6,
        custo_voucher_pos = $7, custo_pix_pos_percent = $8, custo_pix_pos_fixo = $9, custo_antecipacao_pos = $10,
        custo_debito_online = $11, custo_credito_online = $12, custo_credito_2x_online = $13, custo_credito_7x_online = $14,
        custo_voucher_online = $15, custo_pix_online_percent = $16, custo_pix_online_fixo = $17, custo_antecipacao_online = $18,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [
      id, data.bandeiras,
      data.custoDebitoPos, data.custoCreditoPos, data.custoCredito2xPos, data.custoCredito7xPos,
      data.custoVoucherPos, data.custoPixPosPercent, data.custoPixPosFixo, data.custoAntecipacaoPos,
      data.custoDebitoOnline, data.custoCreditoOnline, data.custoCredito2xOnline, data.custoCredito7xOnline,
      data.custoVoucherOnline, data.custoPixOnlinePercent, data.custoPixOnlineFixo, data.custoAntecipacaoOnline
    ]);

    return this.mapCostTemplate(rows[0]);
  }

  async getMarginConfig(customerId: number): Promise<{ marginOutbank: number; marginExecutivo: number; marginCore: number } | null> {
    const { rows } = await sql.query(`
      SELECT margin_outbank, margin_executivo, margin_core
      FROM iso_margin_config
      WHERE customer_id = $1
    `, [customerId]);

    if (!rows[0]) return null;

    return {
      marginOutbank: parseFloat(rows[0].margin_outbank) || 0,
      marginExecutivo: parseFloat(rows[0].margin_executivo) || 0,
      marginCore: parseFloat(rows[0].margin_core) || 0
    };
  }

  async upsertMarginConfig(customerId: number, data: { marginOutbank?: number; marginExecutivo?: number; marginCore?: number }): Promise<void> {
    const { rows: existing } = await sql.query(`SELECT id FROM iso_margin_config WHERE customer_id = $1`, [customerId]);

    if (existing[0]) {
      await sql.query(`
        UPDATE iso_margin_config SET
          margin_outbank = COALESCE($2, margin_outbank),
          margin_executivo = COALESCE($3, margin_executivo),
          margin_core = COALESCE($4, margin_core),
          updated_at = NOW()
        WHERE customer_id = $1
      `, [customerId, data.marginOutbank, data.marginExecutivo, data.marginCore]);
    } else {
      await sql.query(`
        INSERT INTO iso_margin_config (customer_id, margin_outbank, margin_executivo, margin_core)
        VALUES ($1, $2, $3, $4)
      `, [customerId, data.marginOutbank || 0, data.marginExecutivo || 0, data.marginCore || 0]);
    }
  }

  private mapCostTemplate(row: any): CostTemplate {
    return {
      id: row.id,
      fornecedorId: row.fornecedor_id,
      mccId: row.mcc_id,
      fornecedorNome: row.fornecedor_nome,
      mccCode: row.mcc_code,
      mccDescription: row.mcc_description,
      custoDebitoPos: row.custo_debito_pos,
      custoCreditoPos: row.custo_credito_pos,
      custoCredito2xPos: row.custo_credito_2x_pos,
      custoCredito7xPos: row.custo_credito_7x_pos,
      custoVoucherPos: row.custo_voucher_pos,
      custoPixPosPercent: row.custo_pix_pos_percent,
      custoPixPosFixo: row.custo_pix_pos_fixo,
      custoAntecipacaoPos: row.custo_antecipacao_pos,
      custoDebitoOnline: row.custo_debito_online,
      custoCreditoOnline: row.custo_credito_online,
      custoCredito2xOnline: row.custo_credito_2x_online,
      custoCredito7xOnline: row.custo_credito_7x_online,
      custoVoucherOnline: row.custo_voucher_online,
      custoPixOnlinePercent: row.custo_pix_online_percent,
      custoPixOnlineFixo: row.custo_pix_online_fixo,
      custoAntecipacaoOnline: row.custo_antecipacao_online,
      bandeiras: row.bandeiras,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const marginsRepository = new MarginsRepository();
