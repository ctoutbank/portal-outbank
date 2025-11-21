import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getPendingConsentNotifications } from "@/features/consent/server/module-notifications";
import { db } from "@/lib/db";
import { users } from "@/lib/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ count: 0 }, { status: 401 });
    }

    const userEmail = user.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      return NextResponse.json({ count: 0 }, { status: 401 });
    }

    // Buscar user_id no banco
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    const userId = userRecord[0]?.id;

    if (!userId) {
      return NextResponse.json({ count: 0 });
    }

    // Buscar notificações pendentes
    const notifications = await getPendingConsentNotifications(userId);

    return NextResponse.json({ count: notifications.length });
  } catch (error) {
    console.error("Erro ao buscar notificações pendentes:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}

