import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword, createToken, SESSION_DURATION, REMEMBER_ME_DURATION } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const timings: Record<string, number> = {};

  try {
    const { email, password, rememberMe } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // 1. Buscar usuário no banco
    const dbStart = performance.now();
    const user = await getUserByEmail(email);
    timings.db_query = performance.now() - dbStart;
    
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        { error: 'Usuário desativado. Contate o administrador.' },
        { status: 401 }
      );
    }

    if (!user.hashedPassword) {
      return NextResponse.json(
        { error: 'Usuário sem senha configurada. Contate o administrador.' },
        { status: 401 }
      );
    }

    // 2. Verificar senha (principal gargalo potencial)
    const hashType = user.hashedPassword.length === 96 ? 'scrypt' : 'bcrypt';
    const verifyStart = performance.now();
    const isValidPassword = await verifyPassword(password, user.hashedPassword);
    timings.verify_password = performance.now() - verifyStart;
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // 3. Criar token JWT
    const tokenStart = performance.now();
    const duration = rememberMe ? REMEMBER_ME_DURATION : SESSION_DURATION;
    const token = await createToken({
      id: user.id,
      email: user.email || '',
      userType: user.userType,
      idCustomer: user.idCustomer ? Number(user.idCustomer) : null,
      idProfile: user.idProfile ? Number(user.idProfile) : null,
      fullAccess: user.fullAccess,
    }, duration);
    timings.create_token = performance.now() - tokenStart;

    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isHttps = forwardedProto === 'https';
    const isSecure = process.env.NODE_ENV === 'production' || !!process.env.VERCEL || isHttps;

    const totalTime = performance.now() - startTime;
    
    // Log de performance
    console.log(`[LOGIN] ${email} | Total: ${totalTime.toFixed(0)}ms | DB: ${timings.db_query.toFixed(0)}ms | Verify(${hashType}): ${timings.verify_password.toFixed(0)}ms | Token: ${timings.create_token.toFixed(0)}ms`);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
      },
    });

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: duration,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
