import { Suspense } from "react";
import BaseHeader from "@/components/layout/base-header";
import BaseBody from "@/components/layout/base-body";
import { checkPagePermission } from "@/lib/auth/check-permissions";
import { BiDashboard } from "@/features/bi/components/bi-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function BiSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}

export default async function BiPage() {
  await checkPagePermission("Dashboard");

  return (
    <>
      <BaseHeader
        breadcrumbItems={[{ title: "Business Intelligence" }]}
        showBackButton={true}
        backHref="/"
      />
      <BaseBody title="" subtitle="" className="bg-[#0f0f0f]">
        <div className="mb-6">
          <h1 className="text-[28px] font-semibold text-white mb-2">
            Business Intelligence
          </h1>
          <p className="text-sm text-[#808080]">
            Análise completa de transações e performance
          </p>
        </div>
        <Suspense fallback={<BiSkeleton />}>
          <BiDashboard />
        </Suspense>
      </BaseBody>
    </>
  );
}
