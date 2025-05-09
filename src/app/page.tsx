import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import Dashboard from "@/components/dashboard-page";
import { getDashboardData } from "./dashboard/actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Dashboardpage() {
  try {
    // Carregar dados reais do dashboard usando a server action
    const dashboardData = await getDashboardData();
    
    return (
      <>
        <BaseHeader breadcrumbItems={[{ title: "Dashboard", url: "/" }]} />

        <BaseBody title="Dashboard" subtitle={`Visualização geral dos Estabelecimentos`}>
          <div className="flex flex-col space-y-4">
            <Dashboard dashboardData={dashboardData} />
          </div>
        </BaseBody>
      </>
    );
  } catch (error) {
    console.error("Erro ao carregar dados do dashboard:", error);
    
    // Em caso de erro, usar dados padrão
    const fallbackData = {
      totalEstabelecimentos: 0,
      totalTransacoes: 0,
      totalBruto: 0,
      totalLucro: 0,
      topCustomers: []
    };
    
    return (
      <>
        <BaseHeader breadcrumbItems={[{ title: "Dashboard", url: "/" }]} />

        <BaseBody title="Dashboard" subtitle={`Visualização geral dos Estabelecimentos`}>
          <div className="flex flex-col space-y-4">
            <Dashboard dashboardData={fallbackData} />
          </div>
        </BaseBody>
      </>
    );
  }
}
