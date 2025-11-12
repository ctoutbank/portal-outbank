import { db } from "@/db/drizzle";
import { customers, customerCustomization, merchants } from "../../../drizzle/schema";
import { count, eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Building2, Users, Store, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

async function getAdminStats() {
  try {
    // Conta Tenants
    const tenantsResult = await db
      .select({ count: count() })
      .from(customerCustomization);
    
    // Conta ISOs ativos
    const isosResult = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.isActive, true));
    
    // Conta Merchants ativos
    const merchantsResult = await db
      .select({ count: count() })
      .from(merchants)
      .where(eq(merchants.active, true));
    
    return {
      tenants: Number(tenantsResult[0]?.count || 0),
      isos: Number(isosResult[0]?.count || 0),
      merchants: Number(merchantsResult[0]?.count || 0),
    };
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return {
      tenants: 0,
      isos: 0,
      merchants: 0,
    };
  }
}

export default async function AdminPage() {
  const stats = await getAdminStats();
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de gestão de tenants e adquirência
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Card de Tenants */}
        <Link href="/admin/tenants">
          <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tenants de Adquirência
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.tenants}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Empresas de adquirência cadastradas
              </p>
              <div className="flex items-center text-xs text-primary mt-3">
                Ver detalhes
                <ChevronRight className="h-3 w-3 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card de ISOs */}
        <Link href="/admin/isos">
          <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                ISOs (Independent Sales Organizations)
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.isos}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Parceiros ativos no sistema
              </p>
              <div className="flex items-center text-xs text-primary mt-3">
                Ver detalhes
                <ChevronRight className="h-3 w-3 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card de Estabelecimentos */}
        <Link href="/customers">
          <Card className="cursor-pointer transition-all hover:shadow-lg hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Estabelecimentos (Merchants)
              </CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.merchants}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Estabelecimentos ativos
              </p>
              <div className="flex items-center text-xs text-primary mt-3">
                Ver detalhes
                <ChevronRight className="h-3 w-3 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Seção de Informações */}
      <Card>
        <CardHeader>
          <CardTitle>Estrutura do Sistema</CardTitle>
          <CardDescription>
            Entenda a hierarquia e relacionamento entre as entidades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <Building2 className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold">Tenants</h3>
              <p className="text-sm text-muted-foreground">
                Representam empresas de adquirência com personalização própria (cores, logos, domínio).
                Cada tenant é uma instância isolada do sistema.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Users className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold">ISOs</h3>
              <p className="text-sm text-muted-foreground">
                Independent Sales Organizations são parceiros que vendem serviços de adquirência.
                Fazem a ponte entre o tenant e os estabelecimentos.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Store className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold">Estabelecimentos</h3>
              <p className="text-sm text-muted-foreground">
                Clientes finais que aceitam pagamentos. Podem ser lojas físicas, e-commerces ou prestadores de serviço.
                São vinculados a um ISO e processam transações.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
