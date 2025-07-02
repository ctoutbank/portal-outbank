"use server";

import { db } from "@/db/drizzle";
import { generateSlug } from "@/lib/utils";
import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { profiles, userMerchants, users } from "../../../../../drizzle/schema";

export type ProfileDD = {
  id: number;
  name: string;
};

export async function getDDProfiles(): Promise<ProfileDD[]> {
  const result = await db
    .select({ id: profiles.id, name: profiles.name })
    .from(profiles)
    .where(eq(profiles.active, true));
  return result as ProfileDD[];
}

export type UserInsert = {
  firstName: string;
  lastName: string;
  email: string;
  idCustomer: number | null;
  idAddress: number | null;
  selectedMerchants?: string[];
  active: boolean | null;
  idClerk: string | null;
  slug?: string;
  dtinsert?: string;
  dtupdate?: string;
};

export interface UserList {
  userObject:
    | {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        profileName: string;
        profileDescription: string;
        status: boolean;
        customerName: string;
        merchants: { id: number; name: string | null }[];
        idClerk: string;
      }[]
    | null;
  totalCount: number;
}

export type DD = {
  id: number;
  name: string | null;
};

export type UserDetail = typeof users.$inferSelect;
export interface UserDetailForm extends UserDetail {
  firstName: string;
  lastName: string;
  email: string;
  selectedMerchants?: string[];
  fullAccess: boolean;
}

export async function InsertUser(data: UserInsert) {
  const fieldsToValidate: (keyof UserInsert)[] = [
    "firstName",
    "lastName",
    "email",
  ];

  const hasEmptyFields = fieldsToValidate.some((field) => {
    const value = data[field];
    return (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    );
  });

  if (hasEmptyFields) {
    throw new Error("Campos obrigatórios não foram preenchidos");
  }

  try {
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.createUser({
      firstName: data.firstName,
      lastName: data.lastName,
      emailAddress: [data.email],
    });
    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.name, "Admin Total"));
    const newUser = await db
      .insert(users)
      .values({
        slug: generateSlug(),
        dtinsert: new Date().toISOString(),
        dtupdate: new Date().toISOString(),
        active: true,
        idClerk: clerkUser.id,
        idCustomer: data.idCustomer,
        idProfile: profile[0].id,
        idAddress: data.idAddress,
        email: data.email,
      })
      .returning({ id: users.id });

    // Revalidar os dados após a criação do usuário
    // Isso garante que a UI será atualizada com os dados mais recentes
    try {
      revalidatePath("/customers");
      revalidatePath(`/customers/${data.idCustomer}`);
    } catch (refreshError) {
      console.error(
        "Erro ao atualizar a interface após criar usuário:",
        refreshError
      );
      // Não interrompe o fluxo se o refresh falhar
    }
    return newUser;
  } catch (error: unknown) {
    console.error("Erro ao criar usuário:", error);

    // Verificar se é um erro de segurança de senha
    throw error;
  }
}

export async function updateUserWithClerk(id: number, data: UserInsert) {
  if (!id) {
    throw new Error("ID do usuário é obrigatório");
  }

  const fieldsToValidate: (keyof UserInsert)[] = [
    "firstName",
    "lastName",
    "email",
  ];

  const hasInvalidFields = fieldsToValidate.some((field) => {
    const value = data[field];
    return (
      value !== undefined &&
      (value === null || (typeof value === "string" && value.trim() === ""))
    );
  });

  if (hasInvalidFields) {
    throw new Error("Campos obrigatórios não podem estar vazios");
  }

  try {
    const existingUser = await db.select().from(users).where(eq(users.id, id));

    if (!existingUser || existingUser.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    const clerk = await clerkClient();

    await clerk.users.updateUser(existingUser[0].idClerk || "", {
      firstName: data.firstName,
      lastName: data.lastName,
    });

    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.name, "Admin Total"));
    await db
      .update(users)
      .set({
        idProfile: profile[0].id,
        idCustomer: data.idCustomer,
        idAddress: data.idAddress,
        dtupdate: new Date().toISOString(),
      })
      .where(eq(users.id, id));

    revalidatePath("/portal/users");
    return true;
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error;
  }
}

export async function getUserDetailWithClerk(
  userId: number
): Promise<UserDetailForm | null> {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0 || !user[0].idClerk) {
      return null;
    }

    const clerk = await clerkClient();

    // Obter detalhes do usuário do Clerk
    const clerkUser = await clerk.users.getUser(user[0].idClerk);

    if (!clerkUser) {
      return null;
    }

    // Obter os relacionamentos merchant-user
    const userMerchantRelations = await db
      .select()
      .from(userMerchants)
      .where(eq(userMerchants.idUser, userId));

    const selectedMerchants = userMerchantRelations
      .filter((relation) => relation.idMerchant !== null)
      .map((relation) => relation.idMerchant!.toString());

    // Compor o objeto UserDetailForm
    const userDetailForm: UserDetailForm = {
      ...user[0],
      firstName: clerkUser.firstName || "",
      lastName: clerkUser.lastName || "",
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      selectedMerchants,
      fullAccess: user[0].fullAccess || false,
    };

    return userDetailForm;
  } catch (error) {
    console.error("Erro ao buscar detalhes do usuário com Clerk:", error);
    return null;
  }
}
