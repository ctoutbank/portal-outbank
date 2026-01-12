"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { users } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/app/utils/password";

export async function updatePasswordAction(newPassword: string) {
  try {
    const sessionUser = await getCurrentUser();
    
    if (!sessionUser) {
      return { success: false, error: "Usuário não autenticado" };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: "A senha deve ter pelo menos 8 caracteres" };
    }

    // Atualizar senha no banco de dados
    const hashedPassword = hashPassword(newPassword);
    
    await db
      .update(users)
      .set({
        hashedPassword: hashedPassword,
        initialPassword: newPassword,
        dtupdate: new Date().toISOString(),
      })
      .where(eq(users.id, sessionUser.id));

    return { success: true };
  } catch (error: any) {
    console.error("Error updating password:", error);
    return { 
      success: false, 
      error: error?.message || "Erro ao atualizar senha" 
    };
  }
}

