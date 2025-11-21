import { NextRequest, NextResponse } from "next/server";
import { validateSSOToken } from "@/lib/auth/sso-handler";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect("/auth/sign-in?error=token_missing");
    }

    // Validar token SSO
    const tokenData = await validateSSOToken(token);

    if (!tokenData) {
      return NextResponse.redirect("/auth/sign-in?error=invalid_token");
    }

    // Verificar se o usuário já está autenticado no Clerk
    const { userId } = await auth();

    if (!userId) {
      // Se não estiver autenticado, redirecionar para sign-in
      // O token SSO será preservado para verificação após login
      return NextResponse.redirect(`/auth/sign-in?sso_token=${token}`);
    }

    // Buscar usuário no banco para verificar se corresponde ao usuário autenticado
    const user = await db
      .select({
        id: users.id,
        idClerk: users.idClerk,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, tokenData.userId))
      .limit(1);

    if (!user || user.length === 0 || !user[0].idClerk) {
      return NextResponse.redirect("/auth/sign-in?error=user_not_found");
    }

    // Verificar se o idClerk corresponde ao usuário autenticado
    if (user[0].idClerk !== userId) {
      return NextResponse.redirect("/auth/sign-in?error=user_mismatch");
    }

    // Token válido e usuário autenticado - redirecionar para dashboard
    return NextResponse.redirect("/dashboard");
  } catch (error: any) {
    console.error("Erro ao processar callback SSO:", error);
    return NextResponse.redirect("/auth/sign-in?error=server_error");
  }
}

