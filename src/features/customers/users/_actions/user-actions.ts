"use server";

import { hashPassword } from "@/app/utils/password";
import { db } from "@/db/drizzle";
import { generateSlug } from "@/lib/utils";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  adminCustomers,
  customerCustomization,
  customers,
  profiles,
  reportExecution,
  userMerchants,
  userNotifications,
  users,
} from "../../../../../drizzle/schema";

import { sendWelcomePasswordEmail } from "@/lib/send-email";
import { getCustomizationByCustomerId } from "@/utils/serverActions";
import { ilike } from "drizzle-orm";

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

export async function generateRandomPassword(length = 8) {
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

    if (!user || user.length === 0) {
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

    // Compor o objeto UserDetailForm usando dados do banco
    const userDetailForm: UserDetailForm = {
      ...user[0],
      firstName: user[0].slug?.split(" ")[0] || "",
      lastName: user[0].slug?.split(" ").slice(1).join(" ") || "",
      email: user[0].email || "",
      selectedMerchants,
      fullAccess: user[0].fullAccess || false,
    };

    return userDetailForm;
  } catch (error) {
    console.error("Erro ao buscar detalhes do usuário:", error);
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
  idProfile?: number;      // ← Novo: perfil opcional
  fullAccess?: boolean;    // ← Novo: acesso total opcional
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
      idProfile: providedIdProfile,    // ← Novo
      fullAccess: providedFullAccess,  // ← Novo
    } = data;

    const finalPassword =
      password && password.trim() !== ""
        ? password
        : await generateRandomPassword();

    // ✅ Validar que a senha tenha pelo menos 8 caracteres
    if (finalPassword.length < 8) {
      throw new Error("A senha deve ter pelo menos 8 caracteres.");
    }

    const hashedPwd = hashPassword(finalPassword);

    // Buscar perfil: se fornecido, usar; senão, buscar ADMIN como padrão
    let idProfile = providedIdProfile;
    let fullAccess = providedFullAccess ?? false;

    if (!idProfile) {
      // Se não forneceu perfil, busca ADMIN como padrão
      const adminProfile = await db
        .select()
        .from(profiles)
        .where(ilike(profiles.name, "%ADMIN%"))
        .limit(1)
        .execute();

      if (!adminProfile || adminProfile.length === 0) {
        throw new Error("Profile ADMIN não encontrado no banco.");
      }

      idProfile = adminProfile[0].id;
    }

    // Verificar se o email já existe para este ISO
    if (idCustomer) {
      const existingUser = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.email, email),
            eq(users.idCustomer, idCustomer)
          )
        )
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error("Usuário já existe com este email para este ISO");
      }
    } else {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error("Usuário já existe com este email");
      }
    }

    // Criação no banco
    const created = await db
      .insert(users)
      .values({
        slug: `${firstName} ${lastName}`,
        dtinsert: new Date().toISOString(),
        dtupdate: new Date().toISOString(),
        active,
        email,
        idCustomer: idCustomer ?? null,
        idClerk: null, // Não usa mais Clerk
        idProfile,
        idAddress: null,
        fullAccess,
        hashedPassword: hashedPwd,
        initialPassword: finalPassword,
      })
      .returning({ id: users.id });

    const domain = await getCustomizationByCustomerId(idCustomer ?? 0);

    // ✅ Buscar logo de email (emailImageUrl) ou logo padrão
    const logo =
      domain?.emailImageUrl ||
      domain?.imageUrl ||
      "https://file-upload-outbank.s3.amazonaws.com/LUmLuBIG.jpg";

    // ✅ Buscar nome do customer
    const customerData = await db
      .select({
        name: customers.name,
        slug: customerCustomization.slug,
      })
      .from(customers)
      .leftJoin(customerCustomization, eq(customerCustomization.customerId, customers.id))
      .where(eq(customers.id, idCustomer ?? 0))
      .limit(1);

    const customerName = customerData[0]?.name || domain?.slug || "Seu ISO";

    const linkSlug = domain?.slug || domain?.name;
    const link = linkSlug ? `https://${linkSlug}.consolle.one` : undefined;

    try {
      await sendWelcomePasswordEmail(
        email,
        finalPassword,
        logo,
        customerName,
        link
      );
      console.log("[InsertUser] Welcome email sent successfully", {
        to: email,
        logo,
        customerName,
        hasLink: !!link,
      });
    } catch (emailError) {
      console.error("[InsertUser] Failed to send welcome email:", emailError);
      console.error("[InsertUser] User created successfully but email failed. User can use 'Resend invite' action.");
    }

    return created[0].id;
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

    // Para outros erros, manter o comportamento original
    throw error;
  }
}

