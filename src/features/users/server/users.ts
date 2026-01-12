"use server";

import { hashPassword } from "@/app/utils/password";
import { sendWelcomePasswordEmail } from "@/lib/send-email";
import { generateSlug } from "@/lib/utils";
import { db } from "@/db/drizzle";
import { getCurrentUser } from "@/lib/auth";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";

const DEV_BYPASS_ENABLED =
  process.env.NODE_ENV === "development" &&
  process.env.DEV_BYPASS_AUTH === "true" &&
  !process.env.VERCEL;
import { revalidatePath } from "next/cache";
import {
  addresses,
  customers,
  merchants,
  profiles,
  salesAgents,
  userMerchants,
  users,
  customerCustomization,
  file,
} from "../../../../drizzle/schema";
import { AddressSchema } from "../schema/schema";
import { verifyPassword } from "@/lib/auth";

interface ClerkUserData {
  id: string;
  firstName?: string;
  lastName?: string;
  emailAddresses: Array<{
    emailAddress: string;
  }>;
}

interface ClerkError {
  code: string;
  message: string;
}

interface ClerkErrorResponse {
  status: number;
  errors: ClerkError[];
}

export type UserInsert = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  idCustomer?: number | null;
  idProfile?: number | null;
  idAddress?: number | null;
  selectedMerchants?: string[];
  fullAccess?: boolean;
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
  password: string;
  email: string;
  selectedMerchants?: string[];
  fullAccess: boolean;
  temporaryPassword: string | null;
  firstLogin: boolean | null;
  initialPassword: string | null;
}

export async function getUsers(
  email: string,
  firstName: string,
  lastName: string,
  profile: number,
  merchant: number,
  customer: number,
  page: number,
  pageSize: number
): Promise<UserList> {

  const offset = (page - 1) * pageSize;

  const conditions = [
    customer ? eq(users.idCustomer, customer) : undefined,
    profile ? eq(users.idProfile, profile) : undefined,
  ].filter(Boolean);

  // Filtrar por email se fornecido
  if (email && email.trim() !== "") {
    conditions.push(sql`${users.email} ILIKE ${'%' + email + '%'}`);
  }

  // First, get all users that match the conditions
  const userResults = await db
    .select({
      id: users.id,
      email: users.email,
      profileName: profiles.name,
      profileDescription: profiles.description,
      status: users.active,
      customerName: customers.name,
      idClerk: users.idClerk,
    })
    .from(users)
    .leftJoin(customers, eq(users.idCustomer, customers.id))
    .leftJoin(profiles, eq(users.idProfile, profiles.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(users.id))
    .limit(pageSize)
    .offset(offset);

  // Then, for each user, get their merchants
  const userObject = await Promise.all(
    userResults.map(async (dbUser) => {
      // Get user's merchants
      const userMerchantsList = await db
        .select({
          id: merchants.id,
          name: merchants.name,
        })
        .from(userMerchants)
        .leftJoin(merchants, eq(userMerchants.idMerchant, merchants.id))
        .where(eq(userMerchants.idUser, dbUser.id));

      const merchantsList = userMerchantsList.map((merchant) => ({
        id: merchant.id!,
        name: merchant.name,
      }));

      return {
        id: dbUser.id,
        firstName: "",
        lastName: "",
        email: dbUser.email || "",
        profileName: dbUser.profileName || "",
        profileDescription: dbUser.profileDescription || "",
        status: dbUser.status || true,
        customerName: dbUser.customerName || "",
        merchants: merchantsList,
        idClerk: dbUser.idClerk || "",
      };
    })
  );

  const totalCountResult = await db
    .select({ count: count() })
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const totalCount = totalCountResult[0]?.count || 0;
  return {
    userObject,
    totalCount,
  };
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

export async function InsertUser(data: UserInsert) {
  const fieldsToValidate: (keyof UserInsert)[] = [
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
    const password = data.password || await generateRandomPassword();
    const hashedPassword = hashPassword(password);

    const newUser = await db
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
        hashedPassword: hashedPassword,
        initialPassword: password,
        email: data.email,
      })
      .returning({ id: users.id });

    // ✅ Buscar dados do tenant para email de boas-vindas
    let customerName = "Outbank";
    let logo = "https://file-upload-outbank.s3.amazonaws.com/LUmLuBIG.jpg";
    let link: string | undefined = undefined;

    if (data.idCustomer) {
      try {
        const customization = await db
          .select({
            name: customers.name,
            slug: customerCustomization.slug,
            imageUrl: file.fileUrl,
            imageUrlDirect: customerCustomization.imageUrl,
          })
          .from(customers)
          .leftJoin(customerCustomization, eq(customerCustomization.customerId, customers.id))
          .leftJoin(file, eq(file.id, customerCustomization.fileId))
          .where(eq(customers.id, data.idCustomer))
          .limit(1);

        if (customization.length > 0) {
          const customData = customization[0];
          customerName = customData.name || "Outbank";
          logo = customData.imageUrl || customData.imageUrlDirect || logo;
          const slug = customData.slug;
          link = slug ? `https://${slug}.consolle.one` : undefined;
        }
      } catch (error) {
        console.error("[InsertUser] Erro ao buscar dados do tenant para email:", error);
      }
    }

    // ✅ Enviar email de boas-vindas com dados do tenant
    try {
      await sendWelcomePasswordEmail(
        data.email,
        password,
        logo,
        customerName,
        link
      );
      console.log("[InsertUser] ✅ Email de boas-vindas enviado", {
        email: data.email,
        customerName,
        hasLink: !!link,
      });
    } catch (emailError) {
      console.error("[InsertUser] ❌ Falha ao enviar email de boas-vindas (não crítico):", emailError);
      // Não bloquear criação do usuário se email falhar
    }

    // Insert user-merchant relationships if any merchants are selected
    if (data.selectedMerchants && data.selectedMerchants.length > 0) {
      const userMerchantValues = data.selectedMerchants.map((merchantId) => ({
        slug: generateSlug(),
        dtinsert: new Date().toISOString(),
        dtupdate: new Date().toISOString(),
        active: true,
        idUser: newUser[0].id,
        idMerchant: Number(merchantId),
      }));

      await db.insert(userMerchants).values(userMerchantValues);
    }

    revalidatePath("/portal/users");
    console.log("newUser", newUser);
    return newUser;
  } catch (error: unknown) {
    console.error("Erro ao criar usuário:", error);
    throw error;
  }
}

