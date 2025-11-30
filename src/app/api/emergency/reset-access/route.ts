import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { db, users } from "@/lib/db";
import { eq, sql } from "drizzle-orm";

/**
 * Rota de EMERGÊNCIA para resetar acesso de usuário
 * 
 * Esta rota pode ser chamada diretamente via curl/postman com um token secreto
 * para restaurar acesso de usuário sem precisar estar logado.
 * 
 * POST /api/emergency/reset-access
 * Headers: 
 *   X-Emergency-Token: <token_secreto>
 * Body: 
 *   { email: string, newPassword: string }
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar token de emergência
    const emergencyToken = req.headers.get("X-Emergency-Token");
    const expectedToken = process.env.EMERGENCY_RESET_TOKEN || "RESET_EMERGENCY_2024";

    if (emergencyToken !== expectedToken) {
      return NextResponse.json(
        { error: "Token de emergência inválido" },
        { status: 401 }
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

    console.log(`[EMERGENCY RESET] Iniciando reset para: ${email}`);

    // Buscar usuário no banco
    const dbUsers = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email})`)
      .limit(1);

    const dbUser = dbUsers.length > 0 ? dbUsers[0] : null;

    // Buscar no Clerk
    const clerkUsers = await clerk.users.getUserList({
      emailAddress: [email],
    });

    if (clerkUsers.data.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado no Clerk" },
        { status: 404 }
      );
    }

    const clerkUser = clerkUsers.data[0];
    const clerkUserId = clerkUser.id;

    console.log(`[EMERGENCY RESET] Usuário encontrado no Clerk: ${clerkUserId}`);

    // Se usuário existe no banco, atualizar
    if (dbUser) {
      // Ativar usuário se estiver inativo
      if (!dbUser.active) {
        await db
          .update(users)
          .set({
            active: true,
            dtupdate: new Date().toISOString(),
          })
          .where(eq(users.id, dbUser.id));
        console.log(`[EMERGENCY RESET] Usuário ativado no banco`);
      }

      // Sincronizar ID Clerk se diferente
      if (!dbUser.idClerk || dbUser.idClerk !== clerkUserId) {
        await db
          .update(users)
          .set({
            idClerk: clerkUserId,
            dtupdate: new Date().toISOString(),
          })
          .where(eq(users.id, dbUser.id));
        console.log(`[EMERGENCY RESET] ID Clerk sincronizado no banco`);
      }
    } else {
      console.log(`[EMERGENCY RESET] Usuário não encontrado no banco (mas existe no Clerk)`);
    }

    // Atualizar usuário no Clerk
    await clerk.users.updateUser(clerkUserId, {
      password: newPassword,
      banned: false, // Remover ban se existir
      publicMetadata: {
        ...((clerkUser.publicMetadata as any) || {}),
        isFirstLogin: false,
      },
    });

    console.log(`[EMERGENCY RESET] Senha resetada e correções aplicadas no Clerk`);

    return NextResponse.json({
      success: true,
      message: "Acesso restaurado com sucesso",
      email,
      corrections: [
        "Senha resetada no Clerk",
        "Usuário desbanido (se estava banido)",
        "Flags de primeiro login removidas",
        dbUser ? (dbUser.active ? "Usuário já estava ativo no banco" : "Usuário ativado no banco") : "Usuário não encontrado no banco",
        dbUser ? "ID Clerk sincronizado" : null,
      ].filter(Boolean),
    });
  } catch (error: any) {
    console.error("[EMERGENCY RESET] Erro:", error);
    return NextResponse.json(
      { 
        error: "Erro ao restaurar acesso",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

