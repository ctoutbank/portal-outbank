import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { db, users } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { isAdminOrSuperAdmin } from "@/lib/permissions/check-permissions";

/**
 * Rota de API ADMIN para resetar senha de usuário
 * Requer autenticação e permissões de admin
 * 
 * POST /api/admin/reset-user-password
 * Body: { email: string, newPassword: string }
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Verificar se é admin
    const isAdmin = await isAdminOrSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores." },
        { status: 403 }
      );
    }

    // Obter dados do body
    const body = await req.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: "Email e nova senha são obrigatórios" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 8 caracteres" },
        { status: 400 }
      );
    }

    const clerk = await clerkClient();

    // Buscar usuário no banco
    const dbUsers = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email})`)
      .limit(1);

    if (dbUsers.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado no banco de dados" },
        { status: 404 }
      );
    }

    const dbUser = dbUsers[0];

    // Buscar no Clerk
    let clerkUserId: string | null = dbUser.idClerk || null;

    if (!clerkUserId) {
      const clerkUsers = await clerk.users.getUserList({
        emailAddress: [email],
      });

      if (clerkUsers.data.length === 0) {
        return NextResponse.json(
          { error: "Usuário não encontrado no Clerk" },
          { status: 404 }
        );
      }

      clerkUserId = clerkUsers.data[0].id;

      // Atualizar ID Clerk no banco
      await db
        .update(users)
        .set({
          idClerk: clerkUserId,
          dtupdate: new Date().toISOString(),
        })
        .where(eq(users.id, dbUser.id));
    }

    // Ativar usuário se estiver inativo
    if (!dbUser.active) {
      await db
        .update(users)
        .set({
          active: true,
          dtupdate: new Date().toISOString(),
        })
        .where(eq(users.id, dbUser.id));
    }

    // Resetar senha no Clerk
    await clerk.users.updateUser(clerkUserId, {
      password: newPassword,
      publicMetadata: {
        isFirstLogin: false,
      },
    });

    // Nota: O Clerk não permite desbanir via updateUser
    // Para desbanir um usuário, é necessário usar o Clerk Dashboard ou API específica de ban

    return NextResponse.json({
      success: true,
      message: "Senha resetada e usuário corrigido com sucesso",
      email,
    });
  } catch (error: any) {
    console.error("Erro ao resetar senha:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao resetar senha" },
      { status: 500 }
    );
  }
}

