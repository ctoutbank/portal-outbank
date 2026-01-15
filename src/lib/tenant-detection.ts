import { headers } from "next/headers";
import { getCustomizationBySubdomain } from "../utils/serverActions";
import { unstable_cache } from "next/cache";

const getCachedCustomization = unstable_cache(
  async (subdomain: string) => {
    return getCustomizationBySubdomain(subdomain);
  },
  ['tenant-customization'],
  { revalidate: 3600, tags: ['theme'] }
);

export async function getCurrentTenantCustomization() {
  try {
    if (typeof window !== 'undefined') {
      const host = window.location.host;
      const subdomain = host.split('.')[0];

      if (subdomain === 'consolle' || subdomain === 'localhost' || host.includes('localhost')) {
        return null;
      }

      return null;
    }

    let host = '';
    try {
      const headersList = await headers();
      host = headersList.get('host') || '';
    } catch {
      return null;
    }

    const subdomain = host.split('.')[0];

    if (subdomain === 'consolle' || subdomain === 'localhost' || host.includes('localhost')) {
      return null;
    }

    const customization = await getCachedCustomization(subdomain);
    return customization;
  } catch (error) {
    console.error("Error detecting tenant:", error);
    return null;
  }
}
