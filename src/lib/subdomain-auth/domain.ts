import { db } from "@/lib/db";
import { customerCustomization, users, profiles, adminCustomers, profileCustomers } from "../../../drizzle/schema";
import { sql, eq, and } from "drizzle-orm";

export async function validateUserAccessBySubdomain(
  email: string,
  subdomain: string
) {
  // 1. Buscar o tenant com o slug do subdomínio (case-insensitive)
  const tenantResult = await db
    .select()
    .from(customerCustomization)
    .where(sql`LOWER(${customerCustomization.slug}) = LOWER(${subdomain})`);

  const tenant = tenantResult[0];
  if (!tenant || !tenant.customerId)
    return { authorized: false, reason: "Subdomínio inválido" };

  const userResult = await db
    .select({
      id: users.id,
      email: users.email,
      idCustomer: users.idCustomer,
      idProfile: users.idProfile,
      active: users.active,
      profileName: profiles.name,
    })
    .from(users)
    .leftJoin(profiles, eq(users.idProfile, profiles.id))
    .where(sql`LOWER(${users.email}) = LOWER(${email})`);

  const user = userResult[0];
  if (!user)
    return { authorized: false, reason: "Usuário não encontrado" };

  if (!user.active) {
    return { authorized: false, reason: "Usuário inativo" };
  }

  // 2. Verificar se é Super Admin (acesso a todos os ISOs)
  const profileName = user.profileName?.toUpperCase() || "";
  const isSuperAdmin = profileName.includes("SUPER_ADMIN") || profileName.includes("SUPER");

  if (isSuperAdmin) {
    return { authorized: true, user, tenant };
  }

  // 3. Verificar se o id_customer do usuário bate com o customer_id do tenant
  if (user.idCustomer === tenant.customerId) {
    return { authorized: true, user, tenant };
  }

  // 4. Verificar acesso via adminCustomers (ISOs individuais para Admins)
  if (user.id && tenant.customerId) {
    const adminAccess = await db
      .select({
        idCustomer: adminCustomers.idCustomer,
      })
      .from(adminCustomers)
      .where(
        and(
          eq(adminCustomers.idUser, user.id),
          eq(adminCustomers.idCustomer, tenant.customerId),
          eq(adminCustomers.active, true)
        )
      )
      .limit(1);

    if (adminAccess.length > 0) {
      return { authorized: true, user, tenant };
    }
  }

  // 5. Verificar acesso via profileCustomers (ISOs da categoria/perfil)
  if (user.idProfile && tenant.customerId) {
    const profileAccess = await db
      .select({
        idCustomer: profileCustomers.idCustomer,
      })
      .from(profileCustomers)
      .where(
        and(
          eq(profileCustomers.idProfile, user.idProfile),
          eq(profileCustomers.idCustomer, tenant.customerId),
          eq(profileCustomers.active, true)
        )
      )
      .limit(1);

    if (profileAccess.length > 0) {
      return { authorized: true, user, tenant };
    }
  }

  return {
    authorized: false,
    reason: "Usuário não tem acesso a este subdomínio",
  };
}
