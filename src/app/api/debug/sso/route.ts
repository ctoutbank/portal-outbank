import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, customers, customerCustomization } from "@/lib/db";
import { eq } from "drizzle-orm";
import { extractSubdomain } from "@/lib/subdomain-auth";

/**
 * Endpoint de debug para diagnosticar problemas do SSO
 * Apenas para desenvolvimento - remover ou proteger em produção
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    const clerkUser = await currentUser();
    const userInfo = await getCurrentUserInfo();
    const hostname = request.headers.get("host") || "";
    const subdomain = extractSubdomain(hostname);

    // Informações básicas
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      hostname,
      subdomain,
      clerk: {
        authenticated: !!clerkUserId,
        userId: clerkUserId || null,
        email: clerkUser?.emailAddresses[0]?.emailAddress || null,
      },
      userInfo: userInfo
        ? {
            id: userInfo.id,
            email: userInfo.email,
            idCustomer: userInfo.idCustomer,
            isSuperAdmin: userInfo.isSuperAdmin,
            isAdmin: userInfo.isAdmin,
            allowedCustomers: userInfo.allowedCustomers,
            profileName: userInfo.profileName,
          }
        : null,
    };

    // Se houver usuário, buscar informações adicionais
    if (userInfo?.id) {
      const userDb = await db
        .select({
          id: users.id,
          idClerk: users.idClerk,
          email: users.email,
          idCustomer: users.idCustomer,
          active: users.active,
        })
        .from(users)
        .where(eq(users.id, userInfo.id))
        .limit(1);

      if (userDb.length > 0) {
        debugInfo.userDb = userDb[0];

        // Buscar informações do customer
        if (userDb[0].idCustomer) {
          const customer = await db
            .select({
              id: customers.id,
              name: customers.name,
              slug: customers.slug,
            })
            .from(customers)
            .where(eq(customers.id, userDb[0].idCustomer))
            .limit(1);

          if (customer.length > 0) {
            debugInfo.customer = customer[0];

            // Buscar customization
            const customization = await db
              .select({
                id: customerCustomization.id,
                slug: customerCustomization.slug,
                customerId: customerCustomization.customerId,
              })
              .from(customerCustomization)
              .where(eq(customerCustomization.customerId, customer[0].id))
              .limit(1);

            if (customization.length > 0) {
              debugInfo.customization = customization[0];
            }
          }
        }
      }
    }

    // Verificar validação de subdomínio se houver
    if (subdomain && userInfo?.email) {
      try {
        const { validateUserAccessBySubdomain } = await import(
          "@/lib/subdomain-auth/domain"
        );
        const validation = await validateUserAccessBySubdomain(
          userInfo.email,
          subdomain
        );
        debugInfo.subdomainValidation = validation;
      } catch (error: any) {
        debugInfo.subdomainValidationError = error.message;
      }
    }

    return NextResponse.json(debugInfo, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Erro ao obter informações de debug",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

