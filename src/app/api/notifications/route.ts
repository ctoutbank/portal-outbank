import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getIsoNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '@/lib/db/mdr-versioning';

export const dynamic = 'force-dynamic';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const customerId = user.idCustomer;
    if (!customerId) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const [notifications, unreadCount] = await Promise.all([
      getIsoNotifications(customerId),
      getUnreadNotificationCount(customerId)
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAllRead } = body;

    const customerId = user.idCustomer;
    if (!customerId) {
      return NextResponse.json({ error: 'Usuário sem ISO vinculado' }, { status: 400 });
    }

    if (markAllRead) {
      await markAllNotificationsAsRead(customerId);
    } else if (notificationId) {
      await markNotificationAsRead(notificationId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar notificação:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
