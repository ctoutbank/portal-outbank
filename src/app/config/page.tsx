import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/permissions/require-admin";
import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function ConfigPage() {
  try {
    // Verificar se usuário é Admin ou Super Admin
    await requireAdmin();
    
    return (
      <>
        <BaseHeader breadcrumbItems={[{ title: "Configurações", subtitle: "", url: "/config" }]} />

        <BaseBody title="Configurações" subtitle="Gerenciamento de configurações do sistema">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Link href="/config/users" className="block">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Usuários
                    </CardTitle>
                    <CardDescription>
                      Gerenciar usuários do sistema, perfis e permissões
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Configure usuários, atribua perfis e gerencie permissões de acesso.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </BaseBody>
      </>
    );
  } catch (error) {
    console.error("Error in ConfigPage:", error);
    redirect("/unauthorized");
  }
}
