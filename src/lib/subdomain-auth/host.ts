/**
 * Edge-safe hostname utilities for subdomain detection
 * This file contains ONLY pure string manipulation functions
 * and does NOT import any server-only modules (db, drizzle, etc.)
 */

const BASE_DOMAIN = "consolle.one";

/**
 * Extract subdomain from hostname
 * @param hostname - The hostname from request headers
 * @returns The subdomain or null if not a valid tenant subdomain
 */
export function extractSubdomain(hostname: string): string | null {
  if (!hostname.endsWith(`.${BASE_DOMAIN}`)) {
    return null;
  }
  
  const subdomain = hostname.slice(0, -(`.${BASE_DOMAIN}`.length));
  
  if (["www", "lvh", "localhost"].includes(subdomain)) {
    return null;
  }
  
  return subdomain;
}

/**
 * Check if the hostname is a tenant subdomain
 * @param hostname - The hostname from request headers
 * @returns true if this is a tenant subdomain (*.consolle.one)
 */
export function isTenantHost(hostname: string): boolean {
  return hostname.endsWith(`.${BASE_DOMAIN}`) && extractSubdomain(hostname) !== null;
}