export async function getUsersWithClerk(customerId: number) {
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
    })
    .from(users)
    .where(
      and(
        eq(users.idCustomer, customerId),
        eq(users.isInvisible, false)
      )
    );

  const result = dbUsers.map((user) => {
    // Extrair firstName e lastName do slug
    const nameParts = (user.slug || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    return {
      ...user,
      firstName,
      lastName,
    };
  });

  return result;
}

export async function revealInitialPassword(userId: number): Promise<{
  success: boolean;
  password?: string;
  email?: string;
  error?: string;
}> {
  try {
    const existingUser = await db.select().from(users).where(eq(users.id, userId));

    if (!existingUser || existingUser.length === 0) {
      return { success: false, error: "Usuário não encontrado" };
    }

    const user = existingUser[0];

    if (!user.email) {
      return { success: false, error: "Usuário não possui email válido" };
    }

    if (!user.initialPassword) {
      return { 
        success: false, 
        error: "O usuário já alterou sua senha. A senha inicial não está mais disponível." 
      };
    }

    console.log("[revealInitialPassword] Password revealed successfully", {
      userId,
      email: user.email,
    });

    return {
      success: true,
      password: user.initialPassword,
      email: user.email,
    };
  } catch (error) {
    console.error("[revealInitialPassword] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao revelar senha",
    };
  }
}

export async function resendWelcomeEmail(userId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const existingUser = await db.select().from(users).where(eq(users.id, userId));

    if (!existingUser || existingUser.length === 0) {
      return { success: false, error: "Usuário não encontrado" };
    }

    const user = existingUser[0];

    if (!user.email || !user.hashedPassword || !user.idCustomer) {
      return { success: false, error: "Usuário não possui dados válidos" };
    }

    const domain = await getCustomizationByCustomerId(user.idCustomer);

    // ✅ Buscar logo de email (emailImageUrl) ou logo padrão
    const logo =
      domain?.emailImageUrl ||
      domain?.imageUrl ||
      "https://file-upload-outbank.s3.amazonaws.com/LUmLuBIG.jpg";

    // ✅ Buscar nome do customer
    const customerData = await db
      .select({
        name: customers.name,
        slug: customerCustomization.slug,
      })
      .from(customers)
      .leftJoin(customerCustomization, eq(customerCustomization.customerId, customers.id))
      .where(eq(customers.id, user.idCustomer))
      .limit(1);

    const customerName = customerData[0]?.name || domain?.slug || "Seu ISO";

    const linkSlug = domain?.slug || domain?.name;
    const link = linkSlug ? `https://${linkSlug}.consolle.one` : undefined;

    await sendWelcomePasswordEmail(
      user.email,
      "******",
      logo,
      customerName,
      link
    );

    console.log("[resendWelcomeEmail] Email resent successfully", {
      userId,
      email: user.email,
    });

    return { success: true };
  } catch (error) {
    console.error("[resendWelcomeEmail] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao reenviar email",
    };
  }
}