export async function updateUser(id: number, data: UserInsert) {
  if (!id) {
    throw new Error("ID do usuário é obrigatório");
  }

  const fieldsToValidate: (keyof UserInsert)[] = [
    "firstName",
    "lastName",
    "email",
    "idProfile",
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

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {
      idProfile: data.idProfile,
      idCustomer: data.idCustomer,
      idAddress: data.idAddress,
      dtupdate: new Date().toISOString(),
      fullAccess: data.fullAccess,
    };

    // Se senha foi fornecida, atualizar hash
    if (data.password) {
      updateData.hashedPassword = hashPassword(data.password);
      updateData.initialPassword = data.password;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id));

    // Update user-merchant relationships
    // First, delete existing relationships
    await db.delete(userMerchants).where(eq(userMerchants.idUser, id));

    // Then, insert new relationships if any merchants are selected
    if (data.selectedMerchants && data.selectedMerchants.length > 0) {
      const userMerchantValues = data.selectedMerchants.map((merchantId) => ({
        slug: generateSlug(),
        dtinsert: new Date().toISOString(),
        dtupdate: new Date().toISOString(),
        active: true,
        idUser: id,
        idMerchant: Number(merchantId),
      }));

      await db.insert(userMerchants).values(userMerchantValues);
    }

    revalidatePath("/portal/users");
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error;
  }
}

export async function getUserById(
  idClerk: string
): Promise<UserDetailForm | null> {

  const userDb = await db
    .select()
    .from(users)
    .where(eq(users.idClerk, idClerk));

  if (userDb == undefined || userDb == null || userDb[0] == undefined) {
    return null;
  } else {
    const userMerchantsList = await db
      .select({
        idMerchant: userMerchants.idMerchant,
      })
      .from(userMerchants)
      .where(eq(userMerchants.idUser, userDb[0].id));

    return {
      id: userDb[0].id,
      active: userDb[0].active,
      dtinsert: userDb[0].dtinsert,
      dtupdate: userDb[0].dtupdate,
      email: userDb[0].email || "",
      firstName: "",
      idClerk: userDb[0].idClerk,
      idCustomer: userDb[0].idCustomer,
      idProfile: userDb[0].idProfile,
      lastName: "",
      hashedPassword: userDb[0].hashedPassword,
      password: "",
      slug: userDb[0].slug,
      idAddress: userDb[0].idAddress,
      fullAccess: userDb[0].fullAccess || false,
      selectedMerchants: userMerchantsList.map(
        (um) => um.idMerchant?.toString() || ""
      ),
      temporaryPassword: "false",
      firstLogin: null,
      initialPassword: userDb[0].initialPassword,
      isInvisible: userDb[0].isInvisible,
      userType: userDb[0].userType,
      canViewSensitiveData: userDb[0].canViewSensitiveData || false,
      imageUrl: userDb[0].imageUrl || null,
    };
  }
}

