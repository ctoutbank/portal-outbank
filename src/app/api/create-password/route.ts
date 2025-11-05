import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/app/utils/password";

export async function POST(request: NextRequest) {
  try {
    const { email, tempPassword, newPassword } = await request.json();

    if (!email || !tempPassword || !newPassword) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar usuário no banco de dados
    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!dbUser || dbUser.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const user = dbUser[0];

    // Verificar se a senha temporária está correta
    const hashedTempPassword = hashPassword(tempPassword);
    if (user.hashedPassword !== hashedTempPassword) {
      return NextResponse.json(
        { error: "Senha temporária incorreta" },
        { status: 401 }
      );
    }

    // Atualizar senha no Clerk
    const clerk = await clerkClient();
    
    try {
      await clerk.users.updateUser(user.idClerk!, {
        password: newPassword,
      });
    } catch (clerkError) {
      console.error("Erro ao atualizar senha no Clerk:", clerkError);
      return NextResponse.json(
        { error: "Erro ao atualizar senha no sistema de autenticação" },
        { status: 500 }
      );
    }

    // Atualizar senha no banco de dados
    const hashedNewPassword = hashPassword(newPassword);
    await db
      .update(users)
      .set({
        hashedPassword: hashedNewPassword,
        dtupdate: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ 
      success: true,
      message: "Senha atualizada com sucesso" 
    });

  } catch (error) {
    console.error("Erro ao criar senha:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}