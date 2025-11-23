"use server";

import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";

/**
 * Valida se o usuário tem acesso a um ISO específico
 * Esta função usa a mesma lógica de getCurrentUserInfo para garantir consistência
 * @param userId - ID do usuário
 * @param customerId - ID do ISO (customer)
 * @returns true se o usuário tem acesso, false caso contrário
 */
export async function validateUserAccessToCustomer(
  userId: number,
  customerId: number
): Promise<boolean> {
  const userInfo = await getCurrentUserInfo();
  
  if (!userInfo) {
    return false;
  }

  // Verificar se o userId corresponde ao usuário atual
  if (userInfo.id !== userId) {
    return false;
  }

  // Super Admin tem acesso a todos os ISOs
  if (userInfo.isSuperAdmin) {
    return true;
  }

  // Verificar acesso via idCustomer principal
  if (userInfo.idCustomer === customerId) {
    return true;
  }

  // Verificar acesso via allowedCustomers (inclui adminCustomers e profileCustomers)
  const allowedCustomers = userInfo.allowedCustomers || [];
  if (allowedCustomers.includes(customerId)) {
    return true;
  }

  return false;
}

