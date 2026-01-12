import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { getUserProfile, getUserPermissionsSummary } from "@/features/users/server/profile";
import { ProfilePage } from "@/features/users/_components/profile-page";
import { redirect } from "next/navigation";
import { getPortalSettings } from "@/lib/portal-settings";
import { db, customers } from "@/lib/db";
import { count, eq } from "drizzle-orm";

export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getTotalActiveIsos(): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.isActive, true));
    return result[0]?.count || 0;
  } catch (error) {
    console.error("[getTotalActiveIsos] Error:", error);
    return 0;
  }
}

export default async function AccountPage() {
  const [profile, permissionsSummary, portalSettings, totalIsos] = await Promise.all([
    getUserProfile(),
    getUserPermissionsSummary(),
    getPortalSettings(),
    getTotalActiveIsos(),
  ]);

  if (!profile) {
    redirect("/sign-in");
  }

  return (
    <>
      <BaseHeader
        breadcrumbItems={[
          { title: "Meu Perfil", subtitle: "Conta", url: "/account" },
        ]}
      />

      <BaseBody>
        <ProfilePage 
          profile={profile} 
          permissionsSummary={permissionsSummary}
          portalLogoUrl={portalSettings?.logo_url}
          totalIsosInSystem={totalIsos}
        />
      </BaseBody>
    </>
  );
}
