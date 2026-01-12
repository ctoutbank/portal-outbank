import { neon } from '@neondatabase/serverless';



function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }
  return neon(process.env.DATABASE_URL);
}

export interface MdrVersion {
  id: string;
  version: number;
  parentMdrId: string | null;
  isCurrent: boolean;
  createdAt: string;
}

export interface IsoMdrLinkVersion {
  id: string;
  customerId: number;
  fornecedorCategoryId: string;
  version: number;
  validFrom: string | null;
  validUntil: string | null;
  autoRenew: boolean;
  pendingUpdate: boolean;
  pendingVersionId: string | null;
  status: string;
}

export interface IsoNotification {
  id: string;
  customerId: number;
  type: 'new_version' | 'expiring_30d' | 'expiring_7d' | 'expired' | 'version_applied';
  title: string;
  message: string;
  isoMdrLinkId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export async function createMdrVersion(originalMdrId: string): Promise<string> {
  const [original] = await getSql()`
    SELECT * FROM mdr WHERE id = ${originalMdrId}::uuid
  `;

  if (!original) {
    throw new Error('MDR não encontrado');
  }

  const [newMdr] = await getSql()`
    WITH updated AS (
      UPDATE mdr SET is_current = false WHERE id = ${originalMdrId}::uuid
      RETURNING id
    )
    INSERT INTO mdr (
      bandeiras, debitopos, creditopos, credito2xpos, credito7xpos,
      voucherpos, prepos, mdrpos, cminpos, cmaxpos, antecipacao,
      debitoonline, creditoonline, credito2xonline, credito7xonline,
      voucheronline, preonline, mdronline, cminonline, cmaxonline,
      antecipacaoonline, created_by, custo_pix_pos, margem_pix_pos,
      custo_pix_online, margem_pix_online, version, parent_mdr_id, is_current
    )
    SELECT 
      bandeiras, debitopos, creditopos, credito2xpos, credito7xpos,
      voucherpos, prepos, mdrpos, cminpos, cmaxpos, antecipacao,
      debitoonline, creditoonline, credito2xonline, credito7xonline,
      voucheronline, preonline, mdronline, cminonline, cmaxonline,
      antecipacaoonline, created_by, custo_pix_pos, margem_pix_pos,
      custo_pix_online, margem_pix_online, 
      COALESCE(version, 1) + 1, 
      ${originalMdrId}::uuid, 
      true
    FROM mdr WHERE id = ${originalMdrId}::uuid
    RETURNING id
  `;

  return newMdr.id;
}

export async function notifyIsosOfNewVersion(
  fornecedorCategoryId: string,
  newMdrId: string
): Promise<void> {
  const affectedLinks = await getSql()`
    SELECT iml.id, iml.customer_id, c.name as customer_name
    FROM iso_mdr_links iml
    JOIN customers c ON iml.customer_id = c.id
    WHERE iml.fornecedor_category_id = ${fornecedorCategoryId}::uuid
      AND iml.status = 'validada'
      AND iml.is_active = true
  `;

  for (const link of affectedLinks) {
    await getSql()`
      UPDATE iso_mdr_links 
      SET pending_update = true, pending_version_id = ${newMdrId}::uuid
      WHERE id = ${link.id}::uuid
    `;

    await getSql()`
      INSERT INTO iso_notifications (customer_id, type, title, message, iso_mdr_link_id)
      VALUES (
        ${link.customer_id}::bigint,
        'new_version',
        'Nova versão de taxas disponível',
        'O fornecedor atualizou as taxas. Uma nova versão está disponível para sua tabela de taxas. A atualização será aplicada no vencimento do contrato ou você pode aceitar antecipadamente.',
        ${link.id}::uuid
      )
    `;
  }
}

export async function getIsoNotifications(customerId: number): Promise<IsoNotification[]> {
  const notifications = await getSql()`
    SELECT 
      id, customer_id, type, title, message, 
      iso_mdr_link_id, is_read, created_at, read_at
    FROM iso_notifications
    WHERE customer_id = ${customerId}::bigint
    ORDER BY created_at DESC
    LIMIT 50
  `;

  return notifications.map(n => ({
    id: n.id,
    customerId: Number(n.customer_id),
    type: n.type,
    title: n.title,
    message: n.message,
    isoMdrLinkId: n.iso_mdr_link_id,
    isRead: n.is_read,
    createdAt: n.created_at,
    readAt: n.read_at
  }));
}

export async function getUnreadNotificationCount(customerId: number): Promise<number> {
  const [result] = await getSql()`
    SELECT COUNT(*) as count
    FROM iso_notifications
    WHERE customer_id = ${customerId}::bigint AND is_read = false
  `;
  return Number(result.count);
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await getSql()`
    UPDATE iso_notifications 
    SET is_read = true, read_at = NOW()
    WHERE id = ${notificationId}::uuid
  `;
}

export async function markAllNotificationsAsRead(customerId: number): Promise<void> {
  await getSql()`
    UPDATE iso_notifications 
    SET is_read = true, read_at = NOW()
    WHERE customer_id = ${customerId}::bigint AND is_read = false
  `;
}

export async function getMdrVersionHistory(mdrId: string): Promise<MdrVersion[]> {
  const versions = await getSql()`
    WITH RECURSIVE version_chain AS (
      SELECT id, version, parent_mdr_id, is_current, created_at
      FROM mdr WHERE id = ${mdrId}::uuid
      
      UNION ALL
      
      SELECT m.id, m.version, m.parent_mdr_id, m.is_current, m.created_at
      FROM mdr m
      JOIN version_chain vc ON m.id = vc.parent_mdr_id
    )
    SELECT * FROM version_chain ORDER BY version DESC
  `;

  return versions.map(v => ({
    id: v.id,
    version: v.version || 1,
    parentMdrId: v.parent_mdr_id,
    isCurrent: v.is_current,
    createdAt: v.created_at
  }));
}

export async function getIsoLinkWithVersionInfo(linkId: string): Promise<IsoMdrLinkVersion | null> {
  const [link] = await getSql()`
    SELECT 
      id, customer_id, fornecedor_category_id, version,
      valid_from, valid_until, auto_renew, pending_update,
      pending_version_id, status
    FROM iso_mdr_links
    WHERE id = ${linkId}::uuid
  `;

  if (!link) return null;

  return {
    id: link.id,
    customerId: Number(link.customer_id),
    fornecedorCategoryId: link.fornecedor_category_id,
    version: link.version || 1,
    validFrom: link.valid_from,
    validUntil: link.valid_until,
    autoRenew: link.auto_renew ?? true,
    pendingUpdate: link.pending_update ?? false,
    pendingVersionId: link.pending_version_id,
    status: link.status
  };
}

export async function setLinkValidityDates(
  linkId: string,
  validFrom: string,
  validUntil: string,
  autoRenew: boolean = true
): Promise<void> {
  await sql`
    UPDATE iso_mdr_links
    SET valid_from = ${validFrom}::date, 
        valid_until = ${validUntil}::date,
        auto_renew = ${autoRenew}
    WHERE id = ${linkId}::uuid
  `;
}

export async function applyPendingVersion(linkId: string): Promise<void> {
  const [link] = await getSql()`
    SELECT iml.pending_version_id, iml.customer_id, iml.fornecedor_category_id,
           fc.fornecedor_id, fc.category_id
    FROM iso_mdr_links iml
    JOIN fornecedor_categories fc ON iml.fornecedor_category_id = fc.id
    WHERE iml.id = ${linkId}::uuid AND iml.pending_update = true
  `;

  if (!link || !link.pending_version_id) {
    throw new Error('Não há versão pendente para aplicar');
  }

  const [newFc] = await getSql()`
    INSERT INTO fornecedor_categories (fornecedor_id, category_id, mdr_id)
    VALUES (${link.fornecedor_id}::uuid, ${link.category_id}::bigint, ${link.pending_version_id}::uuid)
    ON CONFLICT (fornecedor_id, category_id) 
    DO UPDATE SET mdr_id = ${link.pending_version_id}::uuid, updated_at = NOW()
    RETURNING id
  `;

  await sql`
    UPDATE iso_mdr_links
    SET pending_update = false, 
        pending_version_id = null,
        version = COALESCE(version, 1) + 1,
        valid_from = CURRENT_DATE,
        fornecedor_category_id = ${newFc.id}::uuid,
        updated_at = NOW()
    WHERE id = ${linkId}::uuid
  `;

  await sql`
    INSERT INTO iso_notifications (customer_id, type, title, message, iso_mdr_link_id)
    VALUES (
      ${link.customer_id}::bigint,
      'version_applied',
      'Nova versão de taxas aplicada',
      'A nova versão de taxas foi aplicada com sucesso à sua tabela.',
      ${linkId}::uuid
    )
  `;
}

export async function checkExpiringContracts(): Promise<{
  expiring30d: IsoMdrLinkVersion[];
  expiring7d: IsoMdrLinkVersion[];
  expired: IsoMdrLinkVersion[];
}> {
  const today = new Date().toISOString().split('T')[0];
  const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const in30days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const expiring30d = await getSql()`
    SELECT id, customer_id, fornecedor_category_id, version, valid_from, valid_until, auto_renew, pending_update, pending_version_id, status
    FROM iso_mdr_links
    WHERE valid_until IS NOT NULL
      AND valid_until <= ${in30days}::date
      AND valid_until > ${in7days}::date
      AND status = 'validada'
      AND is_active = true
  `;

  const expiring7d = await getSql()`
    SELECT id, customer_id, fornecedor_category_id, version, valid_from, valid_until, auto_renew, pending_update, pending_version_id, status
    FROM iso_mdr_links
    WHERE valid_until IS NOT NULL
      AND valid_until <= ${in7days}::date
      AND valid_until > ${today}::date
      AND status = 'validada'
      AND is_active = true
  `;

  const expired = await getSql()`
    SELECT id, customer_id, fornecedor_category_id, version, valid_from, valid_until, auto_renew, pending_update, pending_version_id, status
    FROM iso_mdr_links
    WHERE valid_until IS NOT NULL
      AND valid_until <= ${today}::date
      AND status = 'validada'
      AND is_active = true
  `;

  const mapLink = (l: any): IsoMdrLinkVersion => ({
    id: l.id,
    customerId: Number(l.customer_id),
    fornecedorCategoryId: l.fornecedor_category_id,
    version: l.version || 1,
    validFrom: l.valid_from,
    validUntil: l.valid_until,
    autoRenew: l.auto_renew ?? true,
    pendingUpdate: l.pending_update ?? false,
    pendingVersionId: l.pending_version_id,
    status: l.status
  });

  return {
    expiring30d: expiring30d.map(mapLink),
    expiring7d: expiring7d.map(mapLink),
    expired: expired.map(mapLink)
  };
}

export async function processExpiringContracts(): Promise<{
  notified30d: number;
  notified7d: number;
  autoRenewed: number;
}> {
  const { expiring30d, expiring7d, expired } = await checkExpiringContracts();
  let notified30d = 0;
  let notified7d = 0;
  let autoRenewed = 0;

  for (const link of expiring30d) {
    const [existing] = await getSql()`
      SELECT id FROM iso_notifications 
      WHERE iso_mdr_link_id = ${link.id}::uuid 
        AND type = 'expiring_30d'
        AND created_at > NOW() - INTERVAL '25 days'
    `;

    if (!existing) {
      await getSql()`
        INSERT INTO iso_notifications (customer_id, type, title, message, iso_mdr_link_id)
        VALUES (
          ${link.customerId}::bigint,
          'expiring_30d',
          'Contrato expira em 30 dias',
          'Sua tabela de taxas expira em 30 dias. ' || 
          CASE WHEN ${link.pendingUpdate} THEN 'Uma nova versão será aplicada automaticamente.' ELSE 'Revise as condições do contrato.' END,
          ${link.id}::uuid
        )
      `;
      notified30d++;
    }
  }

  for (const link of expiring7d) {
    const [existing] = await getSql()`
      SELECT id FROM iso_notifications 
      WHERE iso_mdr_link_id = ${link.id}::uuid 
        AND type = 'expiring_7d'
        AND created_at > NOW() - INTERVAL '5 days'
    `;

    if (!existing) {
      await getSql()`
        INSERT INTO iso_notifications (customer_id, type, title, message, iso_mdr_link_id)
        VALUES (
          ${link.customerId}::bigint,
          'expiring_7d',
          'Último aviso: Contrato expira em 7 dias',
          'Sua tabela de taxas expira em 7 dias. ' ||
          CASE WHEN ${link.pendingUpdate} THEN 'Uma nova versão será aplicada automaticamente.' ELSE 'Ação necessária.' END,
          ${link.id}::uuid
        )
      `;
      notified7d++;
    }
  }

  for (const link of expired) {
    if (link.autoRenew && link.pendingUpdate && link.pendingVersionId) {
      await applyPendingVersion(link.id);
      autoRenewed++;
    } else {
      const [existing] = await getSql()`
        SELECT id FROM iso_notifications 
        WHERE iso_mdr_link_id = ${link.id}::uuid 
          AND type = 'expired'
          AND created_at > NOW() - INTERVAL '1 day'
      `;

      if (!existing) {
        await getSql()`
          INSERT INTO iso_notifications (customer_id, type, title, message, iso_mdr_link_id)
          VALUES (
            ${link.customerId}::bigint,
            'expired',
            'Contrato expirado',
            'Sua tabela de taxas expirou. Entre em contato para renovação.',
            ${link.id}::uuid
          )
        `;
      }
    }
  }

  return { notified30d, notified7d, autoRenewed };
}
