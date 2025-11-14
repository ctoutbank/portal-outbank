import { headers } from "next/headers";
import { requireTenantAccess } from "@/lib/subdomain-auth/guard";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default async function TenantDashboardPage() {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  
  const { user, tenant } = await requireTenantAccess(hostname);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            Bem-vindo ao Portal {tenant?.name || "ISO"}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Você está autenticado no portal do ISO.
          </p>
        </div>
        
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Informações do Portal</h2>
          <div className="space-y-2">
            <p><strong>Nome:</strong> {tenant?.name || "N/A"}</p>
            <p><strong>Subdomínio:</strong> {tenant?.slug || "N/A"}</p>
            <p><strong>URL:</strong> {hostname}</p>
            <p><strong>Email:</strong> {user?.email || "N/A"}</p>
            <p className="text-sm text-muted-foreground mt-4">
              Esta é a área privada do seu portal ISO. Em breve, mais funcionalidades estarão disponíveis aqui.
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <SignOutButton>
            <Button variant="outline">
              Fazer Logout
            </Button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
