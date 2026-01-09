import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export interface PortalSettings {
  id: number;
  login_image_url: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  login_button_color: string | null;
  login_button_text_color: string | null;
  login_title_color: string | null;
  login_text_color: string | null;
}

export async function getPortalSettings(): Promise<PortalSettings | null> {
  try {
    const result = await sql`SELECT * FROM portal_settings LIMIT 1`;
    return result[0] as PortalSettings || null;
  } catch (error) {
    console.error('[getPortalSettings] Error:', error);
    return null;
  }
}

export function hslToHex(hsl: string | null | undefined): string {
  if (!hsl) return "#3b82f6";
  if (hsl.startsWith('#')) return hsl;
  
  try {
    const parts = hsl.trim().split(/\s+/);
    if (parts.length !== 3) return "#3b82f6";
    const h = parseFloat(parts[0]) / 360;
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;
    
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h * 12) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  } catch {
    return "#3b82f6";
  }
}
