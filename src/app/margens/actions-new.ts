'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { isoMarginsRepository, IsoMarginConfig, LinkedMdrTable, MdrTableWithCost } from '@/lib/db/iso-margins';
import { isSuperAdmin, getUserMultiIsoAccess, isSuperAdminById, getUserRoleById, isUserActiveById, getUserAuthorizedMenusById, getUserCategoryById } from '@/lib/permissions/check-permissions';
import { getCurrentUser } from '@/lib/auth';

const SIMULATED_USER_COOKIE = "dev_simulated_user_id";

export interface EffectiveUserContext {
  targetUserId: number | null;
  isSimulating: boolean;
}

export async function getEffectiveUserId(): Promise<EffectiveUserContext> {
  try {
    const cookieStore = await cookies();
    const simulatedUserIdCookie = cookieStore.get(SIMULATED_USER_COOKIE)?.value;
    
    if (!simulatedUserIdCookie) {
      return { targetUserId: null, isSimulating: false };
    }
    
    const simulatedUserId = parseInt(simulatedUserIdCookie, 10);
    if (isNaN(simulatedUserId)) {
      return { targetUserId: null, isSimulating: false };
    }
    
    const realUserIsSuperAdmin = await isSuperAdmin();
    if (!realUserIsSuperAdmin) {
      return { targetUserId: null, isSimulating: false };
    }
    
    const isSimulatedUserActive = await isUserActiveById(simulatedUserId);
    if (!isSimulatedUserActive) {
      return { targetUserId: null, isSimulating: false };
    }
    
    return { targetUserId: simulatedUserId, isSimulating: true };
  } catch (error) {
    return { targetUserId: null, isSimulating: false };
  }
}

export async function getSimulatedUserPermissions(): Promise<{
  authorizedMenus: string[];
  isCore: boolean;
  isExecutivo: boolean;
  isAdmin: boolean;
  category: string | null;
} | null> {
  const { targetUserId, isSimulating } = await getEffectiveUserId();
  
  if (!isSimulating || !targetUserId) {
    return null;
  }
  
  const [authorizedMenus, category] = await Promise.all([
    getUserAuthorizedMenusById(targetUserId),
    getUserCategoryById(targetUserId)
  ]);
  
  const isAdmin = category === 'ISO_ADMIN';
  
  return {
    authorizedMenus: authorizedMenus || [],
    isCore: category === 'CORE',
    isExecutivo: category === 'EXECUTIVO',
    isAdmin,
    category
  };
}

interface SimulationContext {
  isSimulating: boolean;
  targetUserId: number;
  realUserId: number;
}

async function validateSimulationAccess(simulatedUserId?: number | null): Promise<SimulationContext | null> {
  const user = await getCurrentUser();
  if (!user) {
    console.log('[validateSimulationAccess] No authenticated user');
    return null;
  }

  if (!simulatedUserId) {
    return {
      isSimulating: false,
      targetUserId: user.id,
      realUserId: user.id,
    };
  }

  const realUserIsSuperAdmin = await isSuperAdmin();
  if (!realUserIsSuperAdmin) {
    console.log('[validateSimulationAccess] Non-Super Admin tried to simulate - rejecting');
    return {
      isSimulating: false,
      targetUserId: user.id,
      realUserId: user.id,
    };
  }

  const isSimulatedUserActive = await isUserActiveById(simulatedUserId);
  if (!isSimulatedUserActive) {
    console.log(`[validateSimulationAccess] Simulated user ${simulatedUserId} not found or inactive`);
    return {
      isSimulating: false,
      targetUserId: user.id,
      realUserId: user.id,
    };
  }

  console.log(`[validateSimulationAccess] Super Admin ${user.id} simulating user ${simulatedUserId}`);
  return {
    isSimulating: true,
    targetUserId: simulatedUserId,
    realUserId: user.id,
  };
}

