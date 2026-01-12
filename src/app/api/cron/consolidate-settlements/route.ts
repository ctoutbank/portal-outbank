import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

const CRON_SECRET = process.env.CRON_SECRET;
const MINIMUM_REPASSE_VALUE = 100.00;
const INVOICE_DEADLINE_DAY = 7;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    const results = {
      consolidated: 0,
      accumulated: 0,
      errors: [] as string[],
    };

    if (currentDay === 1) {
      const consolidationResult = await consolidateMonthlySettlements(currentMonth, currentYear);
      results.consolidated = consolidationResult.count;
      if (consolidationResult.error) {
        results.errors.push(consolidationResult.error);
      }
    }

    if (currentDay === INVOICE_DEADLINE_DAY + 1) {
      const accumulationResult = await processAccumulation(currentMonth, currentYear);
      results.accumulated = accumulationResult.count;
      if (accumulationResult.error) {
        results.errors.push(accumulationResult.error);
      }
    }

    console.log(`[Cron] Consolidation completed: ${results.consolidated} consolidated, ${results.accumulated} accumulated`);

    return NextResponse.json({
      success: true,
      message: 'Cron job executed successfully',
      results,
      executedAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron] Error executing cron job:', error);
    return NextResponse.json({ error: 'Cron job failed', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, month, year } = body;

    if (action === 'consolidate') {
      const targetMonth = month || new Date().getMonth() + 1;
      const targetYear = year || new Date().getFullYear();
      
      const result = await consolidateMonthlySettlements(targetMonth, targetYear);
      return NextResponse.json({
        success: !result.error,
        consolidated: result.count,
        error: result.error,
      });
    }

    if (action === 'accumulate') {
      const targetMonth = month || new Date().getMonth() + 1;
      const targetYear = year || new Date().getFullYear();
      
      const result = await processAccumulation(targetMonth, targetYear);
      return NextResponse.json({
        success: !result.error,
        accumulated: result.count,
        error: result.error,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Cron] Error executing manual action:', error);
    return NextResponse.json({ error: 'Action failed', details: error.message }, { status: 500 });
  }
}

async function consolidateMonthlySettlements(month: number, year: number): Promise<{ count: number; error?: string }> {
  try {
    let previousMonth = month - 1;
    let previousYear = year;
    if (previousMonth === 0) {
      previousMonth = 12;
      previousYear = year - 1;
    }

    const startDate = new Date(previousYear, previousMonth - 1, 1);
    const endDate = new Date(year, month - 1, 0, 23, 59, 59);

    console.log(`[Cron] Consolidating settlements for ${previousMonth}/${previousYear}`);

    const { rows: userCustomers } = await sql.query(`
      SELECT DISTINCT uc.id_user, uc.id_customer, uc.commission_type,
             u.name as user_name,
             c.name as customer_name
      FROM user_customers uc
      JOIN users u ON uc.id_user = u.id
      JOIN customers c ON uc.id_customer = c.id
      WHERE uc.active = true AND u.active = true
    `);

    let consolidatedCount = 0;

    for (const userCustomer of userCustomers) {
      const { rows: existing } = await sql.query(`
        SELECT id FROM user_monthly_settlements 
        WHERE id_user = $1 AND id_customer = $2 AND month = $3 AND year = $4 AND active = true
      `, [userCustomer.id_user, userCustomer.id_customer, previousMonth, previousYear]);

      if (existing.length > 0) {
        console.log(`[Cron] Settlement already exists for user ${userCustomer.id_user}, customer ${userCustomer.id_customer}, ${previousMonth}/${previousYear}`);
        continue;
      }

      const { rows: isoConfig } = await sql.query(`
        SELECT margin_executivo, margin_core, margin_outbank
        FROM iso_margin_config
        WHERE id_customer = $1 AND active = true
        ORDER BY created_at DESC
        LIMIT 1
      `, [userCustomer.id_customer]);

      let commissionPercent = 0;
      if (isoConfig.length > 0) {
        const config = isoConfig[0];
        if (userCustomer.commission_type === 'Executivo') {
          commissionPercent = parseFloat(config.margin_executivo) || 0;
        } else if (userCustomer.commission_type === 'Core') {
          commissionPercent = parseFloat(config.margin_core) || 0;
        }
      }

      const { rows: isoMdrLinks } = await sql.query(`
        SELECT slug FROM iso_mdr_links WHERE id_customer = $1 AND active = true
      `, [userCustomer.id_customer]);

      if (isoMdrLinks.length === 0) {
        continue;
      }

      const { rows: transactionData } = await sql.query(`
        SELECT 
          COUNT(*) as total_transactions,
          COALESCE(SUM(bruto), 0) as total_amount
        FROM transactions
        WHERE iso IN (SELECT slug FROM iso_mdr_links WHERE id_customer = $1 AND active = true)
          AND transaction_date >= $2
          AND transaction_date <= $3
          AND status = 'APROVADA'
      `, [userCustomer.id_customer, startDate.toISOString(), endDate.toISOString()]);

      const totalTransactions = parseInt(transactionData[0]?.total_transactions) || 0;
      const totalAmount = parseFloat(transactionData[0]?.total_amount) || 0;
      let commissionValue = (totalAmount * commissionPercent) / 100;

      const { rows: accumulatedSettlements } = await sql.query(`
        SELECT SUM(commission_value) as accumulated_amount
        FROM user_monthly_settlements
        WHERE id_user = $1 AND id_customer = $2 AND status = 'accumulated' AND active = true
      `, [userCustomer.id_user, userCustomer.id_customer]);

      const accumulatedAmount = parseFloat(accumulatedSettlements[0]?.accumulated_amount) || 0;
      commissionValue += accumulatedAmount;

      if (accumulatedAmount > 0) {
        await sql.query(`
          UPDATE user_monthly_settlements 
          SET status = 'carried_forward', updated_at = NOW()
          WHERE id_user = $1 AND id_customer = $2 AND status = 'accumulated' AND active = true
        `, [userCustomer.id_user, userCustomer.id_customer]);
        console.log(`[Cron] Carried forward R$${accumulatedAmount.toFixed(2)} from accumulated settlements for user ${userCustomer.user_name}`);
      }

      const invoiceDeadline = new Date(year, month - 1, INVOICE_DEADLINE_DAY);
      const paymentDeadline = new Date(year, month - 1, 15);

      let status = 'pending_invoice';
      if (commissionValue < MINIMUM_REPASSE_VALUE) {
        status = 'accumulated';
      }

      await sql.query(`
        INSERT INTO user_monthly_settlements (
          id_user, id_customer, month, year, 
          total_transactions, total_amount, 
          commission_percent, commission_value,
          status, invoice_deadline, payment_deadline,
          active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW(), NOW())
      `, [
        userCustomer.id_user,
        userCustomer.id_customer,
        previousMonth,
        previousYear,
        totalTransactions,
        totalAmount,
        commissionPercent,
        commissionValue,
        status,
        invoiceDeadline.toISOString(),
        paymentDeadline.toISOString(),
      ]);

      consolidatedCount++;
      console.log(`[Cron] Created settlement for user ${userCustomer.user_name}, ISO ${userCustomer.customer_name}: R$${commissionValue.toFixed(2)} (${status})`);
    }

    return { count: consolidatedCount };
  } catch (error: any) {
    console.error('[Cron] Error consolidating settlements:', error);
    return { count: 0, error: error.message };
  }
}

async function processAccumulation(month: number, year: number): Promise<{ count: number; error?: string }> {
  try {
    let previousMonth = month - 1;
    let previousYear = year;
    if (previousMonth === 0) {
      previousMonth = 12;
      previousYear = year - 1;
    }

    console.log(`[Cron] Processing accumulation for settlements from ${previousMonth}/${previousYear}`);

    const { rows: pendingSettlements } = await sql.query(`
      SELECT ums.id, ums.id_user, ums.id_customer, ums.commission_value,
             u.name as user_name, c.name as customer_name
      FROM user_monthly_settlements ums
      JOIN users u ON ums.id_user = u.id
      JOIN customers c ON ums.id_customer = c.id
      LEFT JOIN settlement_invoices si ON ums.id = si.id_settlement AND si.active = true
      WHERE ums.month = $1 
        AND ums.year = $2 
        AND ums.status = 'pending_invoice'
        AND ums.active = true
        AND si.id IS NULL
    `, [previousMonth, previousYear]);

    let accumulatedCount = 0;

    for (const settlement of pendingSettlements) {
      await sql.query(`
        UPDATE user_monthly_settlements 
        SET status = 'accumulated', updated_at = NOW()
        WHERE id = $1
      `, [settlement.id]);

      accumulatedCount++;
      console.log(`[Cron] Marked settlement ${settlement.id} as accumulated for user ${settlement.user_name} (R$${parseFloat(settlement.commission_value).toFixed(2)} will be carried forward in next consolidation)`);
    }

    return { count: accumulatedCount };
  } catch (error: any) {
    console.error('[Cron] Error processing accumulation:', error);
    return { count: 0, error: error.message };
  }
}