export async function deleteUser(id: number): Promise<boolean> {
  try {
    // Verificar se o usuário existe
    const existingUser = await db.select().from(users).where(eq(users.id, id));

    if (!existingUser || existingUser.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    // 1. Deletar relacionamentos primeiro (para evitar erro de foreign key)
    // 1.1. Deletar user_merchants
    try {
      await db.delete(userMerchants).where(eq(userMerchants.idUser, id));
      console.log(`[deleteUser] ✅ Relacionamentos user_merchants deletados para usuário ID: ${id}`);
    } catch (merchantError: any) {
      if (merchantError?.code !== '42P01' && !merchantError?.message?.includes('does not exist')) {
        console.warn(`[deleteUser] ⚠️ Aviso ao deletar relacionamentos user_merchants:`, merchantError);
      }
    }

    // 1.2. Deletar user_notifications
    try {
      await db.delete(userNotifications).where(eq(userNotifications.idUser, id));
      console.log(`[deleteUser] ✅ Notificações do usuário deletadas para usuário ID: ${id}`);
    } catch (notificationError: any) {
      if (notificationError?.code !== '42P01' && !notificationError?.message?.includes('does not exist')) {
        console.warn(`[deleteUser] ⚠️ Aviso ao deletar notificações do usuário:`, notificationError);
      }
    }

    // 1.3. Deletar admin_customers
    try {
      await db.delete(adminCustomers).where(eq(adminCustomers.idUser, id));
      console.log(`[deleteUser] ✅ Relacionamentos admin_customers deletados para usuário ID: ${id}`);
    } catch (adminCustomerError: any) {
      if (adminCustomerError?.code !== '42P01' && !adminCustomerError?.message?.includes('does not exist')) {
        console.warn(`[deleteUser] ⚠️ Aviso ao deletar relacionamentos admin_customers:`, adminCustomerError);
      }
    }

    // 1.4. Deletar report_execution
    try {
      await db.delete(reportExecution).where(eq(reportExecution.idUser, id));
      console.log(`[deleteUser] ✅ Execuções de relatório deletadas para usuário ID: ${id}`);
    } catch (reportError: any) {
      if (reportError?.code !== '42P01' && !reportError?.message?.includes('does not exist')) {
        console.warn(`[deleteUser] ⚠️ Aviso ao deletar execuções de relatório:`, reportError);
      }
    }

    // 2. Deletar do banco de dados
    await db.delete(users).where(eq(users.id, id));
    console.log(`[deleteUser] ✅ Usuário deletado do banco de dados: ID ${id}`);

    // 3. Revalidar caminhos relacionados
    revalidatePath("/customers");
    revalidatePath("/portal/users");

    return true;
  } catch (error: any) {
    console.error("[deleteUser] ❌ Erro ao excluir usuário:", error);
    
    // Verificar se é erro de foreign key constraint
    if (error?.code === '23503' || error?.message?.includes('foreign key constraint')) {
      throw new Error("Não é possível excluir este usuário pois ele possui relacionamentos com outros registros. Remova os relacionamentos primeiro.");
    }
    
    // Relançar o erro para que o componente possa tratá-lo
    throw error;
  }
}

/**
 * Reseta a senha de um usuário, atualizando no banco de dados
 * @param userId - ID do usuário no banco de dados
 * @returns Objeto com sucesso, nova senha e email do usuário
 */
export async function resetUserPassword(userId: number): Promise<{
  success: boolean;
  password?: string;
  email?: string;
  error?: string;
}> {
  try {
    console.log(`[resetUserPassword] Iniciando reset de senha para usuário ID: ${userId}`);

    // 1. Buscar usuário no banco de dados
    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        idCustomer: users.idCustomer,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      console.error(`[resetUserPassword] Usuário não encontrado: ${userId}`);
      return { success: false, error: "Usuário não encontrado" };
    }

    const user = userResult[0];

    if (!user.email) {
      console.error(`[resetUserPassword] Usuário não possui email: ${userId}`);
      return { success: false, error: "Usuário não possui email cadastrado" };
    }

    // 2. Gerar nova senha aleatória (mínimo 8 caracteres)
    const newPassword = await generateRandomPassword(10);
    console.log(`[resetUserPassword] Nova senha gerada com ${newPassword.length} caracteres`);

    // 3. Atualizar no banco de dados
    const hashedPwd = hashPassword(newPassword);
    await db
      .update(users)
      .set({
        initialPassword: newPassword,
        hashedPassword: hashedPwd,
        dtupdate: new Date().toISOString(),
      })
      .where(eq(users.id, userId));
    console.log(`[resetUserPassword] ✅ Senha atualizada no banco de dados para usuário ID: ${userId}`);

    // 4. Buscar dados do ISO para email
    let logo = "https://file-upload-outbank.s3.amazonaws.com/LUmLuBIG.jpg";
    let customerName = "Consolle";
    let link: string | undefined;

    if (user.idCustomer) {
      const domain = await getCustomizationByCustomerId(user.idCustomer);
      if (domain) {
        logo = domain.emailImageUrl || domain.imageUrl || logo;
        customerName = domain.name || domain.slug || customerName;
        if (domain.slug) {
          link = `https://${domain.slug}.consolle.one`;
        }
      }

      // Buscar nome do customer
      const customerData = await db
        .select({ name: customers.name })
        .from(customers)
        .where(eq(customers.id, user.idCustomer))
        .limit(1);

      if (customerData.length > 0 && customerData[0].name) {
        customerName = customerData[0].name;
      }
    }

    // 5. Enviar email com nova senha
    try {
      await sendWelcomePasswordEmail(
        user.email,
        newPassword,
        logo,
        customerName,
        link
      );
      console.log(`[resetUserPassword] ✅ Email enviado para: ${user.email}`);
    } catch (emailError) {
      console.error(`[resetUserPassword] ⚠️ Erro ao enviar email (senha já foi resetada):`, emailError);
      // Não falhar se email falhar - senha já foi resetada com sucesso
    }

    // 6. Revalidar caminhos
    revalidatePath("/customers");
    
    return {
      success: true,
      password: newPassword,
      email: user.email,
    };
  } catch (error: any) {
    console.error("[resetUserPassword] ❌ Erro ao resetar senha:", error);
    return {
      success: false,
      error: error?.message || "Erro ao resetar senha do usuário",
    };
  }
}
