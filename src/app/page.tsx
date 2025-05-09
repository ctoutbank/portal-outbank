import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import Dashboard from "@/components/dashboard-page";
export const revalidate = 0;


export default async function Dashboardpage() {
  return (
    <>
      <BaseHeader breadcrumbItems={[{ title: "Dashboard", url: "/" }]} />

      <BaseBody title="Dashboard" subtitle={`Visualização geral dos Clientes`}>
        <div className="flex flex-col space-y-4">
          <Dashboard />
        </div>
      </BaseBody>
    </>
  );
}
