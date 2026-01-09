import BaseHeader from "@/components/layout/base-header";
import BaseBody from "@/components/layout/base-body";
import ModuleConsentForm from "@/features/consent/components/module-consent-form";
import { getModuleConsentDetails } from "@/features/consent/server/module-consent-details";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<{ merchant?: string }>;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function ConsentModuleContent({
  moduleId,
  merchantId,
}: {
  moduleId: number;
  merchantId?: number;
}) {
  const sessionUser = await getCurrentUser();
  
  if (!sessionUser) {
    redirect("/sign-in");
  }

  const userEmail = sessionUser.email;
  
  if (!userEmail) {
    redirect("/sign-in");
  }

  // Buscar user_id no banco
  const userRecord = await db
    .select()
    .from(users)
    .where(eq(users.email, userEmail))
    .limit(1);

  const userId = userRecord[0]?.id;

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

  // Buscar detalhes do módulo e merchant
  const details = await getModuleConsentDetails(moduleId, merchantId, userId);

  if (!details) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Módulo não encontrado</h2>
          <p className="text-muted-foreground">
            O módulo solicitado não foi encontrado ou você não tem permissão para acessá-lo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ModuleConsentForm
      moduleId={moduleId}
      merchantId={details.merchantId}
      moduleName={details.moduleName || ""}
      moduleSlug={details.moduleSlug || ""}
      merchantName={details.merchantName || ""}
      alreadyConsented={details.alreadyConsented}
    />
  );
}

export default async function ConsentModulePage({ params, searchParams }: PageProps) {
  const { moduleId } = await params;
  const { merchant } = await searchParams;
  
  const moduleIdNum = parseInt(moduleId, 10);
  const merchantId = merchant ? parseInt(merchant, 10) : undefined;

  if (isNaN(moduleIdNum)) {
    redirect("/consent/modules");
  }

  return (
    <>
      <BaseHeader
        breadcrumbItems={[
          { title: "Consentimento LGPD", subtitle: "", url: "/consent/modules" },
          { title: "Dar Consentimento", subtitle: "" },
        ]}
      />
      <BaseBody
        title="Consentimento LGPD - Módulo"
        subtitle="Leia atentamente e dê seu consentimento para usar este módulo"
      >
        <Suspense fallback={<div>Carregando...</div>}>
          <ConsentModuleContent
            moduleId={moduleIdNum}
            merchantId={merchantId}
          />
        </Suspense>
      </BaseBody>
    </>
  );
}
