"use server";

import { redirect } from "next/navigation";
import { isAdminUser } from "./check-permissions";

/**
 * Server-side guard para páginas administrativas
 * Redireciona para /unauthorized se o usuário não for admin
 * @returns true se o usuário for admin
 */
export async function requireAdmin() {
  const isAdmin = await isAdminUser();
  
  if (!isAdmin) {
    redirect("/unauthorized");
  }
  
  return true;
}
