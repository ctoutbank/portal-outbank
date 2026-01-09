import { getCurrentUser } from "@/lib/auth";
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
  const sessionUser = await getCurrentUser();
  
  if (!sessionUser) {
    redirect("/auth/sign-in");
  }

  const email = sessionUser.email;

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
