"use server";

import { db } from "@/db/drizzle";
import { clerkClient } from "@clerk/nextjs/server";
import { generateSlug } from "@/lib/utils";
import { hashPassword } from "@/app/utils/password";
import { generateRandomPassword } from "@/features/customers/users/server/users";
import { sendWelcomePasswordEmail } from "@/lib/send-email";
import { users, profiles, customers, customerCustomization, file } from "../../../../../drizzle/schema";
import { eq, ilike, and } from "drizzle-orm";

interface InsertUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  idCustomer: number | null;
  active?: boolean;
}

type InsertUserResult = 
  | { ok: true; userId: number; reused: boolean }
  | { ok: false; code: 'invalid_email' | 'email_in_use' | 'invalid_password' | 'clerk_update_error' | 'clerk_create_error' | 'password_pwned' | 'unknown'; message: string };

export async function InsertUser(data: InsertUserInput): Promise<InsertUserResult> {
  const {
    firstName,
    lastName,
    email,
    password,
    idCustomer,
    active = true,
  } = data;

  const normalizedEmail = email.trim().toLowerCase();
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return {
      ok: false,
      code: 'invalid_email',
      message: 'E-mail inválido. Por favor, insira um e-mail válido.'
    };
  }

  const finalPassword =
    password && password.trim() !== ""
      ? password
      : await generateRandomPassword();

  // ✅ Validar que a senha tenha pelo menos 8 caracteres (requisito do Clerk)
  if (finalPassword.length < 8) {
    return {
      ok: false,
      code: 'invalid_password',
      message: 'A senha deve ter pelo menos 8 caracteres.'
    };
  }

  const hashedPassword = hashPassword(finalPassword);

  // Buscar o profile ADMIN dinamicamente
  const adminProfile = await db
    .select()
    .from(profiles)
    .where(ilike(profiles.name, "%ADMIN%"))
    .limit(1)
    .execute();

  if (!adminProfile || adminProfile.length === 0) {
    return {
      ok: false,
      code: 'unknown',
      message: 'Erro de configuração: Profile ADMIN não encontrado.'
    };
  }

  const idProfile = adminProfile[0].id;

  try {
    // ✅ Verificar se o usuário já existe no banco de dados PARA ESTE ISO (permite mesmo email em ISOs diferentes)
    if (idCustomer) {
      // Se idCustomer foi fornecido, verificar apenas para este ISO específico
      const existingUserForCustomer = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.email, normalizedEmail),
            eq(users.idCustomer, idCustomer)
          )
        )
        .limit(1);

      if (existingUserForCustomer.length > 0) {
        return {
          ok: false,
          code: 'email_in_use',
          message: 'Este e-mail já está cadastrado para este ISO. Por favor, utilize outro e-mail.'
        };
      }
    } else {
      // Se não há idCustomer, verificar globalmente (comportamento antigo para compatibilidade)
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existingUser.length > 0) {
        return {
          ok: false,
          code: 'email_in_use',
          message: 'Este e-mail já está cadastrado no sistema. Por favor, utilize outro e-mail.'
        };
      }
    }

    // Verificar se o usuário existe no Clerk mas não no banco
    const clerk = await clerkClient();
    let clerkUser;
    
    try {
      const clerkUsers = await clerk.users.getUserList({
        emailAddress: [normalizedEmail]
      });
      
      if (clerkUsers.data.length > 0) {
        clerkUser = clerkUsers.data[0];
        
        // ✅ SEMPRE atualizar a senha no Clerk quando reutilizamos um usuário existente
        // Isso garante que a senha exibida no painel admin funcione para login
        console.log(`[InsertUser] Reutilizando usuário Clerk existente: ${clerkUser.id} para email: ${normalizedEmail}`);
        console.log(`[InsertUser] Atualizando senha no Clerk para usuário reutilizado`);
        
        try {
          await clerk.users.updateUser(clerkUser.id, {
            password: finalPassword,
          });
          console.log(`[InsertUser] ✅ Senha atualizada com sucesso no Clerk para usuário: ${clerkUser.id}`);
        } catch (updateError: any) {
          console.error(`[InsertUser] ❌ Erro ao atualizar senha no Clerk:`, updateError?.message || updateError);
          // Não continuar se falhar ao atualizar senha - é crítico para login
          return {
            ok: false,
            code: 'clerk_update_error',
            message: `Erro ao atualizar senha no Clerk: ${updateError?.message || 'Erro desconhecido'}`
          };
        }
        
        // Usuário existe no Clerk mas não no banco - criar registro no banco
        const created = await db
          .insert(users)
          .values({
            slug: generateSlug(),
            dtinsert: new Date().toISOString(),
            dtupdate: new Date().toISOString(),
            active,
            email: normalizedEmail,
            idCustomer: idCustomer ?? null,
            idClerk: clerkUser.id,
            idProfile,
            idAddress: null,
            fullAccess: false,
            hashedPassword,
            initialPassword: finalPassword, // Store initial password for viewing
          })
          .returning({ id: users.id });

        return {
          ok: true,
          userId: created[0].id,
          reused: true
        };
      }
    } catch (clerkError) {
      console.log("Erro ao buscar usuário no Clerk, continuando com criação:", clerkError);
    }

    // Criação no Clerk (usuário não existe em nenhum lugar)
    if (!clerkUser) {
      console.log(`[InsertUser] Criando novo usuário no Clerk para email: ${normalizedEmail}`);
      console.log(`[InsertUser] Senha gerada/fornecida: ${finalPassword.length} caracteres`);
      
      try {
        clerkUser = await clerk.users.createUser({
          firstName,
          lastName,
          emailAddress: [normalizedEmail],
          password: finalPassword, // Define a senha no Clerk para permitir login
          publicMetadata: {
            isFirstLogin: true,
          },
        });
        console.log(`[InsertUser] ✅ Usuário criado com sucesso no Clerk: ${clerkUser.id}`);
      } catch (createError: any) {
        console.error(`[InsertUser] ❌ Erro ao criar usuário no Clerk:`, createError?.message || createError);
        // Verificar se é erro de senha comprometida
        if (createError?.errors?.some((e: any) => e.code === "form_password_pwned")) {
          return {
            ok: false,
            code: 'password_pwned',
            message: 'Senha comprometida: Essa senha foi encontrada em vazamentos de dados. Por favor, escolha uma senha mais segura.'
          };
        }
        return {
          ok: false,
          code: 'clerk_create_error',
          message: `Erro ao criar usuário no Clerk: ${createError?.message || 'Erro desconhecido'}`
        };
      }
    }

    // Criação no banco
    const created = await db
      .insert(users)
      .values({
        slug: generateSlug(),
        dtinsert: new Date().toISOString(),
        dtupdate: new Date().toISOString(),
        active,
        email: normalizedEmail,
        idCustomer: idCustomer ?? null,
        idClerk: clerkUser.id,
        idProfile,
        idAddress: null,
        fullAccess: false,
        hashedPassword,
        initialPassword: finalPassword, // Store initial password for viewing
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
          .leftJoin(file, eq(file.id, customerCustomization.fileId))
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

    await sendWelcomePasswordEmail(normalizedEmail, finalPassword, logo, customerName, link);

    return {
      ok: true,
      userId: created[0].id,
      reused: false
    };
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
        return {
          ok: false,
          code: 'email_in_use',
          message: 'Este e-mail já está cadastrado no sistema. Por favor, utilize outro e-mail.'
        };
      }

      // Verificar outros erros comuns do Clerk
      const invalidEmailError = clerkError.errors.find(
        (err) =>
          err.code === "form_identifier_exists" ||
          err.message.includes("identifier")
      );

      if (invalidEmailError) {
        return {
          ok: false,
          code: 'invalid_email',
          message: 'E-mail inválido ou já está em uso. Por favor, verifique o e-mail informado.'
        };
      }
    }

    // Se for um erro de string simples, verificar se contém informações sobre duplicação
    if (
      typeof error === "string" &&
      (error.includes("already exists") ||
        error.includes("duplicate") ||
        error.includes("já existe"))
    ) {
      return {
        ok: false,
        code: 'email_in_use',
        message: 'Este e-mail já está cadastrado no sistema. Por favor, utilize outro e-mail.'
      };
    }

    // Se for um Error object, verificar a mensagem
    if (error instanceof Error) {
      if (
        error.message.includes("already exists") ||
        error.message.includes("duplicate") ||
        error.message.includes("já existe")
      ) {
        return {
          ok: false,
          code: 'email_in_use',
          message: 'Este e-mail já está cadastrado no sistema. Por favor, utilize outro e-mail.'
        };
      }
    }

    // Para outros erros, retornar erro genérico
    return {
      ok: false,
      code: 'unknown',
      message: 'Não foi possível criar o usuário. Por favor, tente novamente.'
    };
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
