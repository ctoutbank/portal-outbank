import { headers } from "next/headers";
import { requireTenantAccess } from "@/lib/subdomain-auth/guard";
import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";
import { TableProperties, Users } from "lucide-react";

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
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/tenant/tabelas-mdr" className="group">
            <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm hover:border-primary hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                  <TableProperties className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Tabelas MDR</h3>
                  <p className="text-sm text-muted-foreground">
                    Gerencie as taxas e margens MDR
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/tenant/usuarios" className="group">
            <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm hover:border-primary hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Usuários</h3>
                  <p className="text-sm text-muted-foreground">
                    Gerencie os usuários do ISO
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="flex justify-center">
          <LogoutButton variant="outline" />
        </div>
      </div>
    </div>
  );
}
