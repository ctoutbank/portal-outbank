import { db, customerCustomization, customers, file } from "@/lib/db";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

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

const getThemeCached = unstable_cache(
  async (slug: string): Promise<ThemeData | null> => {
    const startTime = Date.now();

    // Pequena verificação para evitar cache de slugs inválidos/vazios
    if (!slug || slug === "null" || slug === "undefined") return null;

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
      return null;
    }

    const tenant = result[0];

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
  },
  ['get-theme-by-tenant'],
  { revalidate: 3600, tags: ['theme'] }
);

export const getThemeByTenant = getThemeCached;

const getNameCached = unstable_cache(
  async (slug: string) => {
    // Evitar query desnecessária
    if (!slug || slug === "null" || slug === "undefined") return null;

    const result = await db
      .select({ slug: customerCustomization.slug })
      .from(customerCustomization)
      .where(eq(customerCustomization.slug, slug))
      .limit(1);

    if (result.length === 0) return null;

    return {
      slug: slug,
    };
  },
  ['get-name-by-tenant'],
  { revalidate: 3600, tags: ['theme'] }
);

export const getNameByTenant = getNameCached;
