"use server";

import { redirect } from "next/navigation";
import { isAdminOrSuperAdmin } from "./check-permissions";

/**
 * Server-side guard para páginas administrativas
 * Redireciona para /unauthorized se o usuário não for Admin ou Super Admin
 * @returns true se o usuário for Admin ou Super Admin
 */
export async function requireAdmin() {
  const isAdmin = await isAdminOrSuperAdmin();
  
  if (!isAdmin) {
    redirect("/unauthorized");
  }
  
  return true;
}
