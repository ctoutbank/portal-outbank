import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPendingConsentNotifications } from "@/features/consent/server/module-notifications";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const sessionUser = await getCurrentUser();

    if (!sessionUser) {
      return NextResponse.json({ count: 0 }, { status: 401 });
    }

    // Buscar notificações pendentes
    const notifications = await getPendingConsentNotifications(sessionUser.id);

    return NextResponse.json({ count: notifications.length });
  } catch (error) {
    console.error("Erro ao buscar notificações pendentes:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}


