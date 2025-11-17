"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

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
    
    // Atualizar senha e metadata em uma única chamada
    await clerk.users.updateUser(userId, {
      password: newPassword,
      publicMetadata: {
        isFirstLogin: false,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error updating password:", error);
    return { 
      success: false, 
      error: error?.message || "Erro ao atualizar senha" 
    };
  }
}

