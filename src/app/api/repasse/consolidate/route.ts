import { NextRequest, NextResponse } from 'next/server';
import { consolidateMonthlySettlements } from '@/lib/db/repasse';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

async function isAdminUser(userId: number): Promise<boolean> {
  const { rows } = await sql.query(`
    SELECT user_type FROM users WHERE id = $1
  `, [userId]);
  return rows[0]?.user_type === 'SUPER_ADMIN' || rows[0]?.user_type === 'ISO_PORTAL_ADMIN';
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

    const body = await request.json().catch(() => ({}));
    const { month, year } = body;

    const result = await consolidateMonthlySettlements(month, year);

    return NextResponse.json({
      success: true,
      message: `Consolidation completed. Created: ${result.created}, Updated: ${result.updated}`,
      ...result,
    });
  } catch (error) {
    console.error('Error consolidating settlements:', error);
    return NextResponse.json({ error: 'Failed to consolidate settlements' }, { status: 500 });
  }
}
