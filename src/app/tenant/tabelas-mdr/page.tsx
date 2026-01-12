import { headers } from "next/headers";
import { requireTenantAccess } from "@/lib/subdomain-auth/guard";
import { LogoutButton } from "@/components/logout-button";
import { TenantMdrTablesClient } from "./_components/tenant-mdr-tables-client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function TenantTabelasMdrPage() {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  
  const { user, tenant } = await requireTenantAccess(hostname);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/tenant/dashboard" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Tabelas MDR</h1>
              <p className="text-muted-foreground">
                Gerencie as taxas MDR do {tenant?.name || "ISO"}
              </p>
            </div>
          </div>
          <LogoutButton variant="outline" />
        </div>

        <TenantMdrTablesClient 
          tenantName={tenant?.name || "ISO"}
        />
      </div>
    </div>
  );
}
