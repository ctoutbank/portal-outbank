"use server";

import { db } from "@/db/drizzle";
import { generateSlug } from "@/lib/utils";
import { hashPassword } from "@/app/utils/password";
import { generateRandomPassword } from "@/features/customers/users/server/users";
import { sendWelcomePasswordEmail } from "@/lib/send-email";
import { users, profiles, customers, customerCustomization, file, userCustomers, salesAgents } from "../../../../../drizzle/schema";
import { eq, ilike, and, or, isNull, sql } from "drizzle-orm";
import { syncUserToOutbankOneClerk } from "@/lib/clerk-sync";

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
  canViewSensitiveData?: boolean;
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
    canViewSensitiveData,
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

  // ✅ Log detalhado da senha gerada (apenas para debug - remover em produção se necessário)
  console.log(`[InsertUser] 🔐 Senha processada:`, {
    foiFornecida: !!password,
    tamanho: finalPassword.length,
    primeiros3Chars: finalPassword.substring(0, 3) + '***',
    ultimos3Chars: '***' + finalPassword.substring(finalPassword.length - 3),
  });

  // ✅ Validar que a senha tenha pelo menos 8 caracteres (requisito do Clerk)
  if (finalPassword.length < 8) {
    console.error(`[InsertUser] ❌ Senha muito curta: ${finalPassword.length} caracteres`);
    return {
      ok: false,
      code: 'invalid_password',
      message: 'A senha deve ter pelo menos 8 caracteres.'
    };
  }

  const hashedPassword = hashPassword(finalPassword);
  console.log(`[InsertUser] 🔐 Hash da senha gerado: ${hashedPassword.substring(0, 20)}...`);

  // Buscar o profile ISO Admin para usuários de ISO, ou ADMIN para outros
  let idProfile: number;
  let isIsoAdmin = false;

  if (idCustomer) {
    // Usuário de ISO - usar categoria ISO Admin (categoryType = 'ISO_ADMIN')
    const isoAdminProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.categoryType, "ISO_ADMIN"))
      .limit(1)
      .execute();

    if (!isoAdminProfile || isoAdminProfile.length === 0) {
      // Fallback: buscar por nome exato "ISO Admin"
      const isoAdminByName = await db
        .select()
        .from(profiles)
        .where(ilike(profiles.name, "ISO Admin"))
        .limit(1)
        .execute();

      if (!isoAdminByName || isoAdminByName.length === 0) {
        return {
          ok: false,
          code: 'unknown',
          message: 'Erro de configuração: Profile ISO Admin não encontrado.'
        };
      }
      idProfile = isoAdminByName[0].id;
      isIsoAdmin = true;
    } else {
      idProfile = isoAdminProfile[0].id;
      isIsoAdmin = true;
    }
  } else {
    // Usuário sem ISO - usar categoria ADMIN padrão (excluindo ISO Admin)
    const adminProfile = await db
      .select()
      .from(profiles)
      .where(and(
        ilike(profiles.name, "%ADMIN%"),
        sql`COALESCE(${profiles.categoryType}, '') != 'ISO_ADMIN'`
      ))
      .limit(1)
      .execute();

    if (!adminProfile || adminProfile.length === 0) {
      return {
        ok: false,
        code: 'unknown',
        message: 'Erro de configuração: Profile ADMIN não encontrado.'
      };
    }
    idProfile = adminProfile[0].id;
  }

  try {
    // ✅ Verificar se o usuário já existe no banco de dados (Globalmente)
    // Se existir, verificamos se podemos reutilizar (ativo=false ou não vinculado a este ISO)
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      const user = existingUser[0];

      // Caso 1: Usuário pertence a este ISO (Linked)
      if (idCustomer && user.idCustomer === idCustomer) {
        if (!user.active) {
          // Usuário existe mas está inativo -> Reativar
          console.log(`[InsertUser] ♻️ Reativando usuário inativo ID ${user.id} para ISO ${idCustomer}`);

          const passwordToUse = password || await generateRandomPassword(); // Se forneceu senha, usa. Senão, gera nova.
          const newHashedPassword = hashPassword(passwordToUse);

          await db.update(users).set({
            active: true,
            firstName: firstName || undefined, // Atualizar nomes se fornecidos? Sim, via sales_agents
            hashedPassword: newHashedPassword,
            initialPassword: passwordToUse,
            dtupdate: new Date().toISOString(),
          }).where(eq(users.id, user.id));

          // Atualizar sales_agents
          await db.update(salesAgents).set({
            firstName: firstName,
            lastName: lastName,
          }).where(eq(salesAgents.idUsers, user.id));

          // Reativar link user_customers se existir
          await db.update(userCustomers).set({ active: true }).where(and(eq(userCustomers.idUser, user.id), eq(userCustomers.idCustomer, idCustomer)));

          // Enviar email de "boas vindas" / reativação
          try {
            const tenantData = await getTenantEmailData(idCustomer);
            await sendWelcomePasswordEmail(normalizedEmail, passwordToUse, tenantData.logo, tenantData.customerName, tenantData.link);
          } catch (e) {
            console.error("[InsertUser] Erro ao enviar email de reativação:", e);
          }

          return { ok: true, userId: user.id, reused: true };
        } else {
          // Usuário ativo e já vinculado -> Erro
          return {
            ok: false,
            code: 'email_in_use',
            message: 'Este e-mail já está cadastrado e ativo para este ISO.'
          };
        }
      }

      // Caso 2: Usuário existe, mas NÃO está vinculado a este ISO (ou idCustomer é null - floating)
      // Podemos vincular ele a este ISO também? Sim, o sistema suporta multi-iso via userCustomers.
      // Se idCustomer for null (usuário orfão), podemos assumir este ISO como primary? Sim.

      console.log(`[InsertUser] 🔗 Vinculando usuário existente ID ${user.id} ao ISO ${idCustomer}`);

      // Se estava inativo globalmente, reativar
      if (!user.active) {
        await db.update(users).set({ active: true }).where(eq(users.id, user.id));
      }

      // Atualizar idCustomer e idProfile se necessário
      const updateData: { idCustomer?: number; idProfile?: number } = {};

      // Se não tinha primary customer, setar este
      if (!user.idCustomer && idCustomer) {
        updateData.idCustomer = idCustomer;
      }

      // Se não tinha idProfile ou precisa atualizar para ISO_ADMIN
      if (!user.idProfile || user.idProfile !== idProfile) {
        updateData.idProfile = idProfile;
        console.log(`[InsertUser] 🔧 Atualizando id_profile para ${idProfile} (ISO_ADMIN)`);
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(users).set(updateData).where(eq(users.id, user.id));
      }

      // Criar ou reativar vínculo user_customers
      if (idCustomer) {
        try {
          const existingLink = await db
            .select()
            .from(userCustomers)
            .where(and(eq(userCustomers.idUser, user.id), eq(userCustomers.idCustomer, idCustomer)))
            .limit(1);

          if (existingLink.length > 0) {
            await db.update(userCustomers).set({ active: true }).where(and(eq(userCustomers.idUser, user.id), eq(userCustomers.idCustomer, idCustomer)));
          } else {
            await db.insert(userCustomers).values({
              idUser: user.id,
              idCustomer: idCustomer,
              active: true,
              isPrimary: !user.idCustomer, // Se não tinha customer, este é primary
            });
          }
        } catch (linkError) {
          console.error("[InsertUser] Erro ao vincular usuário:", linkError);
        }
      }

      // Se não tinha senha válida (ex: import e sem senha), gerar e enviar email?
      // Assumimos que se estamos adicionando, devemos enviar email de acesso neste ISO.
      // Resetar senha para garantir acesso?
      // O usuário pode já ter senha de outro ISO.
      // Se for reativação (estava inactive), devemos resetar senha.
      // Se estava active, apenas enviar notificação? O UserForm pede senha?
      // UserForm não pede senha explicitamente no create, gera random.

      const passwordToUse = password || await generateRandomPassword();
      // Se o usuário já estava ATIVO, talvez não devêssemos mudar a senha dele sem aviso.
      // Mas o admin está "Criando" o usuário neste contexto.
      // Vamos assumir que se ele já existe e está ativo, mantemos a senha (não enviamos nova), OU enviamos email "Você foi adicionado ao ISO X".
      // Simplificação: Se já existe e ativo, apenas vincula. Não reseta senha. Envia email avisando?
      // O UserForm atual sempre gera senha random e envia.
      // Se resetarmos a senha de um usuário que usa outro ISO, ele perde acesso lá? Sim.
      // Melhor: Se usuário já existe e ATIVO, NÃO mudar senha. Apenas vincular.
      // Se usuário estava INATIVO, Resetar senha.

      if (!user.active) {
        const newHashed = hashPassword(passwordToUse);
        await db.update(users).set({ hashedPassword: newHashed, initialPassword: passwordToUse }).where(eq(users.id, user.id));
        try {
          const tenantData = await getTenantEmailData(idCustomer);
          await sendWelcomePasswordEmail(normalizedEmail, passwordToUse, tenantData.logo, tenantData.customerName, tenantData.link);
        } catch (e) {
          console.error("[InsertUser] Erro ao enviar email:", e);
        }
      } else {
        // Usuário Ativo. Apenas notificar vínculo?
        console.log(`[InsertUser] Usuário ${user.id} já ativo. Apenas vinculado. Senha mantida.`);
        // Opcional: Enviar email "Você agora tem acesso ao ISO X"
      }

      return { ok: true, userId: user.id, reused: true };
    }

    // Criação no banco (sem Clerk)
    console.log(`[InsertUser] 💾 Salvando usuário no banco de dados:`, {
      email: normalizedEmail,
      idCustomer: idCustomer ?? null,
      temHashedPassword: !!hashedPassword,
      temInitialPassword: !!finalPassword,
      initialPasswordTamanho: finalPassword.length,
    });
    // ISO Admin deve ter fullAccess=true para poderes totais dentro do ISO
    // Apenas usuários com categoria ISO_ADMIN recebem fullAccess, não todos com idCustomer
    const shouldHaveFullAccess = isIsoAdmin;

    // Respeitar o valor do formulário para canViewSensitiveData, com fallback para true se for ISO Admin
    const shouldViewSensitiveData = canViewSensitiveData !== undefined ? canViewSensitiveData : isIsoAdmin;

    const created = await db
      .insert(users)
      .values({
        slug: generateSlug(),
        dtinsert: new Date().toISOString(),
        dtupdate: new Date().toISOString(),
        active,
        email: normalizedEmail,
        idCustomer: idCustomer ?? null,
        idClerk: null,
        idProfile,
        idAddress: null,
        fullAccess: shouldHaveFullAccess,
        canViewSensitiveData: shouldViewSensitiveData,
        hashedPassword,
        initialPassword: finalPassword,
      })
      .returning({ id: users.id });
    console.log(`[InsertUser] ✅ Usuário salvo no banco:`, {
      userId: created[0].id,
      email: normalizedEmail,
      fullAccess: shouldHaveFullAccess,
      isIsoAdmin,
    });

    // ✅ Salvar firstName e lastName na tabela sales_agents para exibição
    try {
      await db.insert(salesAgents).values({
        slug: generateSlug(),
        active: true,
        dtinsert: new Date().toISOString(),
        dtupdate: new Date().toISOString(),
        firstName: firstName,
        lastName: lastName,
        email: normalizedEmail,
        idUsers: created[0].id,
      });
      console.log(`[InsertUser] ✅ Dados de nome salvos em sales_agents:`, {
        userId: created[0].id,
        firstName,
        lastName,
      });
    } catch (salesAgentError: any) {
      console.error(`[InsertUser] ⚠️ Erro ao salvar em sales_agents:`, salesAgentError);
    }

    // ✅ Criar vínculo user_customers para usuários de ISO Admin
    if (idCustomer && isIsoAdmin) {
      try {
        // Verificar se já existe um vínculo para evitar erros de chave duplicada em retries
        const existingLink = await db
          .select()
          .from(userCustomers)
          .where(and(
            eq(userCustomers.idUser, created[0].id),
            eq(userCustomers.idCustomer, idCustomer)
          ))
          .limit(1);

        if (existingLink.length === 0) {
          await db.insert(userCustomers).values({
            idUser: created[0].id,
            idCustomer: idCustomer,
            active: true,
            isPrimary: true,
          });
          console.log(`[InsertUser] ✅ Vínculo user_customers criado:`, {
            userId: created[0].id,
            customerId: idCustomer,
          });
        } else {
          console.log(`[InsertUser] ℹ️ Vínculo user_customers já existe:`, {
            userId: created[0].id,
            customerId: idCustomer,
          });
        }
      } catch (linkError: any) {
        console.error(`[InsertUser] ⚠️ Erro ao criar vínculo user_customers:`, linkError);
        // Não bloquear criação do usuário se falhar o vínculo
      }
    }

    // Enviar email de boas-vindas (SÍNCRONO para garantir envio no serverless)
    try {
      console.log(`[InsertUser] 📧 Enviando email de boas-vindas para ${normalizedEmail}...`);
      const tenantData = await getTenantEmailData(idCustomer);
      console.log(`[InsertUser] 📧 Dados do tenant:`, {
        customerName: tenantData.customerName,
        hasLogo: !!tenantData.logo,
        link: tenantData.link
      });
      await sendWelcomePasswordEmail(
        normalizedEmail,
        finalPassword,
        tenantData.logo,
        tenantData.customerName,
        tenantData.link
      );
      console.log(`[InsertUser] ✅ Email enviado com sucesso para ${normalizedEmail}`);
    } catch (emailError: any) {
      console.error("[InsertUser] ❌ Erro ao enviar email:", emailError?.message || emailError);
      // Não bloqueia a criação do usuário se email falhar
    }

    // Sincronizar com outbank-one (em background, menos crítico)
    if (idCustomer) {
      void (async () => {
        try {
          const syncResult = await syncUserToOutbankOneClerk({
            email: normalizedEmail,
            firstName,
            lastName,
            password: finalPassword,
          });
          if (!syncResult.success) {
            console.warn(`[InsertUser] Falha na sincronizacao com outbank-one: ${syncResult.error}`);
          }
        } catch (syncError) {
          console.error("[InsertUser] Erro na sincronizacao:", syncError);
        }
      })();
    }

    return {
      ok: true,
      userId: created[0].id,
      reused: false
    };
  } catch (error: unknown) {
    console.error("Erro ao criar usuário:", error);

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
  return db.select().from(users).where(
    and(
      eq(users.idCustomer, customerId),
      or(eq(users.isInvisible, false), isNull(users.isInvisible)),
      eq(users.active, true)
    )
  );
}

export async function getUsersByCustomerId(customerId: number) {
  const dbUsers = await db
    .select({
      id: users.id,
      slug: users.slug,
      dtinsert: users.dtinsert,
      dtupdate: users.dtupdate,
      active: users.active,
      idClerk: users.idClerk,
      idCustomer: users.idCustomer,
      idProfile: users.idProfile,
      fullAccess: users.fullAccess,
      idAddress: users.idAddress,
      hashedPassword: users.hashedPassword,
      email: users.email,
      initialPassword: users.initialPassword,
      isInvisible: users.isInvisible,
      userType: users.userType,
      canViewSensitiveData: users.canViewSensitiveData,
      firstName: salesAgents.firstName,
      lastName: salesAgents.lastName,
    })
    .from(users)
    .leftJoin(salesAgents, eq(salesAgents.idUsers, users.id))
    .where(
      and(
        eq(users.idCustomer, customerId),
        or(eq(users.isInvisible, false), isNull(users.isInvisible)),
        eq(users.active, true)
      )
    );

  const result = dbUsers.map((user) => ({
    ...user,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
  }));

  return result;
}
