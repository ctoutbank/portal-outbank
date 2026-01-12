import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const vars = {
        DATABASE_URL: !!process.env.DATABASE_URL,
        POSTGRES_URL: !!process.env.POSTGRES_URL,
        NEON_DATABASE_URL: !!process.env.NEON_DATABASE_URL,
        JWT_SECRET: !!process.env.JWT_SECRET,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
    };
    return NextResponse.json(vars);
}
