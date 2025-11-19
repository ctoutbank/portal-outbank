"use server";

import { redirect } from "next/navigation";
import { hasPermission } from "./check-permissions";

/**
 * Server-side guard para verificar permissão específica
 * Redireciona para /unauthorized se o usuário não tiver a permissão
 * @param functionName - Nome da função/permissão a verificar
 * @returns true se o usuário tiver a permissão
 */
export async function requirePermission(functionName: string) {
  const hasPermissionResult = await hasPermission(functionName);
  
  if (!hasPermissionResult) {
    redirect("/unauthorized");
  }
  
  return true;
}
