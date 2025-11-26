import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { validateUserAccessBySubdomain } from "./domain";
import { extractSubdomain } from "./index";

/**
 * Server-side authorization guard for tenant routes
 * Validates that the authenticated user has access to the current tenant subdomain
 * @param hostname - The hostname from request headers
 * @throws Redirects to /unauthorized if user doesn't have access
 */
export async function requireTenantAccess(hostname: string) {
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId;
  } catch (error) {
    console.error("Error calling auth() in requireTenantAccess:", error);
    redirect("/auth/sign-in");
  }
  
  if (!userId) {
    redirect("/auth/sign-in");
  }

  let user;
  try {
    user = await currentUser();
  } catch (error) {
    console.error("Error calling currentUser() in requireTenantAccess:", error);
    redirect("/unauthorized");
  }
  
  const email = user?.emailAddresses[0]?.emailAddress;

  if (!email) {
    redirect("/unauthorized");
  }

  const subdomain = extractSubdomain(hostname);

  if (!subdomain) {
    redirect("/unauthorized");
  }

  const validation = await validateUserAccessBySubdomain(email, subdomain);

  if (!validation.authorized) {
    redirect("/unauthorized");
  }

  return {
    user: validation.user,
    tenant: validation.tenant,
  };
}
