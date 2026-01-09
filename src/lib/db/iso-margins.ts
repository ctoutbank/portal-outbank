import { sql } from '@vercel/postgres';

export interface IsoMarginConfig {
  id: string;
  customerId: number;
  customerName: string;
  customerSlug: string;
  marginOutbank: string;
  marginExecutivo: string;
  marginCore: string;
  linkedTablesCount: number;
  draftTablesCount: number;
  validatedTablesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type MdrValidationStatus = 'rascunho' | 'validada' | 'inativa';

export interface MdrTableWithCost {
  id: string;
  fornecedorCategoryId: string;
  mcc: string;
  cnae: string;
  categoryName: string;
  fornecedorId: string;
  fornecedorNome: string;
  hasMdr: boolean;
  mdrId: string | null;
  bandeiras: string;
  debitoPos: string;
  creditoPos: string;
  credito2xPos: string;
  credito7xPos: string;
  voucherPos: string;
  prePos: string;
  antecipacao: string;
  custoPixPos: string;
  debitoOnline: string;
  creditoOnline: string;
  credito2xOnline: string;
  credito7xOnline: string;
  voucherOnline: string;
  preOnline: string;
  antecipacaoOnline: string;
  custoPixOnline: string;
  status?: MdrValidationStatus;
}

export interface LinkedMdrTable extends MdrTableWithCost {
  linkId: string;
  isActive: boolean;
  linkedAt: Date;
}

export interface IsoMdrMargin {
  id: string;
  isoMdrLinkId: string;
  bandeira: string;
  modalidade: string;
  marginIso: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinkedMdrTableWithIsoMargin extends LinkedMdrTable {
  marginOutbank: string;
  marginExecutivo: string;
  marginCore: string;
  isoMargins: IsoMdrMargin[];
}

class IsoMarginsRepository {
  async listIsoConfigs(): Promise<IsoMarginConfig[]> {
    const { rows } = await sql.query(`
      SELECT 
        imc.id,
        c.id as customer_id,
        c.name as customer_name,
        c.slug as customer_slug,
        imc.margin_outbank,
        imc.margin_executivo,
        imc.margin_core,
        imc.created_at,
        imc.updated_at,
        (SELECT COUNT(*) FROM iso_mdr_links iml WHERE iml.customer_id = c.id AND iml.is_active = true) as linked_tables_count,
        (SELECT COUNT(*) FROM iso_mdr_links iml WHERE iml.customer_id = c.id AND iml.is_active = true AND iml.status = 'rascunho') as draft_tables_count,
        (SELECT COUNT(*) FROM iso_mdr_links iml WHERE iml.customer_id = c.id AND iml.is_active = true AND iml.status = 'validada') as validated_tables_count
      FROM customers c
      LEFT JOIN iso_margin_config imc ON c.id = imc.customer_id
      WHERE c.is_active = true AND c.id IS NOT NULL
      ORDER BY c.name
    `);

    return rows
      .filter(row => row.customer_id !== null && row.customer_id !== undefined)
      .map(row => ({
        id: row.id || `customer-${row.customer_id}`,
        customerId: row.customer_id,
        customerName: row.customer_name || 'ISO sem nome',
        customerSlug: row.customer_slug || '',
        marginOutbank: row.margin_outbank || '0',
        marginExecutivo: row.margin_executivo || '0',
        marginCore: row.margin_core || '0',
        linkedTablesCount: parseInt(row.linked_tables_count) || 0,
        draftTablesCount: parseInt(row.draft_tables_count) || 0,
        validatedTablesCount: parseInt(row.validated_tables_count) || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
  }

  async getIsoConfig(customerId: number): Promise<IsoMarginConfig | null> {
    const { rows } = await sql.query(`
      SELECT 
        imc.id,
        imc.customer_id,
        c.name as customer_name,
        c.slug as customer_slug,
        imc.margin_outbank,
        imc.margin_executivo,
        imc.margin_core,
        imc.created_at,
        imc.updated_at,
        (SELECT COUNT(*) FROM iso_mdr_links iml WHERE iml.customer_id = c.id AND iml.is_active = true) as linked_tables_count,
        (SELECT COUNT(*) FROM iso_mdr_links iml WHERE iml.customer_id = c.id AND iml.is_active = true AND iml.status = 'rascunho') as draft_tables_count,
        (SELECT COUNT(*) FROM iso_mdr_links iml WHERE iml.customer_id = c.id AND iml.is_active = true AND iml.status = 'validada') as validated_tables_count
      FROM customers c
      LEFT JOIN iso_margin_config imc ON c.id = imc.customer_id
      WHERE c.id = $1
    `, [customerId]);

    if (!rows[0]) return null;

    const row = rows[0];
    return {
      id: row.id || null,
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerSlug: row.customer_slug,
      marginOutbank: row.margin_outbank || '0',
      marginExecutivo: row.margin_executivo || '0',
      marginCore: row.margin_core || '0',
      linkedTablesCount: parseInt(row.linked_tables_count) || 0,
      draftTablesCount: parseInt(row.draft_tables_count) || 0,
      validatedTablesCount: parseInt(row.validated_tables_count) || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  async upsertIsoConfig(customerId: number, data: { marginOutbank?: string; marginExecutivo?: string; marginCore?: string }): Promise<IsoMarginConfig> {
    const normalizeMargin = (value?: string) => value?.replace(',', '.') || undefined;
    
    const marginOutbank = normalizeMargin(data.marginOutbank);
    const marginExecutivo = normalizeMargin(data.marginExecutivo);
    const marginCore = normalizeMargin(data.marginCore);
    
    const { rows: existing } = await sql.query(`SELECT id FROM iso_margin_config WHERE customer_id = $1`, [customerId]);

    if (existing[0]) {
      await sql.query(`
        UPDATE iso_margin_config SET
          margin_outbank = COALESCE($2, margin_outbank),
          margin_executivo = COALESCE($3, margin_executivo),
          margin_core = COALESCE($4, margin_core),
          updated_at = NOW()
        WHERE customer_id = $1
      `, [customerId, marginOutbank, marginExecutivo, marginCore]);
    } else {
      await sql.query(`
        INSERT INTO iso_margin_config (customer_id, margin_outbank, margin_executivo, margin_core)
        VALUES ($1, $2, $3, $4)
      `, [customerId, marginOutbank || '0', marginExecutivo || '0', marginCore || '0']);
    }

    return this.getIsoConfig(customerId) as Promise<IsoMarginConfig>;
  }

  async getAvailableMdrTables(fornecedorId?: string): Promise<MdrTableWithCost[]> {
    let query = `
      SELECT 
        fc.id as fornecedor_category_id,
        cat.mcc,
        cat.cnae,
        cat.name as category_name,
        f.id as fornecedor_id,
        f.nome as fornecedor_nome,
        m.id as mdr_id,
        m.bandeiras,
        m.debitopos,
        m.creditopos,
        m.credito2xpos,
        m.credito7xpos,
        m.voucherpos,
        m.prepos,
        m.antecipacao,
        m.custo_pix_pos,
        m.debitoonline,
        m.creditoonline,
        m.credito2xonline,
        m.credito7xonline,
        m.voucheronline,
        m.preonline,
        m.antecipacaoonline,
        m.custo_pix_online,
        fc.status
      FROM fornecedor_categories fc
      JOIN categories cat ON fc.category_id = cat.id
      JOIN fornecedores f ON fc.fornecedor_id = f.id
      LEFT JOIN mdr m ON fc.mdr_id = m.id
      WHERE f.ativo = true
        AND fc.mdr_id IS NOT NULL
    `;

    const params: any[] = [];
    if (fornecedorId) {
      query += ` AND f.id = $1`;
      params.push(fornecedorId);
    }

    query += ` ORDER BY f.nome, cat.mcc`;

    const { rows } = await sql.query(query, params);

    return rows.map(row => ({
      id: row.fornecedor_category_id,
      fornecedorCategoryId: row.fornecedor_category_id,
      mcc: row.mcc || '',
      cnae: row.cnae || '',
      categoryName: row.category_name || '',
      fornecedorId: row.fornecedor_id,
      fornecedorNome: row.fornecedor_nome,
      hasMdr: !!row.mdr_id,
      mdrId: row.mdr_id,
      bandeiras: row.bandeiras || '',
      debitoPos: row.debitopos || '',
      creditoPos: row.creditopos || '',
      credito2xPos: row.credito2xpos || '',
      credito7xPos: row.credito7xpos || '',
      voucherPos: row.voucherpos || '',
      prePos: row.prepos || '',
      antecipacao: row.antecipacao || '',
      custoPixPos: row.custo_pix_pos || '',
      debitoOnline: row.debitoonline || '',
      creditoOnline: row.creditoonline || '',
      credito2xOnline: row.credito2xonline || '',
      credito7xOnline: row.credito7xonline || '',
      voucherOnline: row.voucheronline || '',
      preOnline: row.preonline || '',
      antecipacaoOnline: row.antecipacaoonline || '',
      custoPixOnline: row.custo_pix_online || '',
      status: row.status || 'rascunho'
    }));
  }

  async getLinkedMdrTables(customerId: number, includeAllStatuses: boolean = false): Promise<LinkedMdrTable[]> {
    const statusFilter = includeAllStatuses ? '' : "AND iml.status = 'validada'";
    
    const { rows } = await sql.query(`
      SELECT 
        iml.id as link_id,
        iml.is_active,
        iml.created_at as linked_at,
        iml.status as link_status,
        fc.id as fornecedor_category_id,
        cat.mcc,
        cat.cnae,
        cat.name as category_name,
        f.id as fornecedor_id,
        f.nome as fornecedor_nome,
        m.id as mdr_id,
        m.bandeiras,
        m.debitopos,
        m.creditopos,
        m.credito2xpos,
        m.credito7xpos,
        m.voucherpos,
        m.prepos,
        m.antecipacao,
        m.custo_pix_pos,
        m.debitoonline,
        m.creditoonline,
        m.credito2xonline,
        m.credito7xonline,
        m.voucheronline,
        m.preonline,
        m.antecipacaoonline,
        m.custo_pix_online
      FROM iso_mdr_links iml
      JOIN fornecedor_categories fc ON iml.fornecedor_category_id = fc.id
      JOIN categories cat ON fc.category_id = cat.id
      JOIN fornecedores f ON fc.fornecedor_id = f.id
      LEFT JOIN mdr m ON fc.mdr_id = m.id
      WHERE iml.customer_id = $1 AND iml.is_active = true ${statusFilter}
      ORDER BY f.nome, cat.mcc
    `, [customerId]);

    return rows.map(row => ({
      id: row.fornecedor_category_id,
      linkId: row.link_id,
      isActive: row.is_active,
      linkedAt: row.linked_at,
      fornecedorCategoryId: row.fornecedor_category_id,
      mcc: row.mcc || '',
      cnae: row.cnae || '',
      categoryName: row.category_name || '',
      fornecedorId: row.fornecedor_id,
      fornecedorNome: row.fornecedor_nome,
      hasMdr: !!row.mdr_id,
      mdrId: row.mdr_id,
      bandeiras: row.bandeiras || '',
      debitoPos: row.debitopos || '',
      creditoPos: row.creditopos || '',
      credito2xPos: row.credito2xpos || '',
      credito7xPos: row.credito7xpos || '',
      voucherPos: row.voucherpos || '',
      prePos: row.prepos || '',
      antecipacao: row.antecipacao || '',
      custoPixPos: row.custo_pix_pos || '',
      debitoOnline: row.debitoonline || '',
      creditoOnline: row.creditoonline || '',
      credito2xOnline: row.credito2xonline || '',
      credito7xOnline: row.credito7xonline || '',
      voucherOnline: row.voucheronline || '',
      preOnline: row.preonline || '',
      antecipacaoOnline: row.antecipacaoonline || '',
      custoPixOnline: row.custo_pix_online || '',
      status: row.link_status || 'rascunho'
    }));
  }

  async linkMdrTable(customerId: number, fornecedorCategoryId: string): Promise<void> {
    await sql.query(`
      INSERT INTO iso_mdr_links (customer_id, fornecedor_category_id, is_active, status)
      VALUES ($1, $2, true, 'rascunho')
      ON CONFLICT (customer_id, fornecedor_category_id) 
      DO UPDATE SET is_active = true, status = 'rascunho', updated_at = NOW()
    `, [customerId, fornecedorCategoryId]);
  }

  async unlinkMdrTable(customerId: number, fornecedorCategoryId: string): Promise<void> {
    await sql.query(`
      DELETE FROM iso_mdr_links 
      WHERE customer_id = $1 AND fornecedor_category_id = $2
    `, [customerId, fornecedorCategoryId]);
  }

  async getFornecedores(): Promise<Array<{ id: string; nome: string }>> {
    const { rows } = await sql.query(`
      SELECT id, nome FROM fornecedores WHERE ativo = true ORDER BY nome
    `);
    return rows;
  }

  async updateLinkStatus(
    customerId: number, 
    linkId: string, 
    newStatus: MdrValidationStatus, 
    userId: number
  ): Promise<void> {
    await sql.query(`
      UPDATE iso_mdr_links 
      SET status = $1::text, 
          validated_by = $2::bigint, 
          validated_at = CASE WHEN $1::text = 'validada' THEN NOW() ELSE validated_at END,
          updated_at = NOW()
      WHERE id = $3::uuid
    `, [newStatus, userId, linkId]);
  }

  async getIsoMdrMargins(isoMdrLinkId: string): Promise<IsoMdrMargin[]> {
    const { rows } = await sql.query(`
      SELECT id, iso_mdr_link_id, bandeira, modalidade, margin_iso, created_at, updated_at
      FROM iso_mdr_margins
      WHERE iso_mdr_link_id = $1
      ORDER BY bandeira, modalidade
    `, [isoMdrLinkId]);
    
    return rows.map(row => ({
      id: row.id,
      isoMdrLinkId: row.iso_mdr_link_id,
      bandeira: row.bandeira,
      modalidade: row.modalidade,
      marginIso: row.margin_iso,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  async initializeIsoMdrMarginsFromMdr(isoMdrLinkId: string, fornecedorCategoryId: string): Promise<void> {
    const { rows } = await sql.query(`
      SELECT m.bandeiras
      FROM fornecedor_categories fc
      JOIN mdr m ON fc.mdr_id = m.id
      WHERE fc.id = $1
    `, [fornecedorCategoryId]);
    
    if (!rows[0]?.bandeiras) return;
    
    const bandeiras = rows[0].bandeiras.split(',').map((b: string) => b.trim()).filter(Boolean);
    const modalidades = ['debito', 'credito', 'credito2x', 'credito7x', 'voucher', 'pre', 'pix'];
    
    for (const bandeira of bandeiras) {
      for (const modalidade of modalidades) {
        await sql.query(`
          INSERT INTO iso_mdr_margins (iso_mdr_link_id, bandeira, modalidade, margin_iso)
          VALUES ($1, $2, $3, '0')
          ON CONFLICT (iso_mdr_link_id, bandeira, modalidade) DO NOTHING
        `, [isoMdrLinkId, bandeira, modalidade]);
      }
    }
  }
}

export const isoMarginsRepository = new IsoMarginsRepository();
