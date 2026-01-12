import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const result = await sql`SELECT * FROM portal_settings LIMIT 1`;
    
    const settings = result[0] || null;
    
    return NextResponse.json({ settings }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching portal settings:', error);
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.userType !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      loginImageUrl,
      logoUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      loginButtonColor,
      loginButtonTextColor,
      loginTitleColor,
      loginTextColor
    } = body;

    const existing = await sql`SELECT id FROM portal_settings LIMIT 1`;

    if (existing.length > 0) {
      await sql`
        UPDATE portal_settings SET
          login_image_url = ${loginImageUrl || null},
          logo_url = ${logoUrl || null},
          favicon_url = ${faviconUrl || null},
          primary_color = ${primaryColor || null},
          secondary_color = ${secondaryColor || null},
          login_button_color = ${loginButtonColor || null},
          login_button_text_color = ${loginButtonTextColor || null},
          login_title_color = ${loginTitleColor || null},
          login_text_color = ${loginTextColor || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existing[0].id}
      `;
    } else {
      await sql`
        INSERT INTO portal_settings (
          login_image_url,
          logo_url,
          favicon_url,
          primary_color,
          secondary_color,
          login_button_color,
          login_button_text_color,
          login_title_color,
          login_text_color
        ) VALUES (
          ${loginImageUrl || null},
          ${logoUrl || null},
          ${faviconUrl || null},
          ${primaryColor || null},
          ${secondaryColor || null},
          ${loginButtonColor || null},
          ${loginButtonTextColor || null},
          ${loginTitleColor || null},
          ${loginTextColor || null}
        )
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving portal settings:', error);
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}
