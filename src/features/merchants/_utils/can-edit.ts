/**
 * Verifica se o usuário pode editar estabelecimentos
 * @param permissions - Array de permissões do usuário
 * @param isSuperAdmin - Se o usuário é Super Admin (deve ser passado como prop)
 * @returns true se o usuário pode editar
 */
export function canEditMerchant(
  permissions: string[] | undefined,
  isSuperAdmin: boolean = false
): boolean {
  if (isSuperAdmin) return true;
  if (!permissions) return false;
  return permissions.includes("Atualizar") || permissions.includes("Inserir");
}

