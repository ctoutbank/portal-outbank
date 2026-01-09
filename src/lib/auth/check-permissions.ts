import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Verifica se o usuário tem permissão para acessar uma página
 * Adaptado para portal-outbank - versão simplificada
 * @param group Nome do grupo/módulo (ex: "Lançamentos Financeiros")
 * @param permission Permissão específica (padrão: "Listar")
 */
export async function checkPagePermission(
  group: string,
  permission: string = "Listar"
) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  // TODO: Implementar verificação de permissões baseada no sistema do portal-outbank
  // Por enquanto, permite acesso se o usuário estiver autenticado
  // Adaptar conforme o sistema de permissões do portal-outbank

  return true;
}
