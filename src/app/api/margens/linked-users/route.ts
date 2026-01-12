import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, userCustomers, profiles } from '../../../../../drizzle/schema';
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

    const result = await db
      .select({
        id: userCustomers.id,
        userId: userCustomers.idUser,
        userEmail: users.email,
        categoryType: profiles.categoryType,
        categoryName: profiles.name,
      })
      .from(userCustomers)
      .innerJoin(users, eq(userCustomers.idUser, users.id))
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(
        and(
          eq(userCustomers.idCustomer, sql`${parseInt(customerId)}`),
          eq(userCustomers.active, true)
        )
      );

    const linkedUsers = result.map(row => ({
      id: row.id,
      userId: row.userId,
      userName: row.userEmail?.split('@')[0] || 'Usuário',
      userEmail: row.userEmail || '',
      categoryType: row.categoryType || 'OUTRO',
      categoryName: row.categoryName || '',
      inheritedPercent: 0
    }));

    return NextResponse.json(linkedUsers);
  } catch (error: any) {
    console.error('Error fetching linked users:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userInfo = await getCurrentUserInfo();
    if (!userInfo || !await isSuperAdmin()) {
      return NextResponse.json({ error: 'Apenas Super Admin pode vincular usuários' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, customerId, commissionType } = body;

    if (!userId || !customerId) {
      return NextResponse.json({ error: 'userId e customerId são obrigatórios' }, { status: 400 });
    }

    // Se commissionType não foi passado, buscar do perfil do usuário
    let finalCommissionType = commissionType;
    if (!finalCommissionType) {
      const userWithProfile = await db
        .select({ categoryType: profiles.categoryType })
        .from(users)
        .leftJoin(profiles, eq(users.idProfile, profiles.id))
        .where(eq(users.id, sql`${userId}`))
        .limit(1);
      
      if (userWithProfile[0]?.categoryType) {
        finalCommissionType = userWithProfile[0].categoryType;
      }
    }

    // Validar que é EXECUTIVO ou CORE
    if (finalCommissionType && !['EXECUTIVO', 'CORE'].includes(finalCommissionType)) {
      return NextResponse.json({ error: 'Apenas usuários Executivo ou Core podem ser vinculados' }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(userCustomers)
      .where(
        and(
          eq(userCustomers.idUser, sql`${userId}`),
          eq(userCustomers.idCustomer, sql`${customerId}`)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].active) {
        return NextResponse.json({ error: 'Usuário já vinculado a este ISO' }, { status: 400 });
      }
      await db
        .update(userCustomers)
        .set({ 
          active: true, 
          commissionType: finalCommissionType || null,
          dtupdate: new Date().toISOString() 
        })
        .where(eq(userCustomers.id, existing[0].id));
    } else {
      await db.insert(userCustomers).values({
        idUser: sql`${userId}`,
        idCustomer: sql`${customerId}`,
        commissionType: finalCommissionType || null,
        active: true,
        isPrimary: false,
        dtinsert: new Date().toISOString(),
        dtupdate: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error linking user:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userInfo = await getCurrentUserInfo();
    if (!userInfo || !await isSuperAdmin()) {
      return NextResponse.json({ error: 'Apenas Super Admin pode desvincular usuários' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const customerId = searchParams.get('customerId');

    if (!userId || !customerId) {
      return NextResponse.json({ error: 'userId e customerId são obrigatórios' }, { status: 400 });
    }

    await db
      .update(userCustomers)
      .set({ active: false, dtupdate: new Date().toISOString() })
      .where(
        and(
          eq(userCustomers.idUser, sql`${parseInt(userId)}`),
          eq(userCustomers.idCustomer, sql`${parseInt(customerId)}`)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error unlinking user:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
