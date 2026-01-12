import BaseHeader from "@/components/layout/base-header";
import BaseBody from "@/components/layout/base-body";
import { getPendingConsentNotifications } from "@/features/consent/server/module-notifications";
import { getPendingModules } from "@/features/consent/server/pending-modules";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import PendingConsentModulesList from "@/features/consent/components/pending-consent-modules-list";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ConsentModulesPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const userId = user.id;

  if (!userId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Usuário não encontrado</h2>
          <p className="text-muted-foreground">
            Seu usuário não foi encontrado no sistema. Por favor, entre em contato com o administrador.
          </p>
        </div>
      </div>
    );
  }

  // Buscar notificações pendentes
  const notifications = await getPendingConsentNotifications(userId);
  
  // Buscar módulos pendentes de consentimento
  const pendingModules = await getPendingModules(userId);

  return (
    <>
      <BaseHeader
        breadcrumbItems={[
          { title: "Consentimento LGPD", subtitle: "" },
        ]}
        showBackButton={true}
        backHref="/"
      />
      <BaseBody
        title="Consentimento LGPD - Módulos Pendentes"
        subtitle="Você precisa dar seu consentimento LGPD para usar estes módulos"
      >
        <PendingConsentModulesList
          notifications={notifications}
          pendingModules={pendingModules}
        />
      </BaseBody>
    </>
  );
}
