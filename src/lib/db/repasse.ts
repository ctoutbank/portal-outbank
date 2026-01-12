import { sql } from '@vercel/postgres';
import { getInheritedCommissions } from './inherited-commissions';

export interface MonthlySettlement {
  id: number;
  userId: number;
  customerId: number;
  customerName: string;
  month: number;
  year: number;
  totalTransactions: number;
  totalAmount: number;
  commissionPercent: number;
  commissionValue: number;
  status: string;
  invoiceDeadline: string | null;
  paymentDeadline: string | null;
  paidAt: string | null;
  paidByUserId: number | null;
  invoice: SettlementInvoice | null;
}

export interface SettlementInvoice {
  id: number;
  settlementId: number;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  accessKey: string | null;
  invoiceNumber: string | null;
  invoiceValue: number | null;
  issuerCnpj: string | null;
  issuerName: string | null;
  validationStatus: string;
  validatedAt: string | null;
  validationError: string | null;
}

export interface RepasseFilters {
  year?: number;
  customerId?: number;
}

export interface RepasseResult {
  settlements: MonthlySettlement[];
  yearSummary: {
    totalTransactions: number;
    totalAmount: number;
    totalCommission: number;
    eligibleAmount: number;
    paidAmount: number;
    pendingAmount: number;
  };
}

const MINIMUM_REPASSE_VALUE = 100.00;

async function isSuperAdmin(userId: number): Promise<boolean> {
  const { rows } = await sql.query(`
    SELECT user_type FROM users WHERE id = $1
  `, [userId]);
  return rows[0]?.user_type === 'SUPER_ADMIN';
}

export async function getUserRepasseData(
  userId: number,
  filters: RepasseFilters = {}
): Promise<RepasseResult> {
  const currentYear = new Date().getFullYear();
  const year = filters.year || currentYear;

  const { rows: settlements } = await sql.query(`
    SELECT 
      ums.id,
      ums.id_user,
      ums.id_customer,
      c.name as customer_name,
      ums.month,
      ums.year,
      ums.total_transactions,
      ums.total_amount,
      ums.commission_percent,
      ums.commission_value,
      ums.status,
      ums.invoice_deadline,
      ums.payment_deadline,
      ums.paid_at,
      ums.paid_by_user_id,
      si.id as invoice_id,
      si.file_url,
      si.file_name,
      si.file_type,
      si.access_key,
      si.invoice_number,
      si.invoice_value,
      si.issuer_cnpj,
      si.issuer_name,
      si.validation_status,
      si.validated_at,
      si.validation_error
    FROM user_monthly_settlements ums
    LEFT JOIN customers c ON ums.id_customer = c.id
    LEFT JOIN settlement_invoices si ON ums.id = si.id_settlement AND si.active = true
    WHERE ums.id_user = $1 
      AND ums.year = $2 
      AND ums.active = true
    ORDER BY ums.month ASC
  `, [userId, year]);

  const formattedSettlements: MonthlySettlement[] = settlements.map((row: any) => ({
    id: row.id,
    userId: row.id_user,
    customerId: row.id_customer,
    customerName: row.customer_name || 'N/A',
    month: row.month,
    year: row.year,
    totalTransactions: row.total_transactions || 0,
    totalAmount: parseFloat(row.total_amount) || 0,
    commissionPercent: parseFloat(row.commission_percent) || 0,
    commissionValue: parseFloat(row.commission_value) || 0,
    status: row.status,
    invoiceDeadline: row.invoice_deadline,
    paymentDeadline: row.payment_deadline,
    paidAt: row.paid_at,
    paidByUserId: row.paid_by_user_id,
    invoice: row.invoice_id ? {
      id: row.invoice_id,
      settlementId: row.id,
      fileUrl: row.file_url,
      fileName: row.file_name,
      fileType: row.file_type,
      accessKey: row.access_key,
      invoiceNumber: row.invoice_number,
      invoiceValue: parseFloat(row.invoice_value) || null,
      issuerCnpj: row.issuer_cnpj,
      issuerName: row.issuer_name,
      validationStatus: row.validation_status || 'pending',
      validatedAt: row.validated_at,
      validationError: row.validation_error,
    } : null,
  }));

  const yearSummary = formattedSettlements.reduce((acc, s) => {
    acc.totalTransactions += s.totalTransactions;
    acc.totalAmount += s.totalAmount;
    acc.totalCommission += s.commissionValue;
    if (s.status === 'eligible') {
      acc.eligibleAmount += s.commissionValue;
    } else if (s.status === 'paid') {
      acc.paidAmount += s.commissionValue;
    } else if (s.status === 'pending_invoice' || s.status === 'validating') {
      acc.pendingAmount += s.commissionValue;
    }
    return acc;
  }, {
    totalTransactions: 0,
    totalAmount: 0,
    totalCommission: 0,
    eligibleAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
  });

  return {
    settlements: formattedSettlements,
    yearSummary,
  };
}

