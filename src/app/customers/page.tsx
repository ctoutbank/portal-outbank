import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import PageSizeSelector from "@/components/page-size-selector";
import PaginationRecords from "@/components/pagination-Records";

import { Button } from "@/components/ui/button";

import CustomersList from "@/features/customers/_componentes/customers-list";
import { CustomersFilter } from "@/features/customers/_componentes/custumers-filter";
import { getCustomers, getCustomerStatistics } from "@/features/customers/server/customers";
import { ISOStatisticsCards } from "@/features/customers/_componentes/iso-statistics-cards";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserInfo, isCoreProfile } from "@/lib/permissions/check-permissions";

export const revalidate = 0;

type CustomersPageProps = {
  page?: number;
  perPage?: number;
  search?: string;
  name?: string;
  customerId?: string;
  userName?: string;
};

export default async function Customerspage({
  searchParams,
}: {
  searchParams: Promise<CustomersPageProps>;
}) {
  const userInfo = await getCurrentUserInfo();
  if (!userInfo) {
    redirect("/sign-in");
  }
  
  const isAdminOrSuperAdmin = userInfo.isSuperAdmin || userInfo.isAdmin;
  const isCore = await isCoreProfile();
  
  if (!isAdminOrSuperAdmin && !isCore) {
    redirect("/");
  }
  
  // Aguarda searchParams antes de acessar suas propriedades
  const params = await searchParams;

  const page = parseInt(params.page?.toString() || "1");
  const perPage = parseInt(params.perPage?.toString() || "10");

  const customers = await getCustomers(
    params.name || "",
    page,
    perPage,
    params.customerId || "",
    params.userName || ""
  );

  const statistics = await getCustomerStatistics();

  const totalCount = customers.totalCount;

  return (
    <>
      <BaseHeader breadcrumbItems={[{ title: "ISOs" }]} showBackButton={true} backHref="/" />

      <BaseBody title="ISOs" subtitle={isAdminOrSuperAdmin ? "visualização de todos os ISOs" : "visualização dos seus ISOs vinculados"}>
        <div className="flex flex-col space-y-4 w-full max-w-full overflow-x-hidden">
          {(isAdminOrSuperAdmin || isCore) && (
            <div className="mb-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <CustomersFilter
                  nameIn={params.name || ""}
                  customerIdIn={params.customerId || ""}
                  userNameIn={params.userName || ""}
                />
              </div>
              <Button asChild className="sm:ml-2 flex-shrink-0">
                <Link href="/customers/0">
                  Novo ISO
                </Link>
              </Button>
            </div>
          )}

          <div className="mt-4">
            <ISOStatisticsCards
              totalActive={statistics.totalActive}
              totalInactive={statistics.totalInactive}
              createdThisMonth={statistics.createdThisMonth}
              createdLastWeek={statistics.createdLastWeek}
            />
          </div>

          <CustomersList
            Customers={customers}
          />

          {totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-4">
              <PageSizeSelector
                currentPageSize={perPage}
                pageName="customers"
              />
              <PaginationRecords
                totalRecords={totalCount}
                currentPage={page}
                pageSize={perPage}
                pageName="customers"
              />
            </div>
          )}
        </div>
      </BaseBody>
    </>
  );
}
