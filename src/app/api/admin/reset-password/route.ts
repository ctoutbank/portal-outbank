import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/permissions/check-permissions";
import { db } from "@/db/drizzle";
import { users } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/app/utils/password";

/**
 * API Route para resetar senha de usuário
 * 
 * POST /api/admin/reset-password
 * Body: { email: string, newPassword: string }
 * 
 * Apenas Super Admin pode usar esta rota
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar se é Super Admin
    const isAdmin = await isSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas Super Admin pode resetar senhas." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Email e nova senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar senha
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 8 caracteres" },
        { status: 400 }
      );
    }

    // Verificar se senha não é igual ao email
    if (newPassword.toLowerCase() === email.toLowerCase()) {
      return NextResponse.json(
        { error: "A senha não pode ser igual ao email" },
        { status: 400 }
      );
    }

    // Buscar usuário por email no banco
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: `Usuário com email ${email} não encontrado` },
        { status: 404 }
      );
    }

    const user = userResult[0];

    // Atualizar senha no banco
    const hashedPassword = hashPassword(newPassword);
    
    await db
      .update(users)
      .set({
        hashedPassword: hashedPassword,
        initialPassword: newPassword,
        dtupdate: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: `Senha resetada com sucesso para ${email}`,
    });
  } catch (error: any) {
    console.error("Erro ao resetar senha:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

