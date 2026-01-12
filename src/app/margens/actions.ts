'use server';

import { marginsRepository } from '@/lib/db/margins';
import { sql } from '@vercel/postgres';
import { isSuperAdmin, getUserMultiIsoAccess } from '@/lib/permissions/check-permissions';
import { getCurrentUser } from '@/lib/auth';

export async function getCustomers() {
  const superAdmin = await isSuperAdmin();
  
  if (superAdmin) {
    const { rows } = await sql.query(`
      SELECT id, name, slug FROM customers 
      WHERE is_active = true 
      ORDER BY name
    `);
    return rows;
  }
  
  const user = await getCurrentUser();
  if (!user) return [];
  
  const allowedIds = await getUserMultiIsoAccess(user.id);
  if (allowedIds.length === 0) return [];
  
  const { rows } = await sql.query(`
    SELECT id, name, slug FROM customers 
    WHERE is_active = true AND id = ANY($1)
    ORDER BY name
  `, [allowedIds]);
  return rows;
}

export async function getCostTemplates() {
  return marginsRepository.listCostTemplates();
}

export async function getMarginsByCustomer(customerId: number) {
  const hasAccess = await validateIsoAccess(customerId);
  if (!hasAccess) {
    throw new Error('Acesso negado a este ISO');
  }
  
  const config = await marginsRepository.getMarginConfig(customerId);
  return config || { marginOutbank: 0, marginExecutivo: 0, marginCore: 0 };
}

export async function getCostTemplateById(id: string) {
  return marginsRepository.findCostTemplateById(id);
}

async function validateIsoAccess(customerId: number): Promise<boolean> {
  const superAdmin = await isSuperAdmin();
  if (superAdmin) return true;
  
  const user = await getCurrentUser();
  if (!user) return false;
  
  const allowedIds = await getUserMultiIsoAccess(user.id);
  return allowedIds.includes(customerId);
}

async function getEffectiveRole(): Promise<'super_admin' | 'executivo' | 'core' | null> {
  const superAdmin = await isSuperAdmin();
  if (superAdmin) return 'super_admin';
  
  const user = await getCurrentUser();
  if (!user) return null;
  
  const { rows } = await sql.query(`
    SELECT u.user_type, p.name as profile_name
    FROM users u
    LEFT JOIN profiles p ON u.id_profile = p.id
    WHERE u.id = $1
  `, [user.id]);
  
  if (rows.length === 0) return null;
  
  const profileName = (rows[0].profile_name || '').toUpperCase();
  const userType = rows[0].user_type;
  
  if (userType === 'ISO_PORTAL_ADMIN' || profileName.includes('ADMIN')) {
    return 'executivo';
  }
  
  if (profileName.includes('CORE') || profileName.includes('COMERCIAL')) {
    return 'core';
  }
  
  return null;
}

export async function updateMarginConfig(
  customerId: number, 
  data: { marginOutbank?: number; marginExecutivo?: number; marginCore?: number }
) {
  const effectiveRole = await getEffectiveRole();
  
  if (!effectiveRole) {
    throw new Error('Usuário não tem permissão para editar margens');
  }
  
  if (effectiveRole === 'executivo') {
    throw new Error('Executivo não tem permissão para editar margens');
  }
  
  const hasAccess = await validateIsoAccess(customerId);
  if (!hasAccess) {
    throw new Error('Acesso negado a este ISO');
  }
  
  if (effectiveRole === 'core') {
    await marginsRepository.upsertMarginConfig(customerId, { marginCore: data.marginCore });
  } else {
    await marginsRepository.upsertMarginConfig(customerId, data);
  }
  
  return marginsRepository.getMarginConfig(customerId);
}

export async function getUserMarginRole(): Promise<'super_admin' | 'executivo' | 'core' | null> {
  return getEffectiveRole();
}

export async function getAvailableMccs() {
  const { rows } = await sql.query(`
    SELECT id, code, description FROM mcc 
    WHERE is_active = true 
    ORDER BY code
  `);
  return rows;
}

export async function getFornecedores() {
  const { rows } = await sql.query(`
    SELECT id, nome FROM fornecedores 
    WHERE ativo = true 
    ORDER BY nome
  `);
  return rows;
}

export async function createCostTemplate(data: {
  fornecedorId: string;
  mccId: number;
  bandeiras?: string;
  custoDebitoPos?: string;
  custoCreditoPos?: string;
  custoCredito2xPos?: string;
  custoCredito7xPos?: string;
  custoVoucherPos?: string;
  custoPixPosPercent?: string;
  custoPixPosFixo?: string;
  custoAntecipacaoPos?: string;
  custoDebitoOnline?: string;
  custoCreditoOnline?: string;
  custoCredito2xOnline?: string;
  custoCredito7xOnline?: string;
  custoVoucherOnline?: string;
  custoPixOnlinePercent?: string;
  custoPixOnlineFixo?: string;
  custoAntecipacaoOnline?: string;
}) {
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    throw new Error('Apenas Super Admin pode criar templates de custo');
  }
  
  return marginsRepository.createCostTemplate(data);
}

export async function updateCostTemplate(id: string, data: {
  bandeiras?: string;
  custoDebitoPos?: string;
  custoCreditoPos?: string;
  custoCredito2xPos?: string;
  custoCredito7xPos?: string;
  custoVoucherPos?: string;
  custoPixPosPercent?: string;
  custoPixPosFixo?: string;
  custoAntecipacaoPos?: string;
  custoDebitoOnline?: string;
  custoCreditoOnline?: string;
  custoCredito2xOnline?: string;
  custoCredito7xOnline?: string;
  custoVoucherOnline?: string;
  custoPixOnlinePercent?: string;
  custoPixOnlineFixo?: string;
  custoAntecipacaoOnline?: string;
}) {
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    throw new Error('Apenas Super Admin pode atualizar templates de custo');
  }
  
  return marginsRepository.updateCostTemplate(id, data);
}