export async function getDDProfiles(): Promise<DD[]> {

  const result = await db
    .select({ id: profiles.id, name: profiles.name })
    .from(profiles)
    .where(eq(profiles.active, true));
  return result as DD[];
}

export async function getDDMerchants(customerId?: number): Promise<DD[]> {


  if (customerId == undefined || customerId == null) {
    const sessionUser = await getCurrentUser();

    if (!sessionUser) {
      return [];
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, sessionUser.id));

    if (user && user.length > 0) {
      customerId = user[0].idCustomer || 0;
    }

    if (customerId == undefined || customerId == null) {
      return [];
    }
  }

  const conditions = [eq(merchants.idCustomer, customerId)];

  const merchantResult = await db
    .select({ id: merchants.id, name: merchants.name })
    .from(merchants)
    .where(and(...conditions));
  console.log(merchantResult);
  if (!merchantResult || merchantResult.length === 0) {
    return [];
  }

  return merchantResult.map((merchant) => ({
    ...merchant,
    name: merchant.name?.toUpperCase() ?? null,
  })) as DD[];
}

export async function getDDCustomers(): Promise<DD[]> {

  const result = await db
    .select({ id: customers.id, name: customers.name })
    .from(customers);
  return result as DD[];
}

export async function getUserGroupPermissions(
  userSlug: string,

): Promise<string[]> {
  try {
    const result = await db.execute(sql`
      SELECT DISTINCT f.name
      FROM users u
      JOIN profile_functions pf ON u.id_profile = pf.id_profile
      JOIN functions f ON pf.id_function = f.id
      WHERE u.slug = ${userSlug}
        AND pf.active = true
      ORDER BY f.name
    `);

    return result.rows.map((row: Record<string, unknown>) => row.name as string);
  } catch (error) {
    console.error("Error getting user group permissions:", error);
    return [];
  }
}

export async function validateCurrentPassword(
  currentPassword: string,
  userId: string
): Promise<boolean> {
  try {
    // Buscar usuário pelo id numérico ou idClerk
    const userResult = await db
      .select({ hashedPassword: users.hashedPassword })
      .from(users)
      .where(eq(users.id, parseInt(userId) || 0))
      .limit(1);

    if (!userResult || userResult.length === 0 || !userResult[0].hashedPassword) {
      return false;
    }

    return verifyPassword(currentPassword, userResult[0].hashedPassword);
  } catch (error) {
    console.error("Erro ao validar senha:", error);
    return false;
  }
}

export async function UpdateMyProfile(data: {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  idClerk: string;
}) {
  const fieldsToValidate = ["email"];

  const hasInvalidFields = fieldsToValidate.some((field) => {
    const value = data[field as keyof typeof data];
    return value === undefined || value === null || value.trim() === "";
  });

  if (hasInvalidFields) {
    throw new Error("Email é campo obrigatório");
  }

  try {
    // Buscar usuário pelo idClerk
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.idClerk, data.idClerk))
      .limit(1);

    if (!userResult || userResult.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    const updateData: Record<string, unknown> = {
      dtupdate: new Date().toISOString(),
    };

    // Se senha foi fornecida, atualizar hash
    if (data.password) {
      updateData.hashedPassword = hashPassword(data.password);
      updateData.initialPassword = data.password;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userResult[0].id));

    revalidatePath("/portal/myProfile");
    return true;
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    return false;
  }
}

export interface UserMerchantsAccess {
  fullAccess: boolean;
  idMerchants: number[];
  idCustomer?: number | null;
}

export interface UserMerchantSlugs {
  fullAccess: boolean;
  slugMerchants: string[];
}

