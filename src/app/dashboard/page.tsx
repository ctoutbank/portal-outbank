import Dashboard from "@/components/dashboard-page";
import { getDashboardData } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  try {
    // Carregar todos os dados do dashboard usando a server action
    const dashboardData = await getDashboardData();
    
    // Garantir que temos dados válidos antes de renderizar
    if (!dashboardData) {
      throw new Error("Não foi possível obter dados do dashboard");
    }
    
    // Passar os dados para o componente cliente
    return <Dashboard dashboardData={dashboardData} />;
  } catch (error) {
    console.error("Erro ao carregar dados do dashboard:", error);
    
    // Fornecer dados padrão para evitar o erro de desestruturação
    const fallbackData = {
      totalEstabelecimentos: 0,
      totalTransacoes: 0,
      totalBruto: 0,
      totalLucro: 0,
      topCustomers: []
    };
    
    return <Dashboard dashboardData={fallbackData} />;
  }
} 