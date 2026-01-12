"use server";

import { db } from "@/db/drizzle";
import { and, eq, ilike, sql } from "drizzle-orm";
import { users } from "../../../../../drizzle/schema";
import { UserSchema } from "../schema/schema";
import { generateSlug } from "@/lib/utils";
import { validateDeletePermission } from "@/lib/permissions/check-permissions";

export type UserDetail = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;

export type Userinsert = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  idCustomer: number | null;
  idProfile: number | null;
  idAddress: number | null;
  selectedMerchants?: string[];
  fullAccess: boolean;
  active: boolean | null;
  idClerk: string | null;
  slug?: string;
  dtinsert?: string;
  dtupdate?: string;
};

export async function getUsersByCustomerId(
  customerId: number,
  page: number = 1,
  perPage: number = 10,
  name?: string
): Promise<{ data: UserDetail[]; totalCount: number }> {
  try {
    const conditions = [eq(users.idCustomer, customerId), eq(users.active, true)];

    if (name && name.trim() !== "") {
      conditions.push(ilike(users.slug, `%${name}%`));
    }

    const totalCountResult = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(and(...conditions));

    const totalCount = Number(totalCountResult[0]?.count || 0);

    const data = await db
      .select()
      .from(users)
      .where(and(...conditions))
      .limit(perPage)
      .offset((page - 1) * perPage)
      .orderBy(users.dtinsert);

    return {
      data,
      totalCount,
    };
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return {
      data: [],
      totalCount: 0,
    };
  }
}

export async function getUserById(id: number): Promise<UserDetail | null> {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Erro ao buscar usuário por ID:", error);
    return null;
  }
}

export async function createUser(data: Userinsert) {
  const fieldsToValidate: (keyof Userinsert)[] = [
    "firstName",
    "lastName",
    "email",
    "idProfile",
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
    // ✅ Verificar se o usuário já existe no banco de dados PARA ESTE ISO (permite mesmo email em ISOs diferentes)
    if (data.idCustomer) {
      const existingUser = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.email, data.email),
            eq(users.idCustomer, data.idCustomer)
          )
        )
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error("Usuário já existe com este email para este ISO");
      }
    } else {
      // Se não há idCustomer, verificar globalmente (comportamento antigo)
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error("Usuário já existe com este email");
      }
    }

    // Criar usuário localmente (sem Clerk)
    const { hashPassword } = await import("@/app/utils/password");
    const hashedPassword = hashPassword(data.password);

    const userId = await db
      .insert(users)
      .values({
        slug: generateSlug(),
        dtinsert: new Date().toISOString(),
        dtupdate: new Date().toISOString(),
        active: true,
        idClerk: null,
        idCustomer: data.idCustomer,
        idProfile: data.idProfile,
        idAddress: data.idAddress,
        fullAccess: data.fullAccess,
        hashedPassword,
        email: data.email,
        initialPassword: data.password,
      })
      .returning({ id: users.id });

    return userId[0].id;
  } catch (error: unknown) {
    console.error("Erro ao criar usuário:", error);

    // Se for um erro de string simples, verificar se contém informações sobre duplicação
    if (
      typeof error === "string" &&
      (error.includes("already exists") ||
        error.includes("duplicate") ||
        error.includes("já existe"))
    ) {
      throw new Error("Usuário já existe com este email");
    }

    // Se for um Error object, verificar a mensagem
    if (error instanceof Error) {
      if (
        error.message.includes("already exists") ||
        error.message.includes("duplicate") ||
        error.message.includes("já existe")
      ) {
        throw new Error("Usuário já existe com este email");
      }
    }

    // Para outros erros, retornar null (comportamento original)
    return null;
  }
}

export async function updateUser(
  id: number,
  userData: UserSchema
): Promise<boolean> {
  try {
    await db
      .update(users)
      .set({
        slug:
          userData.firstName && userData.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : userData.slug,
        active: userData.active,
        idClerk: userData.idClerk,
        idCustomer: userData.idCustomer,
        idProfile: userData.idProfile,
        idAddress: userData.idAddress,
        dtupdate: new Date().toISOString(),
      })
      .where(eq(users.id, id));

    return true;
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return false;
  }
}

export async function deleteUser(id: number): Promise<boolean> {
  const canDelete = await validateDeletePermission();
  if (!canDelete) {
    throw new Error("Apenas Super Admin pode realizar esta operação");
  }

  try {
    await db.delete(users).where(eq(users.id, id));

    return true;
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return false;
  }
}
