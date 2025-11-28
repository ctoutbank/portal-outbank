import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { isSuperAdmin } from "@/lib/permissions/check-permissions";

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

    const clerk = await clerkClient();

    // Buscar usuário por email
    const users = await clerk.users.getUserList({
      emailAddress: [email],
    });

    if (users.length === 0) {
      return NextResponse.json(
        { error: `Usuário com email ${email} não encontrado` },
        { status: 404 }
      );
    }

    const user = users[0];

    // Atualizar senha
    try {
      await clerk.users.updateUser(user.id, {
        password: newPassword,
        skipPasswordChecks: false, // Manter validações de segurança
      });

      return NextResponse.json({
        success: true,
        message: `Senha resetada com sucesso para ${email}`,
      });
    } catch (clerkError: any) {
      // Capturar erros específicos do Clerk
      let errorMessage = "Erro ao atualizar senha no Clerk";
      
      if (clerkError.errors) {
        const errors = clerkError.errors;
        if (errors.some((e: any) => e.message?.includes("pwned"))) {
          errorMessage = "Esta senha foi comprometida. Por favor, escolha outra senha.";
        } else if (errors.some((e: any) => e.message?.includes("email"))) {
          errorMessage = "A senha não pode ser igual ao email.";
        } else {
          errorMessage = errors[0]?.message || errorMessage;
        }
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Erro ao resetar senha:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

