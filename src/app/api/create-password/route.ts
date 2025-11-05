import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword, matchPassword } from "@/app/utils/password";

export async function POST(request: NextRequest) {
  try {
    const { email, tempPassword, newPassword } = await request.json();

    console.log("Create password request:", { email, hasPassword: !!tempPassword, hasNewPassword: !!newPassword });

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

    console.log("Database query result:", { found: dbUser.length > 0, email });

    if (!dbUser || dbUser.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const user = dbUser[0];
    console.log("User found:", { id: user.id, hasHashedPassword: !!user.hashedPassword, hasClerkId: !!user.idClerk });

    // Verificar se a senha temporária está correta
    if (!user.hashedPassword) {
      console.log("User has no hashed password");
      return NextResponse.json(
        { error: "Usuário não possui senha temporária configurada" },
        { status: 400 }
      );
    }

    const passwordMatch = matchPassword(tempPassword, user.hashedPassword);
    console.log("Password match result:", passwordMatch);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Senha temporária incorreta" },
        { status: 401 }
      );
    }

    // Atualizar senha no Clerk
    if (!user.idClerk) {
      console.log("User has no Clerk ID");
      return NextResponse.json(
        { error: "Usuário não está configurado no sistema de autenticação" },
        { status: 400 }
      );
    }

    const clerk = await clerkClient();

    try {
      console.log("Updating Clerk password for user:", user.idClerk);
      await clerk.users.updateUser(user.idClerk, {
        password: newPassword,
      });
      console.log("Clerk password updated successfully");
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
