import { Skeleton } from "@/components/ui/skeleton";

export default function MerchantsLoading() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Filtros e ações */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border">
        {/* Header da tabela */}
        <div className="grid grid-cols-6 gap-4 p-4 border-b">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4" />
          ))}
        </div>
        {/* Linhas */}
        {Array.from({ length: 10 }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-6 gap-4 p-4 border-b">
            {Array.from({ length: 6 }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4" />
            ))}
          </div>
        ))}
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between mt-4">
        <Skeleton className="h-8 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-8" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}
