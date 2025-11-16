import { db } from "@/db/drizzle";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await db.execute(
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS initial_password TEXT;`
    );

    console.log("[Migration] Successfully added initial_password column to users table");

    const verifyResult = await db.execute(
      sql`SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name='users' AND column_name='initial_password';`
    );

    return NextResponse.json({
      success: true,
      message: "Migration executed successfully",
      verification: verifyResult.rows,
    });
  } catch (error) {
    console.error("[Migration] Error executing migration:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
