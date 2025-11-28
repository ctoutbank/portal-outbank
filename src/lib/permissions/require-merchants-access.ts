"use server";

import { redirect } from "next/navigation";
import { hasMerchantsAccess } from "./check-permissions";

/**
 * Server-side guard para páginas que requerem acesso a estabelecimentos
 * Redireciona para /unauthorized se o usuário não tiver acesso
 * @returns true se o usuário tiver acesso
 */
export async function requireMerchantsAccess() {
  const hasAccess = await hasMerchantsAccess();
  
  if (!hasAccess) {
    redirect("/unauthorized");
  }
  
  return true;
}

