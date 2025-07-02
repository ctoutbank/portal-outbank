"use server";

import { db } from "@/db/drizzle";
import { clerkClient } from "@clerk/nextjs/server";
import { generateSlug } from "@/lib/utils";
import { hashPassword } from "@/app/utils/password";
import { generateRandomPassword } from "@/features/customers/users/server/users";
import { sendWelcomePasswordEmail } from "@/lib/send-email";
import { users, profiles } from "../../../../../drizzle/schema";
import {eq, ilike} from "drizzle-orm";



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

    const finalPassword = password && password.trim() !== ""
        ? password
        : await generateRandomPassword();

    const hashedPassword = hashPassword(finalPassword);

    // Buscar o profile ADMIN dinamicamente
    const adminProfile = await db
        .select()
        .from(profiles)
        .where(ilike(profiles.name, "%ADMIN%" ))
        .limit(1)
        .execute();

    if (!adminProfile || adminProfile.length === 0) {
        throw new Error("Profile ADMIN não encontrado no banco.");
    }

    const idProfile = adminProfile[0].id;

    // Criação no Clerk
    const clerk = await clerkClient();  // chamar a função e obter o cliente
    const clerkUser = await clerk.users.createUser({        firstName,
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
            idProfile,  // aqui usa o idProfile dinâmico
            idAddress: null,
            fullAccess: false,
            hashedPassword,
        })
        .returning({ id: users.id });

    await sendWelcomePasswordEmail(email, finalPassword);

    return created[0].id;
}


export async function getUsersByCustomer(customerId: number) {
    return db
        .select()
        .from(users)
        .where(eq(users.idCustomer, customerId));
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
                    const clerkUser = await (await clerkClient()).users.getUser(user.idClerk);
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