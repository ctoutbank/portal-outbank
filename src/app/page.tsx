import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import Dashboard from "@/components/dashboard-page";
import { getDashboardData } from "./dashboard/actions";

export const dynamic = "force-dynamic";
export const revalidate = 300; // Revalidar a cada 5 minutos

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
      topMerchants: [],
      lastUpdate: new Date()
    };
    
    return (
      <>
        <BaseHeader breadcrumbItems={[{ title: "Dashboard", subtitle:"", url: "/" }]} />

        <BaseBody title="Dashboard" subtitle={`Visualização geral dos Estabelecimentos`}>
          <div className="flex flex-col space-y-4">
            <Dashboard dashboardData={fallbackData} />
          </div>
        </BaseBody>
      </>
    );
  }
}
