import { headers } from "next/headers";
import { getCustomizationBySubdomain } from "../utils/serverActions";

export async function getCurrentTenantCustomization() {
  try {
    if (typeof window !== 'undefined') {
      return null;
    }
    
    let host = '';
    try {
      const headersList = await headers();
      host = headersList.get('host') || '';
    } catch {
      return null;
    }
    
    if (!host || host.includes('localhost') || host.includes('127.0.0.1')) {
      return null;
    }
    
    const subdomain = host.split('.')[0];
    
    if (subdomain === 'consolle' || subdomain === 'portal-outbank') {
      return null;
    }
    
    const customization = await getCustomizationBySubdomain(subdomain);
    return customization;
  } catch (error) {
    console.error("Error detecting tenant:", error);
    return null;
  }
}
