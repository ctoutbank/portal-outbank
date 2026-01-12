import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/permissions/require-super-admin";
import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { DesignSettingsForm } from "./_components/design-settings-form";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function DesignSettingsPage() {
  try {
    await requireSuperAdmin();
    
    return (
      <>
        <BaseHeader 
          breadcrumbItems={[
            { title: "Configurações", url: "/config" },
            { title: "Design Settings" }
          ]} 
          showBackButton={true} 
          backHref="/config" 
        />

        <BaseBody title="Design Settings" subtitle="Personalize a aparência do Portal">
          <DesignSettingsForm />
        </BaseBody>
      </>
    );
  } catch (error) {
    console.error("Error in DesignSettingsPage:", error);
    redirect("/unauthorized");
  }
}
