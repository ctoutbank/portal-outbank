import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token e senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    const tokenResult = await db.execute(sql`
      SELECT user_id, expires_at, used
      FROM password_reset_tokens
      WHERE token = ${token}
    `);

    if (tokenResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 400 }
      );
    }

    const tokenData = tokenResult.rows[0];
    
    if (tokenData.used) {
      return NextResponse.json(
        { success: false, error: 'Este link já foi utilizado' },
        { status: 400 }
      );
    }

    const expiresAt = new Date(String(tokenData.expires_at));
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Este link expirou' },
        { status: 400 }
      );
    }

    const userId = Number(tokenData.user_id);
    const hashedPassword = await hashPassword(password);

    await db.execute(sql`
      UPDATE users
      SET hashed_password = ${hashedPassword}, initial_password = NULL, dtupdate = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `);

    await db.execute(sql`
      UPDATE password_reset_tokens
      SET used = true
      WHERE token = ${token}
    `);

    console.log(`[reset-password] Senha redefinida para user_id=${userId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API /auth/reset-password] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
