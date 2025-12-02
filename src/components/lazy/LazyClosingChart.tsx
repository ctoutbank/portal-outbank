import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const BarChartCustom = lazy(() =>
  import("@/features/closing/components/barChart").then((module) => ({
    default: module.BarChartCustom,
  }))
);

export function LazyClosingChart(props: any) {
  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full bg-[#1f1f1f] border border-[#2a2a2a]" />}>
      <BarChartCustom {...props} />
    </Suspense>
  );
}

