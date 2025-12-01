import { TableHead } from "@/components/ui/table";
import { cn, getSortIconInfo } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ReadonlyURLSearchParams } from "next/navigation";

// Interface para o componente de cabeçalho de tabela ordenável
export interface SortableTableHeadProps {
  columnId: string;
  name: string;
  sortable: boolean;
  onSort: (columnId: string) => void;
  searchParams?: ReadonlyURLSearchParams | null;
  // Para compatibilidade com implementações existentes
  getSortIcon?: (columnId: string) => React.ReactNode;
  // Classe CSS opcional para estilização personalizada
  className?: string;
}

export function SortableTableHead({
  columnId,
  name,
  sortable,
  onSort,
  searchParams,
  getSortIcon,
  className,
}: SortableTableHeadProps) {
  const handleClick = () => {
    if (sortable) {
      onSort(columnId);
    }
  };

  const renderSortIcon = () => {
    if (!sortable) return null;

    // Se getSortIcon foi fornecido (compatibilidade com implementações existentes)
    if (getSortIcon) {
      return getSortIcon(columnId);
    }

    // Usar a implementação padrão com searchParams
    if (searchParams) {
      const iconInfo = getSortIconInfo(columnId, searchParams);

      if (iconInfo.icon === "up") {
        return <ChevronUp className={iconInfo.className} />;
      } else if (iconInfo.icon === "down") {
        return <ChevronDown className={iconInfo.className} />;
      } else {
        return <ChevronDown className={iconInfo.className} />;
      }
    }

    return null;
  };

  return (
    <TableHead
      className={cn(
        sortable ? "cursor-pointer select-none hover:bg-muted/50" : "",
        className
      )}
      onClick={handleClick}
    >
      <div className={cn("flex items-center gap-1", className?.includes("text-center") ? "justify-center" : "")}>
        {name}
        {renderSortIcon()}
      </div>
    </TableHead>
  );
}

