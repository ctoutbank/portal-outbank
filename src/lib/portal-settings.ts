import { neon } from '@neondatabase/serverless';
import { unstable_cache } from 'next/cache';

const getSql = () => {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
  if (!url) {
    console.error('❌ FATAL: Database URL is missing. Checked: DATABASE_URL, POSTGRES_URL, NEON_DATABASE_URL');
    throw new Error('DATABASE_URL not set');
  }
  return neon(url);
};

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

const getPortalSettingsCached = unstable_cache(
  async (): Promise<PortalSettings | null> => {
    try {
      const sql = getSql();
      const result = await sql`SELECT * FROM portal_settings LIMIT 1`;
      return result[0] as PortalSettings || null;
    } catch (error) {
      console.error('[getPortalSettings] Error:', error);
      return null;
    }
  },
  ['get-portal-settings'],
  { revalidate: 3600, tags: ['settings'] }
);

export const getPortalSettings = getPortalSettingsCached;

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
