import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { TenantSignInForm } from "@/components/auth/tenant-sign-in-form";
import { getCurrentTenantCustomization } from "@/lib/tenant-detection";

export default async function TenantSignInPage() {
  const user = await getCurrentUser();
  
  if (user) {
    redirect("/dashboard");
  }

  const customization = await getCurrentTenantCustomization();
  const tenantName = customization?.name || "Consolle";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--tenant-login-title, #ffffff)' }}
          >
            {tenantName}
          </h1>
          <p 
            className="text-sm"
            style={{ color: 'var(--tenant-login-text, #d1d5db)' }}
          >
            Acesse sua conta
          </p>
        </div>
        <TenantSignInForm />
      </div>
    </div>
  );
}
