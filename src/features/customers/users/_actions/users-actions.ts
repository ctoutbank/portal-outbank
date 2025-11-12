"use server";

import { db } from "@/db/drizzle";
import { clerkClient } from "@clerk/nextjs/server";
import { generateSlug } from "@/lib/utils";
import { hashPassword } from "@/app/utils/password";
import { generateRandomPassword } from "@/features/customers/users/server/users";
import { sendWelcomePasswordEmail } from "@/lib/send-email";
import { users, profiles, customers, customerCustomization, file } from "../../../../../drizzle/schema";
import { eq, ilike } from "drizzle-orm";

interface InsertUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  idCustomer: number | null;
  active?: boolean;
}

export async function InsertUser(data: InsertUserInput) {
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

  try {
    // Verificar se o usuário já existe no banco de dados
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error("Usuário já existe com este email");
    }

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

    let customerName = "Outbank";
    let logo = "";
    let link = "";

    if (idCustomer) {
      try {
        const customerData = await db
          .select({
            name: customers.name,
            imageUrl: file.fileUrl,
            subdomain: customerCustomization.name,
          })
          .from(customers)
          .leftJoin(customerCustomization, eq(customerCustomization.customerId, customers.id))
          .leftJoin(file, eq(file.id, customerCustomization.imageId))
          .where(eq(customers.id, idCustomer))
          .limit(1);

        if (customerData.length > 0) {
          customerName = customerData[0].name || "Outbank";
          logo = customerData[0].imageUrl || "";
          link = customerData[0].subdomain ? `https://${customerData[0].subdomain}.outbank.cloud` : "";
        }
      } catch (error) {
        console.error("Erro ao buscar dados do customer:", error);
      }
    }

    await sendWelcomePasswordEmail(email, finalPassword, logo, customerName, link);

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

export async function getUsersByCustomer(customerId: number) {
  return db.select().from(users).where(eq(users.idCustomer, customerId));
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
