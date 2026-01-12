import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import BaseHeader from "@/components/layout/base-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { db } from "@/lib/db";
import { users, profiles } from "@/lib/db";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    redirect("/auth/sign-in");
  }

  const userResult = await db
    .select({
      id: users.id,
      email: users.email,
      profileName: profiles.name,
      active: users.active,
    })
    .from(users)
    .leftJoin(profiles, eq(users.idProfile, profiles.id))
    .where(eq(users.id, sessionUser.id))
    .limit(1);

  const userData = userResult[0];

  if (!userData) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <BaseHeader
        breadcrumbItems={[{ title: "Meu Perfil" }]}
        showBackButton
      />

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <ProfileForm
          email={userData.email || ""}
          profileName={userData.profileName || "Usuário"}
        />
      </main>
    </div>
  );
}
