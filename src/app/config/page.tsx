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
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Link href="/config/users" className="block group">
                <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/50 border-2 hover:scale-[1.02] cursor-pointer">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-xl font-semibold">
                        Usuários
                      </CardTitle>
                    </div>
                    <CardDescription className="text-sm mt-2">
                      Gerenciar usuários do sistema, perfis e permissões
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Configure usuários, atribua perfis e gerencie permissões de acesso ao sistema.
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
