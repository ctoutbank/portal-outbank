import { headers } from "next/headers";

/**
 * Detecta se o hostname atual é um satellite domain (subdomínio do consolle.one)
 * ou o domínio principal (portal-outbank.vercel.app)
 */
export async function getClerkDomainConfig() {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";

  const isSatellite = hostname.endsWith(".consolle.one") && hostname !== "consolle.one";

  return {
    isSatellite,
    domain: isSatellite ? "consolle.one" : undefined,
  };
}

/**
 * Extrai o subdomínio do hostname
 */
export function extractSubdomain(hostname: string): string | null {
  if (!hostname.endsWith(".consolle.one")) {
    return null;
  }

  const parts = hostname.split(".");
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}