export async function getIsoList(simulatedUserId?: number | null): Promise<IsoMarginConfig[]> {
  const context = await validateSimulationAccess(simulatedUserId);
  if (!context) {
    console.log('[getIsoList] No valid context');
    return [];
  }

  if (context.isSimulating) {
    const simulatedUserIsSuperAdmin = await isSuperAdminById(context.targetUserId);
    if (simulatedUserIsSuperAdmin) {
      console.log('[getIsoList] Simulating Super Admin - returning all ISOs');
      return isoMarginsRepository.listIsoConfigs();
    }

    const allowedIds = await getUserMultiIsoAccess(context.targetUserId);
    console.log(`[getIsoList] Simulating user ${context.targetUserId}, Allowed ISOs: ${allowedIds.join(', ')}`);
    
    if (allowedIds.length === 0) {
      return [];
    }
    
    const allConfigs = await isoMarginsRepository.listIsoConfigs();
    return allConfigs.filter(c => allowedIds.includes(c.customerId));
  }

  const superAdmin = await isSuperAdmin();
  if (superAdmin) {
    console.log('[getIsoList] Real Super Admin - returning all ISOs');
    return isoMarginsRepository.listIsoConfigs();
  }

  const allowedIds = await getUserMultiIsoAccess(context.targetUserId);
  console.log(`[getIsoList] Real user ${context.targetUserId}, Allowed ISOs: ${allowedIds.join(', ')}`);
  
  if (allowedIds.length === 0) {
    return [];
  }
  
  const allConfigs = await isoMarginsRepository.listIsoConfigs();
  return allConfigs.filter(c => allowedIds.includes(c.customerId));
}

export async function getUserRole(simulatedUserId?: number | null): Promise<'super_admin' | 'executivo' | 'core' | null> {
  const context = await validateSimulationAccess(simulatedUserId);
  if (!context) {
    return null;
  }

  if (context.isSimulating) {
    const role = await getUserRoleById(context.targetUserId);
    console.log(`[getUserRole] Simulating user ${context.targetUserId}, role: ${role}`);
    return role;
  }

  const superAdmin = await isSuperAdmin();
  if (superAdmin) return 'super_admin';

  const role = await getUserRoleById(context.targetUserId);
  console.log(`[getUserRole] Real user ${context.targetUserId}, role: ${role}`);
  return role;
}

export async function checkIsSuperAdminForView(simulatedUserId?: number | null): Promise<boolean> {
  const context = await validateSimulationAccess(simulatedUserId);
  if (!context) {
    return false;
  }

  if (context.isSimulating) {
    const simulatedIsSuperAdmin = await isSuperAdminById(context.targetUserId);
    console.log(`[checkIsSuperAdminForView] Simulating user ${context.targetUserId}, isSuperAdmin: ${simulatedIsSuperAdmin}`);
    return simulatedIsSuperAdmin;
  }

  return isSuperAdmin();
}

export async function getIsoDetail(customerId: number, simulatedUserId?: number | null): Promise<{
  config: IsoMarginConfig | null;
  linkedTables: LinkedMdrTable[];
} | null> {
  const hasAccess = await validateIsoAccess(customerId, simulatedUserId);
  if (!hasAccess) return null;
  
  const [config, linkedTables] = await Promise.all([
    isoMarginsRepository.getIsoConfig(customerId),
    isoMarginsRepository.getLinkedMdrTables(customerId, true)
  ]);
  
  return { config, linkedTables };
}

export async function updateIsoMargins(
  customerId: number, 
  data: { marginOutbank?: string; marginExecutivo?: string; marginCore?: string }
): Promise<IsoMarginConfig> {
  const superAdmin = await isSuperAdmin();
  
  const filterDefinedFields = (obj: Record<string, any>) => {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, value]) => value !== undefined)
    );
  };
  
  if (superAdmin) {
    const filteredData = filterDefinedFields(data);
    return isoMarginsRepository.upsertIsoConfig(customerId, filteredData);
  }
  
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Usuário não autenticado');
  }
  
  const userRole = await getUserRole();
  
  if (userRole === 'executivo') {
    throw new Error('Usuários Executivo não podem editar margens');
  }
  
  if (userRole === 'core') {
    const allowedIds = await getUserMultiIsoAccess(user.id);
    if (!allowedIds.includes(customerId)) {
      throw new Error('Você não tem acesso a este ISO');
    }
    
    if (data.marginCore === undefined) {
      throw new Error('Valor da margem é obrigatório');
    }
    const coreOnlyData = { marginCore: data.marginCore };
    return isoMarginsRepository.upsertIsoConfig(customerId, coreOnlyData);
  }
  
  throw new Error('Você não tem permissão para editar margens');
}

