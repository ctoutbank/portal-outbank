import { NextRequest, NextResponse } from 'next/server';
import { getUserRepasseData } from '@/lib/db/repasse';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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

    const { searchParams } = new URL(request.url);
    
    const filters = {
      year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
      customerId: searchParams.get('customerId') ? Number(searchParams.get('customerId')) : undefined,
    };

    const data = await getUserRepasseData(userId, filters);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching repasse data:', error);
    return NextResponse.json({ error: 'Failed to fetch repasse data' }, { status: 500 });
  }
}
