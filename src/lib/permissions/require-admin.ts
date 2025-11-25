"use server";

import { redirect } from "next/navigation";
import { isAdminOrSuperAdmin } from "./check-permissions";

/**
 * Server-side guard para páginas administrativas
 * Redireciona para /unauthorized se o usuário não for Admin ou Super Admin
 * @returns true se o usuário for Admin ou Super Admin
 */
export async function requireAdmin() {
  try {
    const isAdmin = await isAdminOrSuperAdmin();
    
    if (!isAdmin) {
      redirect("/unauthorized");
    }
    
    return true;
  } catch (error: any) {
    // redirect() lança uma exceção especial em Next.js que deve ser propagada
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    
    console.error("Error in requireAdmin:", error);
    // Em caso de erro, redirecionar para unauthorized para segurança
    redirect("/unauthorized");
  }
}
