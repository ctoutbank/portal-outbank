import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/permissions/require-admin";
import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCog } from "lucide-react";
import { isSuperAdmin } from "@/lib/permissions/check-permissions";
import Link from "next/link";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function ConfigPage() {
  try {
    // Verificar se usuário é Admin ou Super Admin
    await requireAdmin();
    
    // Verificar se é Super Admin para mostrar card de Categorias
    const isSuper = await isSuperAdmin();
    
    return (
      <>
        <BaseHeader breadcrumbItems={[{ title: "Configurações", subtitle: "", url: "/config" }]} />

        <BaseBody title="Configurações" subtitle="Gerenciamento de configurações do sistema">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 max-w-4xl">
              <Link href="/config/users" className="block group">
                <Card className="h-full transition-all duration-200 hover:bg-[#2E2E2E] border border-[rgba(255,255,255,0.1)] rounded-[6px] bg-[#1D1D1D] cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#212121] border border-[#2E2E2E] rounded-[6px] group-hover:bg-[#2E2E2E] transition-colors">
                        <Users className="h-5 w-5 text-[#E0E0E0]" />
                      </div>
                      <CardTitle className="text-base font-semibold text-[#FFFFFF]">
                        Usuários
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs text-[#5C5C5C] leading-relaxed">
                      Gerenciar usuários do sistema, perfis e permissões
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>

              {isSuper && (
                <Link href="/config/categories" className="block group">
                  <Card className="h-full transition-all duration-200 hover:bg-[#2E2E2E] border border-[rgba(255,255,255,0.1)] rounded-[6px] bg-[#1D1D1D] cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#212121] border border-[#2E2E2E] rounded-[6px] group-hover:bg-[#2E2E2E] transition-colors">
                          <UserCog className="h-5 w-5 text-[#E0E0E0]" />
                        </div>
                        <CardTitle className="text-base font-semibold text-[#FFFFFF]">
                          Categorias
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-xs text-[#5C5C5C] leading-relaxed">
                        Gerenciar categorias de usuários e permissões
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              )}
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
