import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const allVars: Record<string, string> = {};
    const keys = Object.keys(process.env).sort();

    keys.forEach(key => {
        const value = process.env[key];
        if (!value) {
            allVars[key] = "undefined/empty";
        } else if (key.includes("KEY") || key.includes("SECRET") || key.includes("PASSWORD") || key.includes("TOKEN") || key.includes("URL")) {
            allVars[key] = `[PRESENT] length: ${value.length}`;
        } else {
            allVars[key] = String(value).substring(0, 20) + (String(value).length > 20 ? "..." : "");
        }
    });

    return NextResponse.json({
        config_check: {
            HAS_DATABASE_URL: !!process.env.DATABASE_URL,
            HAS_POSTGRES_URL: !!process.env.POSTGRES_URL,
            HAS_JWT_SECRET: !!process.env.JWT_SECRET,
            HAS_AUTH_SECRET: !!process.env.AUTH_SECRET,
            HAS_NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        },
        all_environment_keys: allVars
    });
}
