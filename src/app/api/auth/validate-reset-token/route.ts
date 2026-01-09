import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false });
    }

    const tokenResult = await db.execute(sql`
      SELECT expires_at, used
      FROM password_reset_tokens
      WHERE token = ${token}
    `);

    if (tokenResult.rows.length === 0) {
      return NextResponse.json({ valid: false });
    }

    const tokenData = tokenResult.rows[0];

    if (tokenData.used) {
      return NextResponse.json({ valid: false });
    }

    const expiresAt = new Date(String(tokenData.expires_at));
    if (expiresAt < new Date()) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('[API /auth/validate-reset-token] Error:', error);
    return NextResponse.json({ valid: false });
  }
}
