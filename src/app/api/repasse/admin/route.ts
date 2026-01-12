import { NextRequest, NextResponse } from 'next/server';
import { getAllSettlementsForAdmin, markSettlementAsPaid } from '@/lib/db/repasse';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { sql } from '@vercel/postgres';

async function isAdminUser(userId: number): Promise<boolean> {
  const { rows } = await sql.query(`
    SELECT user_type FROM users WHERE id = $1
  `, [userId]);
  return rows[0]?.user_type === 'SUPER_ADMIN' || rows[0]?.user_type === 'ISO_PORTAL_ADMIN';
}

export async function GET(request: NextRequest) {
  try {
    let userId: number;

    if (process.env.DEV_BYPASS_AUTH === 'true') {
      userId = 1;
    } else {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth_token')?.value;
      
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const payload = await verifyToken(token);
      if (!payload || !payload.id) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      userId = payload.id;
    }

    const isAdmin = await isAdminUser(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    const filters = {
      status: searchParams.get('status') || undefined,
      month: searchParams.get('month') ? Number(searchParams.get('month')) : undefined,
      year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
      userId: searchParams.get('userId') ? Number(searchParams.get('userId')) : undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : 20,
      requestingUserId: userId, // Para filtrar dados do SuperAdmin
    };

    const data = await getAllSettlementsForAdmin(filters);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching admin repasse data:', error);
    return NextResponse.json({ error: 'Failed to fetch repasse data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let userId: number;

    if (process.env.DEV_BYPASS_AUTH === 'true') {
      userId = 1;
    } else {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth_token')?.value;
      
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const payload = await verifyToken(token);
      if (!payload || !payload.id) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      userId = payload.id;
    }

    const isAdmin = await isAdminUser(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, settlementId } = body;

    if (action === 'markAsPaid' || action === 'mark_paid') {
      if (!settlementId) {
        return NextResponse.json({ error: 'settlementId is required' }, { status: 400 });
      }

      const result = await markSettlementAsPaid(Number(settlementId), userId);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'Settlement marked as paid' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing admin action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
