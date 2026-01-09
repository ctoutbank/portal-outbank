import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';
import { headers } from 'next/headers';
import { sendPasswordResetEmail } from '@/app/utils/send-email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    const userResult = await db.execute(sql`
      SELECT id, email FROM users WHERE email = ${email} AND active = true
    `);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: true });
    }

    const user = userResult.rows[0];
    const userId = Number(user.id);

    await db.execute(sql`
      UPDATE password_reset_tokens 
      SET used = true 
      WHERE user_id = ${userId} AND used = false
    `);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.execute(sql`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
    `);

    const headersList = await headers();
    const host = headersList.get('host') || '';
    const subdomain = host.split('.')[0];

    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const resetUrl = `${protocol}://${host}/reset-password/${token}`;

    await sendPasswordResetEmail(String(user.email), resetUrl, subdomain);

    console.log(`[forgot-password] Email de recuperação enviado para ${email}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API /auth/forgot-password] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