export async function consolidateMonthlySettlements(
  targetMonth?: number,
  targetYear?: number
): Promise<{ created: number; updated: number; errors: string[] }> {
  const now = new Date();
  const month = targetMonth ?? (now.getMonth() === 0 ? 12 : now.getMonth());
  const year = targetYear ?? (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
  
  const errors: string[] = [];
  let created = 0;
  let updated = 0;

  try {
    const { rows: usersWithCommissions } = await sql.query(`
      SELECT DISTINCT 
        uc.id_user,
        uc.id_customer,
        uc.commission_type,
        c.slug as customer_slug,
        c.name as customer_name,
        CASE 
          WHEN uc.commission_type = 'Executivo' THEN COALESCE(imc.margin_executivo, 0)
          WHEN uc.commission_type = 'Core' THEN COALESCE(imc.margin_core, 0)
          ELSE 0
        END as commission_percent
      FROM user_customers uc
      JOIN customers c ON uc.id_customer = c.id
      LEFT JOIN iso_margin_config imc ON c.id = imc.customer_id
      WHERE uc.active = true
        AND uc.commission_type IS NOT NULL
    `);

    for (const userCommission of usersWithCommissions) {
      try {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0);
        const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')} 23:59:59`;

        const { rows: transactionData } = await sql.query(`
          SELECT 
            COUNT(*) as transaction_count,
            COALESCE(SUM(total_amount), 0) as total_amount
          FROM transactions
          WHERE slug_customer = $1
            AND dt_insert >= $2
            AND dt_insert <= $3
            AND transaction_status = 'APPROVED'
        `, [userCommission.customer_slug, startDate, endDateStr]);

        const totalTransactions = parseInt(transactionData[0]?.transaction_count || '0');
        const totalAmount = parseFloat(transactionData[0]?.total_amount || '0');
        const commissionPercent = parseFloat(userCommission.commission_percent) || 0;
        const commissionValue = (totalAmount * commissionPercent) / 100;

        const invoiceDeadline = new Date(year, month, 7);
        const paymentDeadline = new Date(year, month, 15);

        let status = 'pending_invoice';
        if (commissionValue < MINIMUM_REPASSE_VALUE) {
          status = 'accumulated';
        }

        const { rows: existing } = await sql.query(`
          SELECT id, commission_value FROM user_monthly_settlements
          WHERE id_user = $1 AND id_customer = $2 AND month = $3 AND year = $4
        `, [userCommission.id_user, userCommission.id_customer, month, year]);

        if (existing.length > 0) {
          await sql.query(`
            UPDATE user_monthly_settlements
            SET 
              total_transactions = $1,
              total_amount = $2,
              commission_percent = $3,
              commission_value = $4,
              status = CASE WHEN status IN ('paid', 'eligible') THEN status ELSE $5 END,
              dtupdate = CURRENT_TIMESTAMP
            WHERE id = $6
          `, [totalTransactions, totalAmount, commissionPercent, commissionValue, status, existing[0].id]);
          updated++;
        } else {
          await sql.query(`
            INSERT INTO user_monthly_settlements (
              id_user, id_customer, month, year,
              total_transactions, total_amount, commission_percent, commission_value,
              status, invoice_deadline, payment_deadline
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            userCommission.id_user,
            userCommission.id_customer,
            month,
            year,
            totalTransactions,
            totalAmount,
            commissionPercent,
            commissionValue,
            status,
            invoiceDeadline.toISOString().split('T')[0],
            paymentDeadline.toISOString().split('T')[0],
          ]);
          created++;
        }
      } catch (err: any) {
        errors.push(`Error for user ${userCommission.id_user}, customer ${userCommission.id_customer}: ${err.message}`);
      }
    }

    return { created, updated, errors };
  } catch (err: any) {
    errors.push(`General consolidation error: ${err.message}`);
    return { created, updated, errors };
  }
}

export async function uploadSettlementInvoice(
  settlementId: number,
  fileUrl: string,
  fileName: string,
  fileType: string
): Promise<{ success: boolean; invoiceId?: number; error?: string }> {
  try {
    const { rows: existing } = await sql.query(`
      SELECT id FROM settlement_invoices WHERE id_settlement = $1 AND active = true
    `, [settlementId]);

    if (existing.length > 0) {
      await sql.query(`
        UPDATE settlement_invoices SET active = false, dtupdate = CURRENT_TIMESTAMP
        WHERE id_settlement = $1
      `, [settlementId]);
    }

    const { rows } = await sql.query(`
      INSERT INTO settlement_invoices (id_settlement, file_url, file_name, file_type, validation_status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING id
    `, [settlementId, fileUrl, fileName, fileType]);

    await sql.query(`
      UPDATE user_monthly_settlements
      SET status = 'validating', dtupdate = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [settlementId]);

    return { success: true, invoiceId: rows[0].id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateInvoiceValidation(
  invoiceId: number,
  validationStatus: 'valid' | 'invalid',
  accessKey?: string,
  invoiceNumber?: string,
  invoiceValue?: number,
  issuerCnpj?: string,
  issuerName?: string,
  sefazResponse?: any,
  validationError?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await sql.query(`
      UPDATE settlement_invoices
      SET 
        validation_status = $1,
        access_key = COALESCE($2, access_key),
        invoice_number = COALESCE($3, invoice_number),
        invoice_value = COALESCE($4, invoice_value),
        issuer_cnpj = COALESCE($5, issuer_cnpj),
        issuer_name = COALESCE($6, issuer_name),
        sefaz_response = COALESCE($7, sefaz_response),
        validation_error = $8,
        validated_at = CURRENT_TIMESTAMP,
        dtupdate = CURRENT_TIMESTAMP
      WHERE id = $9
    `, [validationStatus, accessKey, invoiceNumber, invoiceValue, issuerCnpj, issuerName, JSON.stringify(sefazResponse), validationError, invoiceId]);

    const { rows } = await sql.query(`
      SELECT id_settlement FROM settlement_invoices WHERE id = $1
    `, [invoiceId]);

    if (rows[0]) {
      const newStatus = validationStatus === 'valid' ? 'eligible' : 'pending_invoice';
      await sql.query(`
        UPDATE user_monthly_settlements
        SET status = $1, dtupdate = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [newStatus, rows[0].id_settlement]);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function markSettlementAsPaid(
  settlementId: number,
  paidByUserId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { rows } = await sql.query(`
      SELECT status FROM user_monthly_settlements WHERE id = $1
    `, [settlementId]);

    if (!rows[0]) {
      return { success: false, error: 'Settlement not found' };
    }

    if (rows[0].status !== 'eligible') {
      return { success: false, error: 'Settlement is not eligible for payment' };
    }

    await sql.query(`
      UPDATE user_monthly_settlements
      SET status = 'paid', paid_at = CURRENT_TIMESTAMP, paid_by_user_id = $1, dtupdate = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [paidByUserId, settlementId]);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAllSettlementsForAdmin(
  filters: {
    status?: string;
    month?: number;
    year?: number;
    userId?: number;
    page?: number;
    pageSize?: number;
    requestingUserId?: number; // ID do usuário que está fazendo a requisição
  } = {}
): Promise<{
  settlements: Array<MonthlySettlement & { userName: string; userEmail: string }>;
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}> {
  const { status, month, year, userId, page = 1, pageSize = 20, requestingUserId } = filters;
  
  // Verificar se o requisitante é SuperAdmin
  let isRequestingSuperAdmin = false;
  if (requestingUserId) {
    const { rows: reqUserRows } = await sql.query(`
      SELECT user_type FROM users WHERE id = $1
    `, [requestingUserId]);
    isRequestingSuperAdmin = reqUserRows[0]?.user_type === 'SUPER_ADMIN';
  }
  
  let whereClause = 'WHERE ums.active = true';
  const params: any[] = [];
  let paramIndex = 1;

  // Se o requisitante NÃO é SuperAdmin, excluir settlements de usuários SuperAdmin
  if (!isRequestingSuperAdmin) {
    whereClause += ` AND NOT EXISTS (
      SELECT 1 FROM users u2 WHERE u2.id = ums.id_user AND u2.user_type = 'SUPER_ADMIN'
    )`;
  }

  if (status) {
    whereClause += ` AND ums.status = $${paramIndex++}`;
    params.push(status);
  }
  if (month) {
    whereClause += ` AND ums.month = $${paramIndex++}`;
    params.push(month);
  }
  if (year) {
    whereClause += ` AND ums.year = $${paramIndex++}`;
    params.push(year);
  }
  if (userId) {
    whereClause += ` AND ums.id_user = $${paramIndex++}`;
    params.push(userId);
  }

  const countParams = [...params];
  const { rows: countRows } = await sql.query(`
    SELECT COUNT(*) as total FROM user_monthly_settlements ums ${whereClause}
  `, countParams);
  const totalItems = parseInt(countRows[0]?.total || '0');
  const totalPages = Math.ceil(totalItems / pageSize);

  const offset = (page - 1) * pageSize;
  params.push(pageSize, offset);

  const { rows } = await sql.query(`
    SELECT 
      ums.*,
      c.name as customer_name,
      u.email as user_email,
      p.name as user_name,
      si.id as invoice_id,
      si.file_url,
      si.file_name,
      si.file_type,
      si.access_key,
      si.invoice_number,
      si.invoice_value,
      si.issuer_cnpj,
      si.issuer_name,
      si.validation_status,
      si.validated_at,
      si.validation_error
    FROM user_monthly_settlements ums
    LEFT JOIN customers c ON ums.id_customer = c.id
    LEFT JOIN users u ON ums.id_user = u.id
    LEFT JOIN profiles p ON u.id_profile = p.id
    LEFT JOIN settlement_invoices si ON ums.id = si.id_settlement AND si.active = true
    ${whereClause}
    ORDER BY ums.year DESC, ums.month DESC, ums.id DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `, params);

  const settlements = rows.map((row: any) => ({
    id: row.id,
    userId: row.id_user,
    customerId: row.id_customer,
    customerName: row.customer_name || 'N/A',
    month: row.month,
    year: row.year,
    totalTransactions: row.total_transactions || 0,
    totalAmount: parseFloat(row.total_amount) || 0,
    commissionPercent: parseFloat(row.commission_percent) || 0,
    commissionValue: parseFloat(row.commission_value) || 0,
    status: row.status,
    invoiceDeadline: row.invoice_deadline,
    paymentDeadline: row.payment_deadline,
    paidAt: row.paid_at,
    paidByUserId: row.paid_by_user_id,
    userName: row.user_name || row.user_email || 'N/A',
    userEmail: row.user_email || 'N/A',
    invoice: row.invoice_id ? {
      id: row.invoice_id,
      settlementId: row.id,
      fileUrl: row.file_url,
      fileName: row.file_name,
      fileType: row.file_type,
      accessKey: row.access_key,
      invoiceNumber: row.invoice_number,
      invoiceValue: parseFloat(row.invoice_value) || null,
      issuerCnpj: row.issuer_cnpj,
      issuerName: row.issuer_name,
      validationStatus: row.validation_status || 'pending',
      validatedAt: row.validated_at,
      validationError: row.validation_error,
    } : null,
  }));

  return {
    settlements,
    pagination: { page, pageSize, totalItems, totalPages },
  };
}
