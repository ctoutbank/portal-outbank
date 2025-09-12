"use server";

import { hashPassword } from "@/app/utils/password";
import { db } from "@/db/drizzle";
import { generateSlug } from "@/lib/utils";
import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { profiles, userMerchants, users } from "../../../../../drizzle/schema";

import { sendWelcomePasswordEmail } from "@/lib/send-email";
import { ilike } from "drizzle-orm";
import { getCustomizationByCustomerId } from "@/utils/serverActions";

export type UserDetail = typeof users.$inferSelect;

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

export interface UserDetailForm extends UserDetail {
  firstName: string;
  lastName: string;
  email: string;
  selectedMerchants?: string[];
  fullAccess: boolean;
}

export async function generateRandomPassword(length = 6) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomPassword = "";
  for (let i = 0; i < length; i++) {
    randomPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return randomPassword;
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

interface InsertUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  idCustomer: number | null;
  active?: boolean;
}

export async function InsertUser(data: InsertUserInput) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      idCustomer,
      active = true,
    } = data;

    const finalPassword =
      password && password.trim() !== ""
        ? password
        : await generateRandomPassword();

    const hashedPassword = hashPassword(finalPassword);

    // Buscar o profile ADMIN dinamicamente
    const adminProfile = await db
      .select()
      .from(profiles)
      .where(ilike(profiles.name, "%ADMIN%"))
      .limit(1)
      .execute();

    if (!adminProfile || adminProfile.length === 0) {
      throw new Error("Profile ADMIN não encontrado no banco.");
    }

    const idProfile = adminProfile[0].id;

    // Criação no Clerk
    const clerk = await clerkClient(); // chamar a função e obter o cliente
    const clerkUser = await clerk.users.createUser({
      firstName,
      lastName,
      emailAddress: [email],
      skipPasswordRequirement: true,
      publicMetadata: {
        isFirstLogin: true,
      },
    });

    // Criação no banco
    const created = await db
      .insert(users)
      .values({
        slug: generateSlug(),
        dtinsert: new Date().toISOString(),
        dtupdate: new Date().toISOString(),
        active,
        email,
        idCustomer: idCustomer ?? null,
        idClerk: clerkUser.id,
        idProfile, // aqui usa o idProfile dinâmico
        idAddress: null,
        fullAccess: false,
        hashedPassword,
      })
      .returning({ id: users.id });

    const domain = await getCustomizationByCustomerId(idCustomer ?? 0);

    const logo = "https://file-upload-outbank.s3.amazonaws.com/LUmLuBIG.jpg";
    const link = domain?.name ? `https://${domain.name}.consolle.one` : undefined;
    await sendWelcomePasswordEmail(email, finalPassword, logo, link);

    console.log("logo", logo);

    return created[0].id;
  } catch (error: unknown) {
    console.error("Erro ao criar usuário:", error);

    // Tratamento específico para erros do Clerk
    if (error && typeof error === "object" && "errors" in error) {
      const clerkError = error as {
        errors: Array<{ code: string; message: string }>;
      };

      // Verificar se é erro de email duplicado no Clerk
      const duplicateEmailError = clerkError.errors.find(
        (err) =>
          err.code === "email_address_already_exists" ||
          err.message.includes("already exists") ||
          err.message.includes("duplicate")
      );

      if (duplicateEmailError) {
        throw new Error("Usuário já existe com este email");
      }

      // Verificar outros erros comuns do Clerk
      const invalidEmailError = clerkError.errors.find(
        (err) =>
          err.code === "form_identifier_exists" ||
          err.message.includes("identifier")
      );

      if (invalidEmailError) {
        throw new Error("Email inválido ou já está em uso");
      }
    }

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

    // Para outros erros, manter o comportamento original
    throw error;
  }
}

export async function getUsersWithClerk(customerId: number) {
  const dbUsers = await db
    .select()
    .from(users)
    .where(eq(users.idCustomer, customerId));

  const result = await Promise.all(
    dbUsers.map(async (user) => {
      let firstName = "";
      let lastName = "";

      if (user.idClerk) {
        try {
          const clerkUser = await (
            await clerkClient()
          ).users.getUser(user.idClerk);
          firstName = clerkUser.firstName ?? "";
          lastName = clerkUser.lastName ?? "";
        } catch (error) {
          console.error("Erro ao buscar usuário no Clerk:", error);
        }
      }

      return {
        ...user,
        firstName,
        lastName,
      };
    })
  );

  return result;
}

export async function deleteUser(id: number): Promise<boolean> {
  try {
    // Primeiro, buscar o usuário para obter o idClerk
    const existingUser = await db.select().from(users).where(eq(users.id, id));

    if (!existingUser || existingUser.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    const userToDelete = existingUser[0];

    // Excluir do Clerk se o usuário tiver idClerk
    if (userToDelete.idClerk) {
      try {
        const clerk = await clerkClient();
        await clerk.users.deleteUser(userToDelete.idClerk);
      } catch (clerkError) {
        console.error("Erro ao excluir usuário do Clerk:", clerkError);
        // Continuar com a exclusão do banco mesmo se falhar no Clerk
      }
    }

    // Excluir do banco de dados
    await db.delete(users).where(eq(users.id, id));

    return true;
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return false;
  }
}
