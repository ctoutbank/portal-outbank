"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { users } from "../../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/app/utils/password";

export async function updatePasswordAction(newPassword: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: "Usuário não autenticado" };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: "A senha deve ter pelo menos 8 caracteres" };
    }

    const clerk = await clerkClient();
    
    // Atualizar senha e metadata no Clerk
    await clerk.users.updateUser(userId, {
      password: newPassword,
      publicMetadata: {
        isFirstLogin: false,
      },
    });

    // ✅ Atualizar senha no banco de dados também
    // Atualiza TODOS os registros do usuário (pode ter múltiplos ISOs)
    const hashedPassword = hashPassword(newPassword);
    
    // Buscar todos os registros do usuário pelo idClerk e atualizar senha
    await db
      .update(users)
      .set({
        hashedPassword: hashedPassword,
        initialPassword: newPassword, // Atualizar senha inicial também
        dtupdate: new Date().toISOString(),
      })
      .where(eq(users.idClerk, userId));

    return { success: true };
  } catch (error: any) {
    console.error("Error updating password:", error);
    return { 
      success: false, 
      error: error?.message || "Erro ao atualizar senha" 
    };
  }
}

