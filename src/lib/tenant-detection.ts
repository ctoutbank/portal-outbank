import { headers } from "next/headers";
import { getCustomizationBySubdomain } from "../utils/serverActions";

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
    
    const customization = await getCustomizationBySubdomain(subdomain);
    return customization;
  } catch (error) {
    console.error("Error detecting tenant:", error);
    return null;
  }
}
