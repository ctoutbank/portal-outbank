export { validateUserAccessBySubdomain } from "./domain";

/**
 * Extract subdomain from hostname
 * @param hostname - The hostname from request headers
 * @returns The subdomain or null if not a valid tenant subdomain
 */
export function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split(".");
  
  if (parts.length >= 3) {
    const subdomain = parts[0];
    
    if (["www", "lvh", "localhost"].includes(subdomain)) {
      return null;
    }
    
    return subdomain;
  }
  
  return null;
}

/**
 * Check if the hostname is a tenant subdomain
 * @param hostname - The hostname from request headers
 * @returns true if this is a tenant subdomain (*.consolle.one)
 */
export function isTenantHost(hostname: string): boolean {
  return extractSubdomain(hostname) !== null;
}
