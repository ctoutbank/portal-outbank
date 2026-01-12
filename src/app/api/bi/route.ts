import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

async function getUserCustomerAccess(userId: number): Promise<{ isSuperAdmin: boolean; customerIds: number[]; customerSlugs: string[] }> {
  const { rows: userInfo } = await sql.query(`SELECT user_type FROM users WHERE id = $1`, [userId]);
  const isSuperAdmin = userInfo[0]?.user_type === 'SUPER_ADMIN';
  
  if (isSuperAdmin) {
    const { rows: allCustomers } = await sql.query(`SELECT id, slug FROM customers WHERE is_active = true`);
    return {
      isSuperAdmin: true,
      customerIds: allCustomers.map(c => Number(c.id)),
      customerSlugs: allCustomers.map(c => c.slug).filter(Boolean)
    };
  }
  
  const { rows: userCustomers } = await sql.query(`
    SELECT c.id, c.slug FROM user_customers uc
    JOIN customers c ON uc.id_customer = c.id
    WHERE uc.id_user = $1 AND c.is_active = true
  `, [userId]);
  
  return {
    isSuperAdmin: false,
    customerIds: userCustomers.map(c => Number(c.id)),
    customerSlugs: userCustomers.map(c => c.slug).filter(Boolean)
  };
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom') || '2024-01-01';
    const dateTo = searchParams.get('dateTo') || new Date().toISOString().split('T')[0];
    const customerFilter = searchParams.get('customer');
    const merchantFilter = searchParams.get('merchant');
    const brandFilter = searchParams.get('brand');
    const productTypeFilter = searchParams.get('productType');
    const salesChannelFilter = searchParams.get('salesChannel');
    const statusFilter = searchParams.get('status');

    const access = await getUserCustomerAccess(payload.id);
    
    if (access.customerSlugs.length === 0) {
      return NextResponse.json({ error: 'Sem acesso a ISOs' }, { status: 403 });
    }

    let customerSlugs = access.customerSlugs;
    if (customerFilter) {
      const filterSlugs = customerFilter.split(',');
      customerSlugs = customerSlugs.filter(s => filterSlugs.includes(s));
    }

    const buildWhereClause = (tableAlias: string = '') => {
      const prefix = tableAlias ? `${tableAlias}.` : '';
      let conditions = [`${prefix}slug_customer = ANY($1::text[])`];
      let params: any[] = [customerSlugs];
      let paramIndex = 2;

      conditions.push(`${prefix}dt_insert >= $${paramIndex}::timestamp`);
      params.push(dateFrom);
      paramIndex++;

      conditions.push(`${prefix}dt_insert <= $${paramIndex}::timestamp`);
      params.push(dateTo + ' 23:59:59');
      paramIndex++;

      if (brandFilter) {
        conditions.push(`${prefix}brand = ANY($${paramIndex}::text[])`);
        params.push(brandFilter.split(','));
        paramIndex++;
      }

      if (productTypeFilter) {
        conditions.push(`${prefix}product_type = ANY($${paramIndex}::text[])`);
        params.push(productTypeFilter.split(','));
        paramIndex++;
      }

      if (salesChannelFilter) {
        conditions.push(`${prefix}sales_channel = ANY($${paramIndex}::text[])`);
        params.push(salesChannelFilter.split(','));
        paramIndex++;
      }

      if (statusFilter) {
        conditions.push(`${prefix}transaction_status = ANY($${paramIndex}::text[])`);
        params.push(statusFilter.split(','));
        paramIndex++;
      }

      if (merchantFilter) {
        conditions.push(`${prefix}slug_merchant = ANY($${paramIndex}::text[])`);
        params.push(merchantFilter.split(','));
        paramIndex++;
      }

      return { where: conditions.join(' AND '), params };
    };

    const { where, params } = buildWhereClause();

    const [
      executiveMetrics,
      dailyTpv,
      productMix,
      brandAnalysis,
      hourlyHeatmap,
      weekdayVolume,
      shiftVolume,
      statusDistribution,
      topMerchants,
      settlementMetrics,
      customerBreakdown,
      merchantList,
      isoMarginConfig,
      isoMdrMargins
    ] = await Promise.all([
      sql.query(`
        SELECT 
          COUNT(*) as total_transactions,
          COALESCE(SUM(total_amount), 0) as tpv,
          COALESCE(AVG(total_amount), 0) as ticket_medio,
          COUNT(CASE WHEN transaction_status = 'AUTHORIZED' THEN 1 END) as authorized,
          COUNT(CASE WHEN transaction_status = 'CANCELED' THEN 1 END) as canceled,
          COUNT(CASE WHEN transaction_status = 'DENIED' THEN 1 END) as denied
        FROM transactions WHERE ${where}
      `, params),

      sql.query(`
        SELECT 
          DATE(dt_insert) as date,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as tpv,
          COALESCE(AVG(total_amount), 0) as ticket_medio,
          COUNT(CASE WHEN transaction_status = 'AUTHORIZED' THEN 1 END) as authorized
        FROM transactions WHERE ${where}
        GROUP BY DATE(dt_insert)
        ORDER BY date
      `, params),

      sql.query(`
        SELECT 
          product_type,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as tpv
        FROM transactions WHERE ${where}
        GROUP BY product_type
        ORDER BY tpv DESC
      `, params),

      sql.query(`
        SELECT 
          brand,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as tpv,
          COUNT(CASE WHEN transaction_status = 'AUTHORIZED' THEN 1 END) as authorized,
          COUNT(*) as total
        FROM transactions WHERE ${where}
        GROUP BY brand
        ORDER BY tpv DESC
      `, params),

      sql.query(`
        SELECT 
          EXTRACT(HOUR FROM dt_insert) as hour,
          EXTRACT(DOW FROM dt_insert) as day_of_week,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as tpv
        FROM transactions WHERE ${where}
        GROUP BY EXTRACT(HOUR FROM dt_insert), EXTRACT(DOW FROM dt_insert)
        ORDER BY day_of_week, hour
      `, params),

      sql.query(`
        SELECT 
          EXTRACT(DOW FROM dt_insert) as day_of_week,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as tpv,
          COALESCE(AVG(total_amount), 0) as ticket_medio
        FROM transactions WHERE ${where}
        GROUP BY EXTRACT(DOW FROM dt_insert)
        ORDER BY day_of_week
      `, params),

      sql.query(`
        SELECT 
          CASE 
            WHEN EXTRACT(HOUR FROM dt_insert) BETWEEN 0 AND 5 THEN 'Madrugada'
            WHEN EXTRACT(HOUR FROM dt_insert) BETWEEN 6 AND 11 THEN 'Manhã'
            WHEN EXTRACT(HOUR FROM dt_insert) BETWEEN 12 AND 17 THEN 'Tarde'
            ELSE 'Noite'
          END as shift,
          CASE 
            WHEN EXTRACT(HOUR FROM dt_insert) BETWEEN 0 AND 5 THEN 1
            WHEN EXTRACT(HOUR FROM dt_insert) BETWEEN 6 AND 11 THEN 2
            WHEN EXTRACT(HOUR FROM dt_insert) BETWEEN 12 AND 17 THEN 3
            ELSE 4
          END as sort_order,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as tpv
        FROM transactions WHERE ${where}
        GROUP BY 1, 2
        ORDER BY 2
      `, params),

      sql.query(`
        SELECT 
          transaction_status as status,
          COUNT(*) as count,
          COALESCE(SUM(total_amount), 0) as tpv
        FROM transactions WHERE ${where}
        GROUP BY transaction_status
        ORDER BY count DESC
      `, params),

      sql.query(`
        SELECT 
          t.slug_merchant,
          t.merchant_name,
          t.slug_customer,
          COUNT(*) as count,
          COALESCE(SUM(t.total_amount), 0) as tpv
        FROM transactions t WHERE ${where}
        GROUP BY t.slug_merchant, t.merchant_name, t.slug_customer
        ORDER BY tpv DESC
        LIMIT 10
      `, params),

      sql.query(`
        SELECT 
          COALESCE(SUM(batch_amount), 0) as bruto,
          COALESCE(SUM(net_settlement_amount), 0) as liquido,
          COALESCE(SUM(discount_fee_amount), 0) as taxas,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count
        FROM settlements 
        WHERE slug_customer = ANY($1::text[])
          AND payment_date >= $2::date
          AND payment_date <= $3::date
      `, [customerSlugs, dateFrom, dateTo]),

      sql.query(`
        SELECT 
          c.name as customer_name,
          t.slug_customer,
          COUNT(*) as count,
          COALESCE(SUM(t.total_amount), 0) as tpv
        FROM transactions t
        JOIN customers c ON t.slug_customer = c.slug
        WHERE ${where}
        GROUP BY c.name, t.slug_customer
        ORDER BY tpv DESC
      `, params),

      sql.query(`
        SELECT DISTINCT 
          slug_merchant,
          merchant_name
        FROM transactions 
        WHERE slug_customer = ANY($1::text[])
          AND slug_merchant IS NOT NULL
          AND merchant_name IS NOT NULL
        ORDER BY merchant_name
        LIMIT 500
      `, [customerSlugs]),

      sql.query(`
        SELECT 
          c.id as customer_id,
          c.name as customer_name,
          c.slug,
          imc.margin_outbank,
          imc.margin_executivo,
          imc.margin_core
        FROM customers c
        LEFT JOIN iso_margin_config imc ON c.id = imc.customer_id
        WHERE c.slug = ANY($1::text[])
      `, [customerSlugs]),

      sql.query(`
        SELECT 
          m.bandeira,
          m.modalidade,
          m.margin_iso,
          l.customer_id,
          c.name as customer_name
        FROM iso_mdr_margins m
        JOIN iso_mdr_links l ON m.iso_mdr_link_id = l.id
        JOIN customers c ON l.customer_id = c.id
        WHERE l.is_active = true
          AND c.slug = ANY($1::text[])
        ORDER BY m.bandeira, m.modalidade
      `, [customerSlugs])
    ]);

    const metrics = executiveMetrics.rows[0];
    const totalTx = parseInt(metrics.total_transactions) || 1;

    const response = {
      executive: {
        tpv: parseFloat(metrics.tpv) || 0,
        totalTransactions: parseInt(metrics.total_transactions) || 0,
        ticketMedio: parseFloat(metrics.ticket_medio) || 0,
        taxaAprovacao: ((parseInt(metrics.authorized) || 0) / totalTx * 100).toFixed(1),
        taxaCancelamento: ((parseInt(metrics.canceled) || 0) / totalTx * 100).toFixed(1),
        taxaRecusa: ((parseInt(metrics.denied) || 0) / totalTx * 100).toFixed(1)
      },
      dailyTpv: dailyTpv.rows.map(r => ({
        date: r.date,
        count: parseInt(r.count),
        tpv: parseFloat(r.tpv),
        ticketMedio: parseFloat(r.ticket_medio),
        taxaAprovacao: (parseInt(r.authorized) / parseInt(r.count) * 100).toFixed(1)
      })),
      productMix: productMix.rows.map(r => ({
        name: r.product_type || 'N/A',
        count: parseInt(r.count),
        value: parseFloat(r.tpv)
      })),
      brandAnalysis: brandAnalysis.rows.map(r => ({
        name: r.brand || 'N/A',
        count: parseInt(r.count),
        tpv: parseFloat(r.tpv),
        taxaAprovacao: ((parseInt(r.authorized) / parseInt(r.total)) * 100).toFixed(1)
      })),
      hourlyHeatmap: hourlyHeatmap.rows.map(r => ({
        hour: parseInt(r.hour),
        dayOfWeek: parseInt(r.day_of_week),
        count: parseInt(r.count),
        tpv: parseFloat(r.tpv)
      })),
      weekdayVolume: weekdayVolume.rows.map(r => ({
        day: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][parseInt(r.day_of_week)],
        dayIndex: parseInt(r.day_of_week),
        count: parseInt(r.count),
        tpv: parseFloat(r.tpv),
        ticketMedio: parseFloat(r.ticket_medio)
      })),
      shiftVolume: shiftVolume.rows.map(r => ({
        shift: r.shift,
        count: parseInt(r.count),
        tpv: parseFloat(r.tpv)
      })),
      statusDistribution: statusDistribution.rows.map(r => ({
        status: r.status || 'N/A',
        count: parseInt(r.count),
        tpv: parseFloat(r.tpv)
      })),
      topMerchants: topMerchants.rows.map(r => ({
        slug: r.slug_merchant,
        name: r.merchant_name || 'N/A',
        customerSlug: r.slug_customer,
        count: parseInt(r.count),
        tpv: parseFloat(r.tpv)
      })),
      settlement: {
        bruto: parseFloat(settlementMetrics.rows[0]?.bruto) || 0,
        liquido: parseFloat(settlementMetrics.rows[0]?.liquido) || 0,
        taxas: parseFloat(settlementMetrics.rows[0]?.taxas) || 0,
        pendingCount: parseInt(settlementMetrics.rows[0]?.pending_count) || 0
      },
      customerBreakdown: customerBreakdown.rows.map(r => ({
        name: r.customer_name || 'N/A',
        slug: r.slug_customer,
        count: parseInt(r.count),
        tpv: parseFloat(r.tpv)
      })),
      merchantBreakdown: merchantList.rows.map(r => ({
        name: r.merchant_name || 'N/A',
        slug: r.slug_merchant
      })),
      mdrData: {
        isoMargins: isoMarginConfig.rows.map(r => ({
          customerId: r.customer_id,
          customerName: r.customer_name,
          slug: r.slug,
          marginOutbank: parseFloat(r.margin_outbank) || 0,
          marginExecutivo: parseFloat(r.margin_executivo) || 0,
          marginCore: parseFloat(r.margin_core) || 0
        })),
        brandMargins: isoMdrMargins.rows.map(r => ({
          bandeira: r.bandeira,
          modalidade: r.modalidade,
          marginIso: parseFloat(r.margin_iso) || 0,
          customerId: r.customer_id,
          customerName: r.customer_name
        })),
        avgMarginPortal: isoMarginConfig.rows.length > 0 
          ? (isoMarginConfig.rows.reduce((sum, r) => sum + (parseFloat(r.margin_outbank) || 0), 0) / isoMarginConfig.rows.length)
          : 0
      },
      filters: {
        dateFrom,
        dateTo,
        availableCustomers: access.customerSlugs
      }
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('[BI API] Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
