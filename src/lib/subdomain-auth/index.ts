/**
 * Main export file for subdomain authentication utilities
 * 
 * IMPORTANT: This file re-exports server-only functions that import the database.
 * DO NOT import this file in Edge middleware or other Edge runtime code.
 * 
 * For Edge-safe hostname utilities, import from "./host" instead.
 */

export { validateUserAccessBySubdomain } from "./domain";
export { extractSubdomain, isTenantHost } from "./host";
