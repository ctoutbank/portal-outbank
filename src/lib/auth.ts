import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const DEV_BYPASS_ENABLED =
  process.env.NODE_ENV === "development" &&
  process.env.DEV_BYPASS_AUTH === "true" &&
  !process.env.VERCEL;

const DEV_FALLBACK_SECRET = 'dev-only-secret-do-not-use-in-production-32bytes';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.CLERK_SECRET_KEY; // Fallback para usar a chave do Clerk que já existe no ambiente

  if (!secret) {
    if (DEV_BYPASS_ENABLED) {
      return new TextEncoder().encode(DEV_FALLBACK_SECRET);
    }
    throw new Error('Nenhuma chave secreta encontrada (JWT_SECRET, AUTH_SECRET, etc).');
  }
  return new TextEncoder().encode(secret);
}

export const SESSION_DURATION = 60 * 60;
export const REMEMBER_ME_DURATION = 24 * 60 * 60;

export function getSessionCookieConfig(rememberMe: boolean = false, isHttps: boolean = false) {
  const duration = rememberMe ? REMEMBER_ME_DURATION : SESSION_DURATION;
  const isSecure = process.env.NODE_ENV === 'production' || !!process.env.VERCEL || isHttps;

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax' as const,
    maxAge: duration,
    path: '/',
  };
}

export interface SessionUser {
  id: number;
  email: string;
  userType: string | null;
  idCustomer: number | null;
  idProfile: number | null;
  fullAccess: boolean | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createToken(user: SessionUser, expiresIn: number = SESSION_DURATION): Promise<string> {
  const secret = getJwtSecret();
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    userType: user.userType,
    idCustomer: user.idCustomer,
    idProfile: user.idProfile,
    fullAccess: user.fullAccess,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .setIssuedAt()
    .sign(secret);

  return token;
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);

    return {
      id: payload.userId as number,
      email: payload.email as string,
      userType: payload.userType as string | null,
      idCustomer: payload.idCustomer as number | null,
      idProfile: payload.idProfile as number | null,
      fullAccess: payload.fullAccess as boolean | null,
    };
  } catch {
    return null;
  }
}

export async function createSession(user: SessionUser, rememberMe: boolean = false, isHttps: boolean = false): Promise<void> {
  const duration = rememberMe ? REMEMBER_ME_DURATION : SESSION_DURATION;
  const token = await createToken(user, duration);
  const cookieStore = await cookies();

  const isSecure = process.env.NODE_ENV === 'production' || !!process.env.VERCEL || isHttps;

  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: duration,
    path: '/',
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}

export async function auth(): Promise<{ userId: number | null }> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return { userId: null };
  }

  const user = await verifyToken(token);
  return { userId: user?.id || null };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export async function getUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0] || null;
}
