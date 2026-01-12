"use server";
import { db } from "@/db/drizzle";
import { CustomerSchema } from "../schema/schema";
import { CustomersInsert } from "../server/customers";
import { eq, sql } from "drizzle-orm";
import { customers, userCustomers } from "../../../../drizzle/schema";
import { getCurrentUser } from "@/lib/auth";
import { isCoreProfile, getCurrentUserInfo, isSuperAdmin, getUserMultiIsoAccess, isSuperAdminById, getUserRoleById } from "@/lib/permissions/check-permissions";
import { cookies } from "next/headers";

const SIMULATED_USER_COOKIE = "dev_simulated_user_id";

export async function insertCustomerFormAction(data: CustomerSchema) {
  try {
    const idParent = await db
      .select({ id: customers.id })
      .from(customers)
      .where(sql`${customers.name} = 'outbank' `)
      .then((result) => result[0]?.id || null);

    const customerInsert: CustomersInsert = {
      slug: data.slug || "",
      name: data.name,
      customerId: data.customerId || null,
      settlementManagementType: data.settlementManagementType || null,
      isActive: false,
      idParent: idParent,
    };

    const result = await db
      .insert(customers)
      .values(customerInsert)
      .returning({ id: customers.id });

    const newCustomerId = result[0]?.id || null;

    if (newCustomerId) {
      const currentUser = await getCurrentUser();
      const isCore = await isCoreProfile();
      
      if (currentUser && isCore) {
        await db.insert(userCustomers).values({
          idUser: currentUser.id,
          idCustomer: newCustomerId,
          active: true,
        });
        console.log(`[insertCustomerFormAction] Usuário CORE ${currentUser.id} vinculado ao novo ISO ${newCustomerId}`);
      }
    }

    return newCustomerId;
  } catch (error) {
    console.error("Erro ao inserir cliente:", error);
    throw error;
  }
}

async function getUpdateSimulationContext(): Promise<{ targetUserId: number; isSimulating: boolean } | null> {
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
    
    const realUserIsSuperAdmin = await isSuperAdmin();
    if (!realUserIsSuperAdmin) {
      return { targetUserId: user.id, isSimulating: false };
    }
    
    return { targetUserId: simulatedUserId, isSimulating: true };
  } catch (error) {
    return null;
  }
}

export async function updateCustomerFormAction(data: CustomerSchema) {
  if (!data.id) {
    throw new Error("Id is required");
  }

  try {
    const context = await getUpdateSimulationContext();
    if (!context) {
      throw new Error("Usuário não autenticado");
    }
    
    const customerId = Number(data.id);
    
    // Se está simulando, verificar permissões do usuário simulado
    if (context.isSimulating) {
      const simulatedIsSuperAdmin = await isSuperAdminById(context.targetUserId);
      if (simulatedIsSuperAdmin) {
        // Super Admin simulado pode editar qualquer ISO
      } else {
        // Verificar role do usuário simulado
        const simulatedRole = await getUserRoleById(context.targetUserId);
        
        // Admin tem acesso total (abaixo de Super Admin)
        if (simulatedRole === 'admin') {
          // Admin pode editar qualquer ISO
        } else if (simulatedRole === 'executivo') {
          // EXECUTIVO é read-only, não pode editar
          throw new Error("Usuários Executivo não podem editar ISOs");
        } else if (simulatedRole === 'core') {
          // CORE só pode editar ISOs vinculados
          const allowedIds = await getUserMultiIsoAccess(context.targetUserId);
          if (!allowedIds.includes(customerId)) {
            throw new Error("Você não tem permissão para editar este ISO");
          }
        } else {
          // Outro tipo de usuário não pode editar
          throw new Error("Você não tem permissão para editar ISOs");
        }
      }
    } else {
      // Não está simulando - verificar permissões do usuário real
      const userInfo = await getCurrentUserInfo();
      if (!userInfo) {
        throw new Error("Usuário não autenticado");
      }
      
      // Super Admin e Admin podem editar qualquer ISO
      // CORE só pode editar ISOs vinculados a ele
      if (!userInfo.isSuperAdmin && !userInfo.isAdmin) {
        const isCore = await isCoreProfile();
        if (isCore) {
          if (!userInfo.allowedCustomers || !userInfo.allowedCustomers.includes(customerId)) {
            throw new Error("Você não tem permissão para editar este ISO");
          }
        } else {
          throw new Error("Você não tem permissão para editar ISOs");
        }
      }
    }
    
    const customerUpdate = await db
      .update(customers)
      .set({
        name: data.name || null,
        customerId: data.customerId || null,
        settlementManagementType: data.settlementManagementType || null,
        slug: data.slug || "",
      })
      .where(eq(customers.id, customerId))
      .returning({ id: customers.id });

    return customerUpdate[0].id;
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    throw error;
  }
}