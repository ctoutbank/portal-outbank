import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { getUserProfile, getUserPermissionsSummary } from "@/features/users/server/profile";
import { ProfilePage } from "@/features/users/_components/profile-page";
import { redirect } from "next/navigation";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const profile = await getUserProfile();
  const permissionsSummary = await getUserPermissionsSummary();

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

      <BaseBody
        title="Meu Perfil"
        subtitle="Gerencie suas informações pessoais e veja seus acessos"
      >
        <ProfilePage profile={profile} permissionsSummary={permissionsSummary} />
      </BaseBody>
    </>
  );
}

