import slugifyLib from "slugify";

/**
 * Reserved subdomain names that should not be used
 */
const RESERVED_SUBDOMAINS = [
  "www",
  "api",
  "auth",
  "admin",
  "static",
  "assets",
  "cdn",
  "docs",
  "support",
  "vercel",
  "app",
  "portal",
  "console",
  "dashboard",
];

/**
 * Maximum length for a DNS label (subdomain)
 */
const MAX_LABEL_LENGTH = 63;

/**
 * Generate a URL-safe slug from a string
 * 
 * @param text - The text to slugify
 * @param options - Optional configuration
 * @returns A URL-safe slug
 */
export function generateSlug(
  text: string,
  options: {
    fallbackPrefix?: string;
    fallbackId?: number | string;
  } = {}
): string {
  const { fallbackPrefix = "iso", fallbackId } = options;

  let slug = slugifyLib(text, {
    lower: true,
    strict: true,
    locale: "pt",
    replacement: "-",
    remove: /[*+~.()'"!:@]/g,
  });

  slug = slug.replace(/-+/g, "-");

  slug = slug.replace(/^-+|-+$/g, "");

  if (!slug || slug.length === 0) {
    slug = fallbackId ? `${fallbackPrefix}-${fallbackId}` : fallbackPrefix;
  }

  if (RESERVED_SUBDOMAINS.includes(slug)) {
    slug = fallbackId ? `${slug}-${fallbackId}` : `${slug}-custom`;
  }

  if (slug.length > MAX_LABEL_LENGTH - 4) {
    slug = slug.substring(0, MAX_LABEL_LENGTH - 4);
    slug = slug.replace(/-+$/, "");
  }

  return slug;
}

/**
 * Generate a unique slug by checking against existing slugs
 * 
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Set of existing slugs to check against
 * @param maxAttempts - Maximum number of attempts to find a unique slug
 * @returns A unique slug
 */
export function makeSlugUnique(
  baseSlug: string,
  existingSlugs: Set<string>,
  maxAttempts: number = 1000
): { slug: string; collisionCount: number } {
  let slug = baseSlug;
  let collisionCount = 0;

  if (!existingSlugs.has(slug.toLowerCase())) {
    return { slug, collisionCount: 0 };
  }

  for (let i = 2; i <= maxAttempts; i++) {
    collisionCount++;
    const suffix = `-${i}`;
    
    let candidateBase = baseSlug;
    if (baseSlug.length + suffix.length > MAX_LABEL_LENGTH) {
      candidateBase = baseSlug.substring(0, MAX_LABEL_LENGTH - suffix.length);
      candidateBase = candidateBase.replace(/-+$/, "");
    }
    
    slug = `${candidateBase}${suffix}`;
    
    if (!existingSlugs.has(slug.toLowerCase())) {
      return { slug, collisionCount };
    }
  }

  throw new Error(
    `Could not generate unique slug for "${baseSlug}" after ${maxAttempts} attempts`
  );
}

/**
 * Check if a string looks like a 32-character hex hash
 */
export function isHashLikeSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return /^[A-Fa-f0-9]{32}$/.test(slug);
}
