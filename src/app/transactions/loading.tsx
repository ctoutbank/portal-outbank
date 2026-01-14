import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsLoading() {
  return (
    <div className="p-6 bg-[#1a1a1a]">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Filtros e ações */}
      <div className="flex flex-col space-y-4 max-w-[1600px] mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <Skeleton className="h-10 w-[120px]" />
            <Skeleton className="h-10 w-[150px]" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[120px]" />
            <Skeleton className="h-10 w-[120px]" />
          </div>
        </div>

        {/* Tabela */}
        <div className="rounded-md border border-[#2a2a2a] bg-[#1a1a1a]">
          {/* Header da tabela */}
          <div className="grid grid-cols-8 gap-4 p-4 border-b border-[#2a2a2a]">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          {/* Linhas da tabela */}
          {Array.from({ length: 10 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-8 gap-4 p-4 border-b border-[#2a2a2a]">
              {Array.from({ length: 8 }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between py-5 px-6 bg-[#1a1a1a] border-t border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8" />
          </div>
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
    </div>
  );
}
