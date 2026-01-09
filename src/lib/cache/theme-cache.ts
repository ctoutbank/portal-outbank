import { db, customerCustomization, customers, file } from "@/lib/db";
import { eq } from "drizzle-orm";
import { cache } from "react";

export type ThemeData = {
  primary: string;
  secondary: string;
  imageUrl: string;
  loginImageUrl: string;
  faviconUrl: string;
  emailImageUrl: string;
  slug: string;
  name: string;
};

async function fetchThemeByTenant(slug: string): Promise<ThemeData | null> {
  const startTime = Date.now();
  console.log(`[getThemeByTenant] Fetching theme for slug: ${slug}`);
  
  const result = await db
    .select({
      primaryColor: customerCustomization.primaryColor,
      secondaryColor: customerCustomization.secondaryColor,
      imageUrl: customerCustomization.imageUrl,
      loginImageUrl: customerCustomization.loginImageUrl,
      faviconUrl: customerCustomization.faviconUrl,
      emailImageUrl: customerCustomization.emailImageUrl,
      fileUrl: file.fileUrl,
      slug: customerCustomization.slug,
      name: customers.name,
    })
    .from(customerCustomization)
    .leftJoin(file, eq(customerCustomization.fileId, file.id))
    .innerJoin(customers, eq(customerCustomization.customerId, customers.id))
    .where(eq(customerCustomization.slug, slug))
    .limit(1);
  
  const duration = Date.now() - startTime;
  
  if (result.length === 0) {
    console.log(`[getThemeByTenant] Theme not found for slug: ${slug} (${duration}ms)`);
    return null;
  }

  const tenant = result[0];
  console.log(`[getThemeByTenant] Theme fetched successfully for slug: ${slug} (${duration}ms)`);

  return {
    primary: tenant.primaryColor || "0 84% 60%",
    secondary: tenant.secondaryColor || "0 0% 10%",
    imageUrl: tenant.imageUrl || tenant.fileUrl || "",
    loginImageUrl: tenant.loginImageUrl || tenant.imageUrl || "/bg_login.jpeg",
    faviconUrl: tenant.faviconUrl || "",
    emailImageUrl: tenant.emailImageUrl || "",
    slug: tenant.slug || "",
    name: tenant.name || "",
  };
}

export const getThemeByTenant = cache(fetchThemeByTenant);

export async function getNameByTenant(slug: string) {
  const result = await db
    .select()
    .from(customerCustomization)
    .where(eq(customerCustomization.slug, slug))
    .limit(1);
    
  if (result.length === 0) return null;

  return {
    slug: slug,
  };
}
