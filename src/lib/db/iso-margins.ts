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

export type MdrValidationStatus = 'rascunho' | 'pendente_validacao' | 'validada' | 'rejeitada' | 'inativa';

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
    // Normalizar valores: trocar vírgula por ponto para evitar problemas com parseFloat
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

  async getAvailableMdrTables(fornecedorId?: string, includeAllStatuses?: boolean): Promise<MdrTableWithCost[]> {
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

  async updateLinkStatus(
    customerId: number,
    linkId: string,
    newStatus: MdrValidationStatus,
    userId: number,
    reason?: string
  ): Promise<void> {
    const { rows: linkRows } = await sql.query(
      `SELECT id, status, fornecedor_category_id FROM iso_mdr_links WHERE id = $1::uuid AND customer_id = $2::bigint`,
      [linkId, customerId]
    );

    if (!linkRows[0]) {
      throw new Error('Link não encontrado');
    }

    const previousStatus = linkRows[0].status || 'rascunho';
    const fornecedorCategoryId = linkRows[0].fornecedor_category_id;

    await sql.query(`
      UPDATE iso_mdr_links 
      SET status = $1::text, 
          validated_by = $2::bigint, 
          validated_at = CASE WHEN $1::text IN ('validada', 'rejeitada') THEN NOW() ELSE validated_at END,
          submitted_at = CASE WHEN $1::text = 'pendente_validacao' THEN NOW() ELSE submitted_at END,
          rejection_reason = CASE WHEN $1::text = 'rejeitada' THEN $3::text ELSE NULL END,
          updated_at = NOW()
      WHERE id = $4::uuid
    `, [newStatus, userId, reason, linkId]);

    await sql.query(`
      INSERT INTO iso_mdr_validation_history 
        (iso_mdr_link_id, customer_id, fornecedor_category_id, previous_status, new_status, changed_by, reason)
      VALUES ($1::uuid, $2::bigint, $3::uuid, $4::text, $5::text, $6::bigint, $7::text)
    `, [linkId, customerId, fornecedorCategoryId, previousStatus, newStatus, userId, reason]);
  }

  async getValidationHistory(customerId: number, linkId?: string): Promise<Array<{
    id: string;
    linkId: string;
    previousStatus: string | null;
    newStatus: string;
    changedBy: number;
    changedByName: string;
    reason: string | null;
    changedAt: Date;
  }>> {
    let query = `
      SELECT 
        h.id,
        h.iso_mdr_link_id as link_id,
        h.previous_status,
        h.new_status,
        h.changed_by,
        u.username as changed_by_name,
        h.reason,
        h.changed_at
      FROM iso_mdr_validation_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.customer_id = $1
    `;

    const params: any[] = [customerId];
    if (linkId) {
      query += ` AND h.iso_mdr_link_id = $2`;
      params.push(linkId);
    }

    query += ` ORDER BY h.changed_at DESC LIMIT 100`;

    const { rows } = await sql.query(query, params);

    return rows.map(row => ({
      id: row.id,
      linkId: row.link_id,
      previousStatus: row.previous_status,
      newStatus: row.new_status,
      changedBy: row.changed_by,
      changedByName: row.changed_by_name || 'Sistema',
      reason: row.reason,
      changedAt: row.changed_at
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
    const { rows } = await sql.query(`
      SELECT id FROM iso_mdr_links 
      WHERE customer_id = $1 AND fornecedor_category_id = $2
    `, [customerId, fornecedorCategoryId]);

    const linkId = rows[0]?.id;

    if (linkId) {
      await sql.query(`
        DELETE FROM iso_mdr_validation_history 
        WHERE iso_mdr_link_id = $1
      `, [linkId]);
    }

    await sql.query(`
      DELETE FROM iso_mdr_links 
      WHERE customer_id = $1 AND fornecedor_category_id = $2
    `, [customerId, fornecedorCategoryId]);

    await sql.query(`
      DELETE FROM iso_mdr_overrides 
      WHERE customer_id = $1 AND fornecedor_category_id = $2
    `, [customerId, fornecedorCategoryId]);
  }

  async deleteMdrLink(linkId: string): Promise<void> {
    await sql.query(`DELETE FROM iso_mdr_links WHERE id = $1`, [linkId]);
  }

  async getFornecedores(): Promise<Array<{ id: string; nome: string }>> {
    const { rows } = await sql.query(`
      SELECT id, nome FROM fornecedores WHERE ativo = true ORDER BY nome
    `);
    return rows;
  }

  // ===== ISO MDR MARGINS CRUD =====

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

  async createIsoMdrMargins(isoMdrLinkId: string, margins: Array<{ bandeira: string; modalidade: string; marginIso?: string }>): Promise<void> {
    if (margins.length === 0) return;

    const values = margins.map((m, i) => {
      const offset = i * 4;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
    }).join(', ');

    const params = margins.flatMap(m => [
      isoMdrLinkId,
      m.bandeira,
      m.modalidade,
      m.marginIso || '0'
    ]);

    await sql.query(`
      INSERT INTO iso_mdr_margins (iso_mdr_link_id, bandeira, modalidade, margin_iso)
      VALUES ${values}
      ON CONFLICT (iso_mdr_link_id, bandeira, modalidade) 
      DO UPDATE SET margin_iso = EXCLUDED.margin_iso, updated_at = NOW()
    `, params);
  }

  async updateIsoMdrMargin(marginId: string, marginIso: string): Promise<void> {
    const normalizedValue = marginIso.replace(',', '.');
    const numValue = parseFloat(normalizedValue);

    if (isNaN(numValue) || numValue < 0) {
      throw new Error('Margem ISO deve ser um número maior ou igual a zero');
    }

    await sql.query(`
      UPDATE iso_mdr_margins 
      SET margin_iso = $1, updated_at = NOW()
      WHERE id = $2
    `, [normalizedValue, marginId]);
  }

  async upsertIsoMdrMargin(isoMdrLinkId: string, bandeira: string, modalidade: string, marginIso: string): Promise<void> {
    const normalizedValue = marginIso.replace(',', '.');
    const numValue = parseFloat(normalizedValue);

    if (isNaN(numValue) || numValue < 0) {
      throw new Error('Margem ISO deve ser um número maior ou igual a zero');
    }

    await sql.query(`
      INSERT INTO iso_mdr_margins (iso_mdr_link_id, bandeira, modalidade, margin_iso)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (iso_mdr_link_id, bandeira, modalidade) 
      DO UPDATE SET margin_iso = $4, updated_at = NOW()
    `, [isoMdrLinkId, bandeira, modalidade, normalizedValue]);
  }

  async deleteIsoMdrMargins(isoMdrLinkId: string): Promise<void> {
    await sql.query(`DELETE FROM iso_mdr_margins WHERE iso_mdr_link_id = $1`, [isoMdrLinkId]);
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

    const margins: Array<{ bandeira: string; modalidade: string }> = [];
    for (const bandeira of bandeiras) {
      for (const modalidade of modalidades) {
        margins.push({ bandeira, modalidade });
      }
    }

    if (margins.length > 0) {
      await this.createIsoMdrMargins(isoMdrLinkId, margins);
    }
  }

  async getLinkedMdrTablesWithIsoMargins(customerId: number): Promise<LinkedMdrTableWithIsoMargin[]> {
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
        m.custo_pix_online,
        imc.margin_outbank,
        imc.margin_executivo,
        imc.margin_core
      FROM iso_mdr_links iml
      JOIN fornecedor_categories fc ON iml.fornecedor_category_id = fc.id
      JOIN categories cat ON fc.category_id = cat.id
      JOIN fornecedores f ON fc.fornecedor_id = f.id
      LEFT JOIN mdr m ON fc.mdr_id = m.id
      LEFT JOIN iso_margin_config imc ON iml.customer_id = imc.customer_id
      WHERE iml.customer_id = $1 AND iml.is_active = true
      ORDER BY f.nome, cat.mcc
    `, [customerId]);

    const linkedTables: LinkedMdrTableWithIsoMargin[] = [];

    for (const row of rows) {
      const isoMargins = await this.getIsoMdrMargins(row.link_id);

      linkedTables.push({
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
        status: row.link_status || 'rascunho',
        marginOutbank: row.margin_outbank || '0',
        marginExecutivo: row.margin_executivo || '0',
        marginCore: row.margin_core || '0',
        isoMargins
      });
    }

    return linkedTables;
  }

  async generateCostSnapshots(linkId: string): Promise<void> {
    const { rows } = await sql.query(`
      SELECT 
        iml.id as link_id,
        iml.customer_id,
        m.bandeiras,
        m.debitopos, m.creditopos, m.credito2xpos, m.credito7xpos, m.voucherpos, m.prepos, m.custo_pix_pos,
        m.debitoonline, m.creditoonline, m.credito2xonline, m.credito7xonline, m.voucheronline, m.preonline, m.custo_pix_online,
        m.antecipacao, m.antecipacaoonline,
        COALESCE(imc.margin_outbank, '0') as margin_outbank,
        COALESCE(imc.margin_executivo, '0') as margin_executivo,
        COALESCE(imc.margin_core, '0') as margin_core
      FROM iso_mdr_links iml
      JOIN fornecedor_categories fc ON iml.fornecedor_category_id = fc.id
      LEFT JOIN mdr m ON fc.mdr_id = m.id
      LEFT JOIN iso_margin_config imc ON iml.customer_id = imc.customer_id
      WHERE iml.id = $1
    `, [linkId]);

    if (!rows[0]) return;

    const row = rows[0];
    const bandeiras = (row.bandeiras || '').split(',').map((b: string) => b.trim()).filter(Boolean);
    const outbank = parseFloat(row.margin_outbank) || 0;
    const executivo = parseFloat(row.margin_executivo) || 0;
    const core = parseFloat(row.margin_core) || 0;
    const margemConsolidada = outbank + executivo + core;

    const modalidades = ['debito', 'credito', 'credito2x', 'credito7x', 'voucher', 'pre'];
    const channels: Array<'pos' | 'online'> = ['pos', 'online'];

    // Função para fazer parsing correto de valores MDR por bandeira
    // Os valores são armazenados como "0.67,0.67,1.02,0,0,0" onde cada posição corresponde a uma bandeira
    const getMdrValueForBandeira = (modalidade: string, channel: string, bandeiraIndex: number): number => {
      const key = `${modalidade}${channel}` as keyof typeof row;
      const rawValue = row[key];
      if (!rawValue) return 0;

      // Se for uma string com vírgulas, é um array de valores por bandeira
      const valuesStr = String(rawValue);
      if (valuesStr.includes(',')) {
        const values = valuesStr.split(',').map(v => parseFloat(v.trim()) || 0);
        return values[bandeiraIndex] || 0;
      }
      // Se for um valor único, usar para todas as bandeiras
      return parseFloat(valuesStr) || 0;
    };

    const isoMargins = await this.getIsoMdrMargins(linkId);

    for (let bandeiraIndex = 0; bandeiraIndex < bandeiras.length; bandeiraIndex++) {
      const bandeira = bandeiras[bandeiraIndex];

      for (const modalidade of modalidades) {
        for (const channel of channels) {
          const mdrValue = getMdrValueForBandeira(modalidade, channel, bandeiraIndex);
          // Custo base = custo dock (fornecedor) + margem outbank + margem executivo + margem core
          const custoBase = mdrValue + margemConsolidada;

          const isoMargin = isoMargins.find(
            m => m.bandeira === bandeira && m.modalidade === `${modalidade}_${channel}`
          );
          const marginIso = parseFloat(isoMargin?.marginIso || '0') || 0;
          const taxaFinal = custoBase + marginIso;

          await sql.query(`
            INSERT INTO iso_mdr_cost_snapshots 
              (iso_mdr_link_id, bandeira, modalidade, channel, custo_base, margin_iso, taxa_final, snapshot_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (iso_mdr_link_id, bandeira, modalidade, channel)
            DO UPDATE SET 
              custo_base = EXCLUDED.custo_base,
              margin_iso = EXCLUDED.margin_iso,
              taxa_final = EXCLUDED.taxa_final,
              snapshot_at = NOW(),
              updated_at = NOW()
          `, [linkId, bandeira, modalidade, channel, custoBase.toFixed(4), marginIso.toFixed(4), taxaFinal.toFixed(4)]);
        }
      }

      // PIX: também precisa incluir as margens consolidadas
      const pixPosRaw = parseFloat(row.custo_pix_pos) || 0;
      const pixOnlineRaw = parseFloat(row.custo_pix_online) || 0;
      // PIX custo base = custo dock + margens
      const pixPosCustoBase = pixPosRaw + margemConsolidada;
      const pixOnlineCustoBase = pixOnlineRaw + margemConsolidada;

      const isoMarginPixPos = isoMargins.find(m => m.bandeira === bandeira && m.modalidade === 'pix_pos');
      const isoMarginPixOnline = isoMargins.find(m => m.bandeira === bandeira && m.modalidade === 'pix_online');
      const marginIsoPixPos = parseFloat(isoMarginPixPos?.marginIso || '0') || 0;
      const marginIsoPixOnline = parseFloat(isoMarginPixOnline?.marginIso || '0') || 0;

      await sql.query(`
        INSERT INTO iso_mdr_cost_snapshots 
          (iso_mdr_link_id, bandeira, modalidade, channel, custo_base, margin_iso, taxa_final, snapshot_at)
        VALUES ($1, $2, 'pix', 'pos', $3, $4, $5, NOW())
        ON CONFLICT (iso_mdr_link_id, bandeira, modalidade, channel)
        DO UPDATE SET custo_base = EXCLUDED.custo_base, margin_iso = EXCLUDED.margin_iso, taxa_final = EXCLUDED.taxa_final, snapshot_at = NOW(), updated_at = NOW()
      `, [linkId, bandeira, pixPosCustoBase.toFixed(4), marginIsoPixPos.toFixed(4), (pixPosCustoBase + marginIsoPixPos).toFixed(4)]);

      await sql.query(`
        INSERT INTO iso_mdr_cost_snapshots 
          (iso_mdr_link_id, bandeira, modalidade, channel, custo_base, margin_iso, taxa_final, snapshot_at)
        VALUES ($1, $2, 'pix', 'online', $3, $4, $5, NOW())
        ON CONFLICT (iso_mdr_link_id, bandeira, modalidade, channel)
        DO UPDATE SET custo_base = EXCLUDED.custo_base, margin_iso = EXCLUDED.margin_iso, taxa_final = EXCLUDED.taxa_final, snapshot_at = NOW(), updated_at = NOW()
      `, [linkId, bandeira, pixOnlineCustoBase.toFixed(4), marginIsoPixOnline.toFixed(4), (pixOnlineCustoBase + marginIsoPixOnline).toFixed(4)]);
    }

    const parseAntecipacaoValue = (value: string | null): number => {
      if (!value) return 0;
      const cleaned = value.replace(',', '.');
      return parseFloat(cleaned) || 0;
    };

    // Antecipação: custo dock + margens consolidadas
    const antecipacaoPos = parseAntecipacaoValue(row.antecipacao) + margemConsolidada;
    const antecipacaoOnline = parseAntecipacaoValue(row.antecipacaoonline) + margemConsolidada;
    const isoMarginAntecipacaoPos = isoMargins.find(m => m.modalidade === 'antecipacao_pos');
    const isoMarginAntecipacaoOnline = isoMargins.find(m => m.modalidade === 'antecipacao_online');
    const marginAntecipacaoPos = parseFloat(isoMarginAntecipacaoPos?.marginIso || '0') || 0;
    const marginAntecipacaoOnline = parseFloat(isoMarginAntecipacaoOnline?.marginIso || '0') || 0;

    await sql.query(`
      INSERT INTO iso_mdr_cost_snapshots 
        (iso_mdr_link_id, bandeira, modalidade, channel, custo_base, margin_iso, taxa_final, snapshot_at)
      VALUES ($1, 'ALL', 'antecipacao', 'pos', $2, $3, $4, NOW())
      ON CONFLICT (iso_mdr_link_id, bandeira, modalidade, channel)
      DO UPDATE SET custo_base = EXCLUDED.custo_base, margin_iso = EXCLUDED.margin_iso, taxa_final = EXCLUDED.taxa_final, snapshot_at = NOW(), updated_at = NOW()
    `, [linkId, antecipacaoPos.toFixed(4), marginAntecipacaoPos.toFixed(4), (antecipacaoPos + marginAntecipacaoPos).toFixed(4)]);

    await sql.query(`
      INSERT INTO iso_mdr_cost_snapshots 
        (iso_mdr_link_id, bandeira, modalidade, channel, custo_base, margin_iso, taxa_final, snapshot_at)
      VALUES ($1, 'ALL', 'antecipacao', 'online', $2, $3, $4, NOW())
      ON CONFLICT (iso_mdr_link_id, bandeira, modalidade, channel)
      DO UPDATE SET custo_base = EXCLUDED.custo_base, margin_iso = EXCLUDED.margin_iso, taxa_final = EXCLUDED.taxa_final, snapshot_at = NOW(), updated_at = NOW()
    `, [linkId, antecipacaoOnline.toFixed(4), marginAntecipacaoOnline.toFixed(4), (antecipacaoOnline + marginAntecipacaoOnline).toFixed(4)]);
  }

  async getCostSnapshots(linkId: string): Promise<Array<{
    bandeira: string;
    modalidade: string;
    channel: string;
    custoBase: string;
    marginIso: string;
    taxaFinal: string;
    snapshotAt: Date;
  }>> {
    const { rows } = await sql.query(`
      SELECT bandeira, modalidade, channel, custo_base, margin_iso, taxa_final, snapshot_at
      FROM iso_mdr_cost_snapshots
      WHERE iso_mdr_link_id = $1
      ORDER BY bandeira, modalidade, channel
    `, [linkId]);

    return rows.map(row => ({
      bandeira: row.bandeira,
      modalidade: row.modalidade,
      channel: row.channel,
      custoBase: row.custo_base,
      marginIso: row.margin_iso,
      taxaFinal: row.taxa_final,
      snapshotAt: row.snapshot_at
    }));
  }

  async getValidatedTablesForIso(customerId: number): Promise<Array<{
    linkId: string;
    isoNome: string;
    mcc: string;
    categoryName: string;
    bandeiras: string;
    validatedAt: Date;
    taxas: Array<{
      bandeira: string;
      modalidade: string;
      channel: string;
      taxaConsolidada: string;
    }>;
  }>> {
    const { rows } = await sql.query(`
      SELECT 
        iml.id as link_id,
        c.name as iso_nome,
        cat.mcc,
        cat.name as category_name,
        m.bandeiras,
        iml.validated_at
      FROM iso_mdr_links iml
      JOIN fornecedor_categories fc ON iml.fornecedor_category_id = fc.id
      JOIN categories cat ON fc.category_id = cat.id
      JOIN customers c ON iml.customer_id = c.id
      LEFT JOIN mdr m ON fc.mdr_id = m.id
      WHERE iml.customer_id = $1 AND iml.status = 'validada' AND iml.is_active = true
      ORDER BY c.name, cat.mcc
    `, [customerId]);

    const result = [];
    for (const row of rows) {
      const snapshots = await this.getCostSnapshots(row.link_id);

      result.push({
        linkId: row.link_id,
        isoNome: row.iso_nome,
        mcc: row.mcc,
        categoryName: row.category_name,
        bandeiras: row.bandeiras || '',
        validatedAt: row.validated_at,
        taxas: snapshots.map(s => ({
          bandeira: s.bandeira,
          modalidade: s.modalidade,
          channel: s.channel,
          taxaConsolidada: s.custoBase
        }))
      });
    }

    return result;
  }

  async deleteCostSnapshots(linkId: string): Promise<void> {
    await sql.query(`DELETE FROM iso_mdr_cost_snapshots WHERE iso_mdr_link_id = $1`, [linkId]);
  }

  async getValidatedTablesStructured(customerId: number): Promise<Array<{
    linkId: string;
    mcc: string;
    categoryName: string;
    iso: string;
    bandeirasCount: number;
    bandeirasLista: string[];
    status: string;
    validatedAt: string;
    channels: {
      pos: {
        bandeiras: Record<string, {
          debito: { taxaConsolidada: string };
          creditoVista: { taxaConsolidada: string };
          credito2a6x: { taxaConsolidada: string };
          credito7a12x: { taxaConsolidada: string };
          prePago: { taxaConsolidada: string };
          voucher: { taxaConsolidada: string };
        }>;
        pix: { taxaConsolidada: string };
        antecipacao: { taxaConsolidada: string };
      };
      online: {
        bandeiras: Record<string, {
          debito: { taxaConsolidada: string };
          creditoVista: { taxaConsolidada: string };
          credito2a6x: { taxaConsolidada: string };
          credito7a12x: { taxaConsolidada: string };
          prePago: { taxaConsolidada: string };
          voucher: { taxaConsolidada: string };
        }>;
        pix: { taxaConsolidada: string };
        antecipacao: { taxaConsolidada: string };
      };
    };
  }>> {
    const { rows } = await sql.query(`
      SELECT 
        iml.id as link_id,
        cat.mcc,
        cat.name as category_name,
        c.name as iso_nome,
        m.bandeiras,
        iml.validated_at
      FROM iso_mdr_links iml
      JOIN fornecedor_categories fc ON iml.fornecedor_category_id = fc.id
      JOIN categories cat ON fc.category_id = cat.id
      JOIN customers c ON iml.customer_id = c.id
      LEFT JOIN mdr m ON fc.mdr_id = m.id
      WHERE iml.customer_id = $1 AND iml.status = 'validada' AND iml.is_active = true
      ORDER BY cat.mcc
    `, [customerId]);

    const result = [];

    for (const row of rows) {
      const snapshots = await this.getCostSnapshots(row.link_id);
      const bandeirasLista = (row.bandeiras || '').split(',').map((b: string) => b.trim()).filter(Boolean);

      const getConsolidatedValue = (bandeira: string, modalidade: string, channel: string) => {
        const snapshot = snapshots.find(s =>
          s.bandeira === bandeira && s.modalidade === modalidade && s.channel === channel
        );
        return { taxaConsolidada: snapshot?.custoBase || '0.0000' };
      };

      const getPixValue = (channel: 'pos' | 'online') => {
        const firstBandeira = bandeirasLista[0];
        if (!firstBandeira) return { taxaConsolidada: '0.0000' };
        return getConsolidatedValue(firstBandeira, 'pix', channel);
      };

      const getAntecipacaoValue = (channel: 'pos' | 'online') => {
        const snapshot = snapshots.find(s =>
          s.bandeira === 'ALL' && s.modalidade === 'antecipacao' && s.channel === channel
        );
        return { taxaConsolidada: snapshot?.custoBase || '0.0000' };
      };

      const buildBandeirasData = (channel: 'pos' | 'online') => {
        const bandeirasData: Record<string, any> = {};
        for (const bandeira of bandeirasLista) {
          bandeirasData[bandeira] = {
            debito: getConsolidatedValue(bandeira, 'debito', channel),
            creditoVista: getConsolidatedValue(bandeira, 'credito', channel),
            credito2a6x: getConsolidatedValue(bandeira, 'credito2x', channel),
            credito7a12x: getConsolidatedValue(bandeira, 'credito7x', channel),
            prePago: getConsolidatedValue(bandeira, 'pre', channel),
            voucher: getConsolidatedValue(bandeira, 'voucher', channel)
          };
        }
        return bandeirasData;
      };

      result.push({
        linkId: row.link_id,
        mcc: row.mcc,
        categoryName: row.category_name,
        iso: row.iso_nome?.trim() || '',
        bandeirasCount: bandeirasLista.length,
        bandeirasLista,
        status: 'Validada',
        validatedAt: row.validated_at?.toISOString() || '',
        channels: {
          pos: {
            bandeiras: buildBandeirasData('pos'),
            pix: getPixValue('pos'),
            antecipacao: getAntecipacaoValue('pos')
          },
          online: {
            bandeiras: buildBandeirasData('online'),
            pix: getPixValue('online'),
            antecipacao: getAntecipacaoValue('online')
          }
        }
      });
    }

    return result;
  }
}

export const isoMarginsRepository = new IsoMarginsRepository();
