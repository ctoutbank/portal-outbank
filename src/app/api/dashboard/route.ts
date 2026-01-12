import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { getInheritedCommissions } from '@/lib/db/inherited-commissions';

export const dynamic = 'force-dynamic';

async function getUserTypeById(userId: number): Promise<string | null> {
  const { rows } = await sql.query(`SELECT user_type FROM users WHERE id = $1`, [userId]);
  return rows[0]?.user_type || null;
}

export async function GET(request: NextRequest) {
  try {
    let authenticatedUserId: number;
    let authenticatedUserType: string | null = null;

    if (process.env.DEV_BYPASS_AUTH === 'true') {
      authenticatedUserId = 1;
      authenticatedUserType = 'SUPER_ADMIN';
    } else {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth_token')?.value;
      
      if (!token) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
      }

      const payload = await verifyToken(token);
      if (!payload || !payload.id) {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
      }
      authenticatedUserId = payload.id;
      authenticatedUserType = await getUserTypeById(authenticatedUserId);
    }

    const { searchParams } = new URL(request.url);
    const simulatedUserIdParam = searchParams.get('simulatedUserId');
    
    let targetUserId = authenticatedUserId;
    
    if (simulatedUserIdParam) {
      if (authenticatedUserType !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Apenas Super Admin pode simular usuários' }, { status: 403 });
      }
      
      const simId = parseInt(simulatedUserIdParam, 10);
      if (isNaN(simId)) {
        return NextResponse.json({ error: 'ID de usuário inválido' }, { status: 400 });
      }
      
      const { rows: userCheck } = await sql.query(`SELECT id, active FROM users WHERE id = $1`, [simId]);
      if (userCheck.length === 0) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      if (!userCheck[0].active) {
        return NextResponse.json({ error: 'Usuário inativo' }, { status: 400 });
      }
      
      targetUserId = simId;
    }

    let commissions = await getInheritedCommissions(targetUserId);
    console.log('[Dashboard API] Target user:', targetUserId, 'Commissions count:', commissions.length);
    
    if (commissions.length === 0) {
      const { rows: userInfo } = await sql.query(`
        SELECT u.user_type FROM users u WHERE u.id = $1
      `, [targetUserId]);
      
      console.log('[Dashboard API] User type:', userInfo[0]?.user_type);
      
      if (userInfo[0]?.user_type === 'SUPER_ADMIN') {
        const { rows: allCustomers } = await sql.query(`
          SELECT c.id, c.name, imc.margin_outbank
          FROM customers c
          LEFT JOIN iso_margin_config imc ON c.id = imc.customer_id
          WHERE c.is_active = true
        `);
        
        console.log('[Dashboard API] Fallback for Super Admin - customers:', allCustomers.length);
        
        commissions = allCustomers.map(c => ({
          customerId: Number(c.id),
          customerName: c.name || 'N/A',
          categoryType: 'OUTBANK',
          commissionPercent: parseFloat(c.margin_outbank || '0')
        }));
      }
    }
    
    if (commissions.length === 0) {
      return NextResponse.json({
        totalEstabelecimentos: 0,
        totalTransacoes: 0,
        totalBruto: 0,
        totalLucro: 0,
        topMerchants: [],
        isoBreakdown: [],
        lastUpdate: new Date()
      });
    }
    
    const customerIds = commissions.map(c => c.customerId);
    
    const marginByCustomer = new Map<number, number>();
    commissions.forEach(c => {
      marginByCustomer.set(c.customerId, c.commissionPercent);
    });
    
    const { rows: customerSlugsData } = await sql.query(`
      SELECT id, slug FROM customers WHERE id = ANY($1::int[])
    `, [customerIds]);
    
    const customerSlugs = customerSlugsData.map(c => c.slug).filter(Boolean);
    const slugToCustomerId = new Map<string, number>();
    customerSlugsData.forEach(c => {
      if (c.slug) slugToCustomerId.set(c.slug, Number(c.id));
    });
    
    if (customerSlugs.length === 0) {
      return NextResponse.json({
        totalEstabelecimentos: 0,
        totalTransacoes: 0,
        totalBruto: 0,
        totalLucro: 0,
        topMerchants: [],
        isoBreakdown: [],
        lastUpdate: new Date()
      });
    }
    
    const { rows: merchantsCount } = await sql.query(`
      SELECT COUNT(*) as count
      FROM merchants
      WHERE slug_customer = ANY($1::text[])
    `, [customerSlugs]);
    
    const { rows: merchantsByIsoData } = await sql.query(`
      SELECT slug_customer, COUNT(*) as count
      FROM merchants
      WHERE slug_customer = ANY($1::text[])
      GROUP BY slug_customer
    `, [customerSlugs]);
    
    const merchantsBySlug = new Map<string, number>();
    merchantsByIsoData.forEach(row => {
      merchantsBySlug.set(row.slug_customer, parseInt(row.count, 10));
    });
    
    const { rows: transactionStats } = await sql.query(`
      SELECT 
        COUNT(*) as total_count,
        COALESCE(SUM(total_amount), 0) as total_volume,
        slug_customer
      FROM transactions
      WHERE slug_customer = ANY($1::text[])
      GROUP BY slug_customer
    `, [customerSlugs]);
    
    let totalTransacoes = 0;
    let totalBruto = 0;
    let totalLucro = 0;
    
    const customerIdToSlug = new Map<number, string>();
    customerSlugsData.forEach(c => {
      if (c.slug) customerIdToSlug.set(Number(c.id), c.slug);
    });
    
    const customerIdToName = new Map<number, string>();
    commissions.forEach(c => {
      customerIdToName.set(c.customerId, c.customerName);
    });
    
    interface IsoStats {
      customerId: number;
      customerName: string;
      transactionCount: number;
      volume: number;
      profit: number;
      marginPercent: number;
      merchantCount: number;
    }
    
    const statsByIso = new Map<number, IsoStats>();
    
    for (const stat of transactionStats) {
      const count = parseInt(stat.total_count, 10);
      const volume = parseFloat(stat.total_volume);
      totalTransacoes += count;
      totalBruto += volume;
      
      const customerId = slugToCustomerId.get(stat.slug_customer);
      const marginPercent = customerId ? (marginByCustomer.get(customerId) || 0) : 0;
      const profit = volume * (marginPercent / 100);
      
      totalLucro += profit;
      
      if (customerId) {
        const slug = customerIdToSlug.get(customerId);
        const merchantCount = slug ? (merchantsBySlug.get(slug) || 0) : 0;
        statsByIso.set(customerId, {
          customerId,
          customerName: customerIdToName.get(customerId) || 'N/A',
          transactionCount: count,
          volume,
          profit,
          marginPercent,
          merchantCount
        });
      }
    }
    
    for (const commission of commissions) {
      if (!statsByIso.has(commission.customerId)) {
        const slug = customerIdToSlug.get(commission.customerId);
        const merchantCount = slug ? (merchantsBySlug.get(slug) || 0) : 0;
        statsByIso.set(commission.customerId, {
          customerId: commission.customerId,
          customerName: commission.customerName,
          transactionCount: 0,
          volume: 0,
          profit: 0,
          marginPercent: commission.commissionPercent,
          merchantCount
        });
      }
    }
    
    const isoBreakdown = Array.from(statsByIso.values()).sort((a, b) => b.volume - a.volume);
    
    const { rows: topMerchants } = await sql.query(`
      SELECT 
        m.id,
        m.name,
        m.corporate_name,
        m.slug,
        m.slug_customer,
        COALESCE(SUM(t.total_amount), 0) as bruto
      FROM merchants m
      LEFT JOIN transactions t ON t.slug_merchant::text = m.slug
      WHERE m.slug_customer = ANY($1::text[])
      GROUP BY m.id, m.name, m.corporate_name, m.slug, m.slug_customer
      HAVING COALESCE(SUM(t.total_amount), 0) > 10
      ORDER BY bruto DESC
      LIMIT 5
    `, [customerSlugs]);
    
    const topMerchantsWithProfit = topMerchants.map((merchant) => {
      const bruto = parseFloat(merchant.bruto);
      const customerId = slugToCustomerId.get(merchant.slug_customer);
      const marginPercent = customerId ? (marginByCustomer.get(customerId) || 0) : 0;
      const lucro = bruto * (marginPercent / 100);
      const customerName = customerId ? customerIdToName.get(customerId) : null;
      
      return {
        id: merchant.id,
        name: merchant.name || merchant.corporate_name || `Merchant ${merchant.id}`,
        bruto,
        lucro,
        crescimento: 0,
        customerId: customerId || null,
        customerName: customerName || null
      };
    });
    
    return NextResponse.json({
      totalEstabelecimentos: parseInt(merchantsCount[0]?.count || '0', 10),
      totalTransacoes,
      totalBruto,
      totalLucro,
      topMerchants: topMerchantsWithProfit,
      isoBreakdown,
      lastUpdate: new Date()
    });
    
  } catch (error) {
    console.error('[Dashboard API] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
