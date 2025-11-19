"use server";

import { redirect } from "next/navigation";
import { isSuperAdmin } from "./check-permissions";

/**
 * Server-side guard para páginas que requerem Super Admin
 * Redireciona para /unauthorized se o usuário não for Super Admin
 * @returns true se o usuário for Super Admin
 */
export async function requireSuperAdmin() {
  const isSuper = await isSuperAdmin();
  
  if (!isSuper) {
    redirect("/unauthorized");
  }
  
  return true;
}
