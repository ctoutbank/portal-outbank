import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, userCustomers, profiles } from '../../../../../../drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getCurrentUserInfo, isSuperAdmin } from '@/lib/permissions/check-permissions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userInfo = await getCurrentUserInfo();
    if (!userInfo || !await isSuperAdmin()) {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ error: 'customerId é obrigatório' }, { status: 400 });
    }

    const linkedUserIds = await db
      .select({ userId: userCustomers.idUser })
      .from(userCustomers)
      .where(
        and(
          eq(userCustomers.idCustomer, sql`${parseInt(customerId)}`),
          eq(userCustomers.active, true)
        )
      );

    const linkedIds = linkedUserIds
      .map(u => u.userId)
      .filter((id): id is number => id !== null);

    let whereClause: any = eq(users.active, true);

    if (linkedIds.length > 0) {
      whereClause = and(
        eq(users.active, true),
        sql`${users.id} NOT IN (${sql.join(linkedIds.map(id => sql`${id}`), sql`, `)})`
      );
    }

    const result = await db
      .select({
        id: users.id,
        email: users.email,
        categoryType: profiles.categoryType,
        categoryName: profiles.name,
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(whereClause);

    const availableUsers = result.map(row => ({
      id: row.id,
      name: row.email?.split('@')[0] || 'Usuário',
      email: row.email || '',
      categoryType: row.categoryType || 'OUTRO',
      categoryName: row.categoryName || '',
    }));

    return NextResponse.json(availableUsers);
  } catch (error: any) {
    console.error('Error fetching available users:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
