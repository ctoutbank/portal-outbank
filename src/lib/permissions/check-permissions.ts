"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, profiles, profileFunctions, functions } from "../../../drizzle/schema";
import { eq, and, ilike } from "drizzle-orm";

/**
 * Verifica se o usuário tem acesso administrativo (pode ver todos os ISOs)
 * Um usuário é considerado admin se o nome do seu perfil contém "ADMIN" (case-insensitive)
 */
export async function isAdminUser(): Promise<boolean> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return false;

    const user = await db
      .select({
        idProfile: users.idProfile,
        profileName: profiles.name,
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(eq(users.idClerk, clerkUser.id))
      .limit(1);

    if (!user || user.length === 0) return false;

    // Verificar se o perfil contém "ADMIN" no nome
    const profileName = user[0].profileName?.toUpperCase() || "";
    return profileName.includes("ADMIN");
  } catch (error) {
    console.error("Error checking admin permissions:", error);
    return false;
  }
}

/**
 * Verifica se o usuário tem uma função/permissão específica
 * @param functionName - Nome da função/permissão a verificar
 */
export async function hasPermission(functionName: string): Promise<boolean> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return false;

    const result = await db
      .select({
        functionName: functions.name,
      })
      .from(users)
      .innerJoin(profiles, eq(users.idProfile, profiles.id))
      .innerJoin(profileFunctions, eq(profiles.id, profileFunctions.idProfile))
      .innerJoin(functions, eq(profileFunctions.idFunctions, functions.id))
      .where(
        and(
          eq(users.idClerk, clerkUser.id),
          eq(functions.name, functionName),
          eq(profiles.active, true),
          eq(functions.active, true),
          eq(profileFunctions.active, true)
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

/**
 * Obtém informações completas do usuário logado
 * @returns Informações do usuário incluindo isAdmin, idCustomer, profileName, etc.
 */
export async function getCurrentUserInfo() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        idCustomer: users.idCustomer,
        fullAccess: users.fullAccess,
        idProfile: users.idProfile,
        active: users.active,
        profileName: profiles.name,
        profileDescription: profiles.description,
      })
      .from(users)
      .leftJoin(profiles, eq(users.idProfile, profiles.id))
      .where(eq(users.idClerk, clerkUser.id))
      .limit(1);

    if (!user || user.length === 0) return null;

    const userData = user[0];
    const profileName = userData.profileName?.toUpperCase() || "";
    const isAdmin = profileName.includes("ADMIN");

    return {
      ...userData,
      isAdmin,
    };
  } catch (error) {
    console.error("Error getting user info:", error);
    return null;
  }
}