export async function getAvailableTables(fornecedorId?: string): Promise<MdrTableWithCost[]> {
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    return [];
  }
  
  return isoMarginsRepository.getAvailableMdrTables(fornecedorId);
}

export async function linkTableToIso(customerId: number, fornecedorCategoryId: string): Promise<void> {
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    throw new Error('Apenas Super Admin pode vincular tabelas');
  }
  
  await isoMarginsRepository.linkMdrTable(customerId, fornecedorCategoryId);
}

export async function unlinkTableFromIso(customerId: number, fornecedorCategoryId: string): Promise<void> {
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    throw new Error('Apenas Super Admin pode desvincular tabelas');
  }
  
  await isoMarginsRepository.unlinkMdrTable(customerId, fornecedorCategoryId);
}

export async function getFornecedoresList(): Promise<Array<{ id: string; nome: string }>> {
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    return [];
  }
  return isoMarginsRepository.getFornecedores();
}

export async function checkIsSuperAdmin(): Promise<boolean> {
  return isSuperAdmin();
}

async function validateIsoAccess(customerId: number, simulatedUserId?: number | null): Promise<boolean> {
  const context = await validateSimulationAccess(simulatedUserId);
  if (!context) return false;

  if (context.isSimulating) {
    const simulatedIsSuperAdmin = await isSuperAdminById(context.targetUserId);
    if (simulatedIsSuperAdmin) return true;
    
    const allowedIds = await getUserMultiIsoAccess(context.targetUserId);
    return allowedIds.includes(customerId);
  }

  const superAdmin = await isSuperAdmin();
  if (superAdmin) return true;
  
  const allowedIds = await getUserMultiIsoAccess(context.targetUserId);
  return allowedIds.includes(customerId);
}

type MdrValidationStatus = 'rascunho' | 'validada' | 'inativa';

export async function validateMdrTable(
  customerId: number,
  linkId: string,
  newStatus: MdrValidationStatus
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!linkId || linkId.trim() === '') {
    return { success: false, error: 'Recarregue a página e tente novamente' };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'Não autorizado' };
  }

  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    return { success: false, error: 'Apenas Super Admin pode validar tabelas' };
  }

  const { sql } = await import('@vercel/postgres');

  let linkRows;
  try {
    const result = await sql.query(
      `SELECT status FROM iso_mdr_links WHERE id = $1::uuid AND customer_id = $2::bigint`,
      [linkId, customerId]
    );
    linkRows = result.rows;
  } catch (error: any) {
    if (error?.code === '22P02') {
      return { success: false, error: 'Recarregue a página e tente novamente' };
    }
    throw error;
  }
  
  if (!linkRows[0]) {
    return { success: false, error: 'Link não encontrado' };
  }

  const isoConfig = await isoMarginsRepository.getIsoConfig(customerId);
  if (!isoConfig?.id) {
    return { success: false, error: 'Configure as margens do ISO antes de validar tabelas' };
  }

  await isoMarginsRepository.updateLinkStatus(customerId, linkId, newStatus, user.id);

  if (newStatus === 'validada') {
    const { rows: linkData } = await sql.query(
      `SELECT fornecedor_category_id FROM iso_mdr_links WHERE id = $1::uuid`,
      [linkId]
    );
    
    if (linkData[0]?.fornecedor_category_id) {
      await isoMarginsRepository.initializeIsoMdrMarginsFromMdr(
        linkId, 
        linkData[0].fornecedor_category_id
      );
    }
  }

  revalidatePath(`/margens/${customerId}`);
  revalidatePath('/margens');

  return { success: true, message: `Status atualizado para ${newStatus}` };
}
