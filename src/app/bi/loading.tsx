import { Skeleton } from "@/components/ui/skeleton";

export default function BiLoading() {
  return (
    <div className="space-y-6 p-6 bg-[#0f0f0f]">
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-40 rounded-md" />
        ))}
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>

      {/* Tabela/Lista */}
      <Skeleton className="h-96 rounded-lg mt-6" />
    </div>
  );
}
