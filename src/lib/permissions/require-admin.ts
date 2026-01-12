"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isAdminOrSuperAdmin, isCoreProfile, getCurrentUserInfo, getUserMultiIsoAccess, isSuperAdmin, isSuperAdminById, getUserRoleById } from "./check-permissions";
import { getCurrentUser } from "@/lib/auth";

const SIMULATED_USER_COOKIE = "dev_simulated_user_id";

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

/**
 * Server-side guard para páginas de gerenciamento de ISOs
 * Permite acesso para Admin, Super Admin ou usuários CORE
 * Redireciona para /unauthorized se não tiver permissão
 * @returns true se o usuário tiver permissão
 */
export async function requireAdminOrCore() {
  const isAdmin = await isAdminOrSuperAdmin();
  const isCore = await isCoreProfile();
  
  if (!isAdmin && !isCore) {
    redirect("/unauthorized");
  }
  
  return true;
}

/**
 * Obtém o contexto de simulação (se Super Admin está simulando outro usuário)
 */
async function getSimulationContext(): Promise<{ targetUserId: number; isSimulating: boolean } | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    
    const cookieStore = await cookies();
    const simulatedUserIdCookie = cookieStore.get(SIMULATED_USER_COOKIE)?.value;
    
    if (!simulatedUserIdCookie) {
      return { targetUserId: user.id, isSimulating: false };
    }
    
    const simulatedUserId = parseInt(simulatedUserIdCookie, 10);
    if (isNaN(simulatedUserId)) {
      return { targetUserId: user.id, isSimulating: false };
    }
    
    // Apenas Super Admin real pode simular
    const realUserIsSuperAdmin = await isSuperAdmin();
    if (!realUserIsSuperAdmin) {
      return { targetUserId: user.id, isSimulating: false };
    }
    
    return { targetUserId: simulatedUserId, isSimulating: true };
  } catch (error) {
    return null;
  }
}

/**
 * Server-side guard para verificar acesso a um ISO específico
 * Respeita o contexto de simulação (View Mode)
 * Super Admin e Admin têm acesso a todos os ISOs
 * CORE só tem acesso aos ISOs vinculados (via allowedCustomers)
 * @param customerId - ID do ISO a ser acessado
 * @returns true se o usuário tiver acesso ao ISO
 */
export async function requireIsoAccess(customerId: number) {
  const context = await getSimulationContext();
  
  if (!context) {
    redirect("/unauthorized");
  }
  
  // ID 0 = criação de novo ISO (permitido para todos com acesso à página)
  if (customerId === 0) {
    return true;
  }
  
  // Se está simulando, verificar permissões do usuário simulado
  if (context.isSimulating) {
    const simulatedIsSuperAdmin = await isSuperAdminById(context.targetUserId);
    if (simulatedIsSuperAdmin) {
      return true;
    }
    
    // Verificar role do usuário simulado
    const simulatedRole = await getUserRoleById(context.targetUserId);
    
    // Admin tem acesso total (abaixo de Super Admin)
    if (simulatedRole === 'admin') {
      return true;
    }
    
    // EXECUTIVO não tem acesso a páginas de gerenciamento de ISOs
    if (simulatedRole === 'executivo') {
      redirect("/unauthorized");
    }
    
    // CORE só tem acesso aos ISOs vinculados
    if (simulatedRole === 'core') {
      const allowedIds = await getUserMultiIsoAccess(context.targetUserId);
      if (allowedIds.includes(customerId)) {
        return true;
      }
    }
    
    redirect("/unauthorized");
  }
  
  // Não está simulando - verificar permissões do usuário real
  const userInfo = await getCurrentUserInfo();
  
  if (!userInfo) {
    redirect("/unauthorized");
  }
  
  if (userInfo.isSuperAdmin || userInfo.isAdmin) {
    return true;
  }
  
  if (userInfo.allowedCustomers && userInfo.allowedCustomers.includes(customerId)) {
    return true;
  }
  
  redirect("/unauthorized");
}
