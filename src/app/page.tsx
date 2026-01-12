import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { DashboardWrapper } from "./dashboard/dashboard-wrapper";
import { getDashboardData } from "./dashboard/actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Dashboardpage() {
  try {
    const initialData = await getDashboardData();
    
    return (
      <>
        <BaseHeader breadcrumbItems={[{ title: "Dashboard" }]} />
        <BaseBody title="" subtitle="" className="p-0">
          <DashboardWrapper initialData={initialData} />
        </BaseBody>
      </>
    );
  } catch (error) {
    console.error("Erro ao carregar dados do dashboard:", error);
    
    return (
      <>
        <BaseHeader breadcrumbItems={[{ title: "Dashboard" }]} />
        <BaseBody title="" subtitle="" className="p-0">
          <DashboardWrapper />
        </BaseBody>
      </>
    );
  }
}
