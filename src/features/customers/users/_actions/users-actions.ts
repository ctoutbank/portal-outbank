"use server";

import { db } from "@/db/drizzle";
import { clerkClient } from "@clerk/nextjs/server";
import { generateSlug } from "@/lib/utils";
import { hashPassword } from "@/app/utils/password";
import { generateRandomPassword } from "@/features/customers/users/server/users";
import { sendWelcomePasswordEmail } from "@/lib/send-email";
import { users, profiles, customers, customerCustomization, file } from "../../../../../drizzle/schema";
import { eq, ilike, and } from "drizzle-orm";

interface TenantEmailData {
  customerName: string;
  logo: string;
  link: string | undefined;
}

/**
 * Helper function para buscar dados do tenant (logo, nome, link) para envio de email
 */
async function getTenantEmailData(idCustomer: number | null): Promise<TenantEmailData> {
  const defaultData: TenantEmailData = {
    customerName: "Outbank",
    logo: "https://file-upload-outbank.s3.amazonaws.com/LUmLuBIG.jpg",
    link: undefined,
  };

  if (!idCustomer) {
    return defaultData;
  }

  try {
    // Buscar customização do tenant
    const customization = await db
      .select({
        name: customers.name,
        slug: customerCustomization.slug,
        imageUrl: file.fileUrl,
        imageUrlDirect: customerCustomization.imageUrl,
        emailImageUrl: customerCustomization.emailImageUrl,
      })
      .from(customers)
      .leftJoin(customerCustomization, eq(customerCustomization.customerId, customers.id))
      .leftJoin(file, eq(file.id, customerCustomization.fileId))
      .where(eq(customers.id, idCustomer))
      .limit(1);

    if (customization.length > 0) {
      const data = customization[0];
      const customerName = data.name || "Outbank";
      // ✅ Priorizar emailImageUrl sobre imageUrl para emails
      const logo = data.emailImageUrl || data.imageUrl || data.imageUrlDirect || defaultData.logo;
      // ✅ Usar slug ao invés de name e domínio .consolle.one
      const slug = data.slug;
      const link = slug ? `https://${slug}.consolle.one` : undefined;

      return {
        customerName,
        logo,
        link,
      };
    }
  } catch (error) {
    console.error("[getTenantEmailData] Erro ao buscar dados do tenant:", error);
  }

  return defaultData;
}

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

        // ✅ Enviar email de boas-vindas quando reutiliza usuário
        try {
          const tenantData = await getTenantEmailData(idCustomer);
          await sendWelcomePasswordEmail(
            normalizedEmail,
            finalPassword,
            tenantData.logo,
            tenantData.customerName,
            tenantData.link
          );
          console.log("[InsertUser] ✅ Email de boas-vindas enviado para usuário reutilizado", {
            email: normalizedEmail,
            customerName: tenantData.customerName,
            hasLink: !!tenantData.link,
          });
        } catch (emailError) {
          console.error("[InsertUser] ❌ Falha ao enviar email de boas-vindas (não crítico):", emailError);
          // Não bloquear criação do usuário se email falhar
        }

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

    // ✅ Enviar email de boas-vindas usando função helper
    try {
      const tenantData = await getTenantEmailData(idCustomer);
      await sendWelcomePasswordEmail(
        normalizedEmail,
        finalPassword,
        tenantData.logo,
        tenantData.customerName,
        tenantData.link
      );
      console.log("[InsertUser] ✅ Email de boas-vindas enviado para novo usuário", {
        email: normalizedEmail,
        customerName: tenantData.customerName,
        hasLink: !!tenantData.link,
      });
    } catch (emailError) {
      console.error("[InsertUser] ❌ Falha ao enviar email de boas-vindas (não crítico):", emailError);
      // Não bloquear criação do usuário se email falhar
    }

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
