import { headers } from "next/headers";
import { getCustomizationBySubdomain } from "../utils/serverActions";

export async function getCurrentTenantCustomization() {
  try {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    
    const subdomain = host.split('.')[0];
    
    if (subdomain === 'consolle' || subdomain === 'localhost' || host.includes('localhost')) {
      return null;
    }
    
    const customization = await getCustomizationBySubdomain(subdomain);
    return customization;
  } catch (error) {
    console.error("Error detecting tenant:", error);
    return null;
  }
}