export async function getUserMerchantsAccess(): Promise<UserMerchantsAccess> {
  try {
    if (DEV_BYPASS_ENABLED) {
      return {
        fullAccess: true,
        idMerchants: [],
        idCustomer: null,
      };
    }

    const sessionUser = await getCurrentUser();

    if (!sessionUser) {
      throw new Error("User not authenticated");
    }

    const user = await db
      .select({
        id: users.id,
        fullAccess: users.fullAccess,
        idCustomer: users.idCustomer,
      })
      .from(users)
      .where(eq(users.id, sessionUser.id));

    if (!user || user.length === 0) {
      throw new Error("User not found in database");
    }

    if (user[0].fullAccess) {
      return {
        fullAccess: true,
        idMerchants: [],
        idCustomer: user[0].idCustomer || null,
      };
    }

    type MerchantResult = { idMerchant: number | null };

    const merchantAccess = await db
      .select({
        idMerchant: userMerchants.idMerchant,
      })
      .from(userMerchants)
      .where(eq(userMerchants.idUser, user[0].id));

    return {
      fullAccess: user[0].fullAccess || false,
      idMerchants: (merchantAccess as MerchantResult[])
        .map((merchant) => merchant.idMerchant)
        .filter((id): id is number => id !== null),
      idCustomer: user[0].idCustomer || null,
    };
  } catch (error) {
    console.error("Erro ao obter acesso aos comerciantes do usuário:", error);
    throw error;
  }
}

export async function getUserMerchantSlugs(): Promise<UserMerchantSlugs> {
  if (DEV_BYPASS_ENABLED) {
    return {
      fullAccess: true,
      slugMerchants: [],
    };
  }

  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    throw new Error("User not authenticated");
  }

  const user = await db
    .select({
      id: users.id,
      fullAccess: users.fullAccess,
    })
    .from(users)
    .where(eq(users.id, sessionUser.id));

  if (!user || user.length === 0) {
    throw new Error("User not found in database");
  }
  if (user[0].fullAccess) {
    return {
      fullAccess: true,
      slugMerchants: [],
    };
  }

  const merchantAccess = await db
    .select({
      slugMerchant: merchants.slug,
    })
    .from(userMerchants)
    .leftJoin(merchants, eq(userMerchants.idMerchant, merchants.id))
    .where(eq(userMerchants.idUser, user[0].id));

  return {
    fullAccess: false,
    slugMerchants: merchantAccess
      .map((merchant) => merchant.slugMerchant)
      .filter((slug): slug is string => slug !== null),
  };
}

export async function getAddressById(id: number) {

  const result = await db.select().from(addresses).where(eq(addresses.id, id));

  if (!result || result.length === 0) {
    return null;
  }

  return {
    id: result[0].id,
    zipCode: result[0].zipCode,
    streetAddress: result[0].streetAddress,
    streetNumber: result[0].streetNumber,
    complement: result[0].complement,
    neighborhood: result[0].neighborhood,
    city: result[0].city,
    state: result[0].state,
    country: result[0].country,
  };
}

export async function insertAddressFormAction(data: AddressSchema) {
  const result = await db
    .insert(addresses)
    .values({
      zipCode: data.zipCode,
      streetAddress: data.streetAddress,
      streetNumber: data.streetNumber,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      country: data.country,
    })
    .returning({ id: addresses.id });

  return result[0].id;
}

export async function updateAddressFormAction(data: AddressSchema) {
  if (!data.id) {
    throw new Error("ID do endereço é obrigatório para atualização");
  }

  await db
    .update(addresses)
    .set({
      zipCode: data.zipCode,
      streetAddress: data.streetAddress,
      streetNumber: data.streetNumber,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      country: data.country,
    })
    .where(eq(addresses.id, data.id));

  return data.id;
}

export async function getProfileById(id: number) {

  const result = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      isSalesAgent: profiles.isSalesAgent,
    })
    .from(profiles)
    .where(eq(profiles.id, id));

  if (!result || result.length === 0) {
    return null;
  }

  return result[0];
}

export async function createSalesAgent(
  userId: number,
  firstName: string,
  lastName: string,
  email: string
) {
  try {

    const result = await db
      .insert(salesAgents)
      .values({
        slug: generateSlug(),
        firstName,
        lastName,
        email,
        active: true,
        dtinsert: new Date().toISOString(),
        dtupdate: new Date().toISOString(),
        idUsers: userId,
      })
      .returning({ id: salesAgents.id });

    return result[0].id;
  } catch (error) {
    console.error("Erro ao criar agente de vendas:", error);
    throw error;
  }
}
export async function getMerchantsWithDDD(): Promise<
  { area_code: string | null }[]
> {
  return db
    .select({
      area_code: merchants.areaCode,
    })
    .from(merchants);
}


