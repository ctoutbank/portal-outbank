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
