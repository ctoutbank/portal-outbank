import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

const SIMULATED_USER_COOKIE = "dev_simulated_user_id";

async function verifyIsSuperAdmin(): Promise<boolean> {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return false;

    const user = await db
      .select({ userType: users.userType })
      .from(users)
      .where(eq(users.id, sessionUser.id))
      .limit(1);

    if (!user || user.length === 0) return false;
    return user[0].userType === "SUPER_ADMIN";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const isSuperAdmin = await verifyIsSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    const cookieStore = await cookies();

    if (userId === null || userId === undefined) {
      cookieStore.delete(SIMULATED_USER_COOKIE);
      return NextResponse.json({ success: true, message: "Simulation cleared" });
    }

    cookieStore.set(SIMULATED_USER_COOKIE, String(userId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    console.error("[DEV View As] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to set simulation" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const isSuperAdmin = await verifyIsSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ isSimulating: false, userId: null });
    }

    const cookieStore = await cookies();
    const simulatedUserId = cookieStore.get(SIMULATED_USER_COOKIE)?.value;

    return NextResponse.json({
      isSimulating: !!simulatedUserId,
      userId: simulatedUserId ? parseInt(simulatedUserId, 10) : null,
    });
  } catch (error) {
    console.error("[DEV View As] Error:", error);
    return NextResponse.json({ isSimulating: false, userId: null });
  }
}

export async function DELETE() {
  try {
    const isSuperAdmin = await verifyIsSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const cookieStore = await cookies();
    cookieStore.delete(SIMULATED_USER_COOKIE);
    return NextResponse.json({ success: true, message: "Simulation cleared" });
  } catch (error) {
    console.error("[DEV View As] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to clear simulation" }, { status: 500 });
  }
}
