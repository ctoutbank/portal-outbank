import BaseHeader from "@/components/layout/base-header";
import BaseBody from "@/components/layout/base-body";
import ConsentHistoryList from "@/features/consent/components/consent-history-list";
import { getUserConsentHistory } from "@/features/consent/server/consent-history";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ConsentHistoryPage() {
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

  // Buscar histórico de consentimentos do usuário
  const history = await getUserConsentHistory(userId);

  return (
    <>
      <BaseHeader
        breadcrumbItems={[
          { title: "Consentimento LGPD", url: "/consent/modules" },
          { title: "Histórico" },
        ]}
        showBackButton={true}
        backHref="/consent/modules"
      />
      <BaseBody
        title="Histórico de Consentimentos LGPD"
        subtitle="Visualize todos os consentimentos e revogações de módulos"
      >
        <ConsentHistoryList history={history} userId={userId} />
      </BaseBody>
    </>
  );
}

