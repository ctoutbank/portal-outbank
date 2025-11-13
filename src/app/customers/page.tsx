import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import PageSizeSelector from "@/components/page-size-selector";
import PaginationRecords from "@/components/pagination-Records";

import { Button } from "@/components/ui/button";

import CustomersList from "@/features/customers/_componentes/customers-list";
import { CustomersFilter } from "@/features/customers/_componentes/custumers-filter";
import { getCustomers, getCustomerStatistics } from "@/features/customers/server/customers";
import { ISOStatisticsCards } from "@/features/customers/_componentes/iso-statistics-cards";
import { Plus } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

type CustomersPageProps = {
  page?: number;
  perPage?: number;
  search?: string;
  name?: string;
  customerId?: string;
  settlementManagementType?: string;
  status?: string;
};

export default async function Customerspage({
  searchParams,
}: {
  searchParams: Promise<CustomersPageProps>;
}) {
  // Aguarda searchParams antes de acessar suas propriedades
  const params = await searchParams;

  const page = parseInt(params.page?.toString() || "1");
  const perPage = parseInt(params.perPage?.toString() || "10");

  const customers = await getCustomers(
    params.name || "",
    page,
    perPage,
    params.customerId || "",
    params.settlementManagementType || "",
    "id",
    "desc",
    params.status || ""
  );

  const statistics = await getCustomerStatistics();

  const totalCount = customers.totalCount;

  return (
    <>
      <BaseHeader breadcrumbItems={[{ title: "Iso", subtitle:"", url: "/customers" }]} />

      <BaseBody title="Isos" subtitle={`visualização de todos os Isos`}>
        <div className="flex flex-col space-y-4">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex-1 flex items-center gap-4">
              <CustomersFilter
                nameIn={params.name || ""}
                customerIdIn={params.customerId || ""}
                settlementManagementTypeIn={
                  params.settlementManagementType || ""
                }
                statusIn={params.status || ""}
              />
              <div className="text-sm text-muted-foreground">
                {totalCount} {totalCount === 1 ? "resultado encontrado" : "resultados encontrados"}
              </div>
            </div>
            <Button asChild className="ml-2">
              <Link href="/customers/0">
                <Plus className="h-4 w-4 mr-1" />
                Novo Iso
              </Link>
            </Button>
          </div>

          <ISOStatisticsCards
            totalActive={statistics.totalActive}
            totalInactive={statistics.totalInactive}
            createdThisMonth={statistics.createdThisMonth}
            createdLastWeek={statistics.createdLastWeek}
          />

          <CustomersList
            Customers={{
              customers: customers.customers.map((customer) => ({
                id: customer.id,
                name: customer.name || "",
                customerId: customer.customerId || "",
                settlementManagementType:
                  customer.settlementManagementType || "",
                slug: customer.slug,
                idParent: customer.idParent || 0,
                isActive: customer.isActive,
              })),
              totalCount: customers.totalCount,
            }}
          />

          {totalCount > 0 && (
            <div className="flex items-center justify-between mt-4">
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
