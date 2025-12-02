"use client";
import { Button } from "@/components/ui/button";
import { currentDateTimeUTC, getDateUTC } from "@/lib/datetime-utils";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import * as React from "react";

interface DashboardFiltersProps {
  dateRange: {
    from: string;
    to: string;
  };
}

export default function DashboardFilters({ dateRange }: DashboardFiltersProps) {
  const router = useRouter();
  // Inicializa o estado do mês atual a partir do dateRange
  const initial = React.useMemo(() => {
    try {
      return DateTime.fromISO(dateRange.from).month;
    } catch {
      return DateTime.utc().month;
    }
  }, [dateRange.from]);

  const [currentMonth, setCurrentMonth] = React.useState(initial);
  const [isLoading, setIsLoading] = React.useState(false);

  // Mês máximo permitido (mês atual)
  const nowMonthISO = getDateUTC(currentDateTimeUTC(), "America/Sao_Paulo");
  const nowMonth = nowMonthISO
    ? DateTime.fromISO(nowMonthISO).month
    : DateTime.utc().month;

  const canNext = currentMonth < nowMonth;

  // Atualiza a URL com os parâmetros de filtro
  const updateUrl = (month: number) => {
    setIsLoading(true);
    // Obtém o ano atual
    const year = DateTime.fromISO(dateRange.from).year;
    const dt = DateTime.utc(year, month);
    const f = dt.startOf("month").toISO({ suppressMilliseconds: true });
    const t = dt.endOf("month").toISO({ suppressMilliseconds: true });
    router.push(
      `/portal/closing?viewMode=month&dateFrom=${encodeURIComponent(
        f ? f : ""
      )}&dateTo=${encodeURIComponent(t ? t : "")}`
    );
  };

  const handlePrev = () => {
    if (isLoading) return;
    const prev = currentMonth - 1 < 1 ? 12 : currentMonth - 1;
    setCurrentMonth(prev);
    updateUrl(prev);
  };

  const handleNext = () => {
    if (!canNext || isLoading) return;
    const next = currentMonth + 1 > 12 ? 1 : currentMonth + 1;
    setCurrentMonth(next);
    updateUrl(next);
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handlePrev}
        disabled={isLoading}
        className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#252525]"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
      <span className="text-sm font-medium text-white">
        {DateTime.fromObject({ month: currentMonth })
          .setLocale("pt-BR")
          .toFormat("LLLL yyyy")}
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={handleNext}
        disabled={!canNext || isLoading}
        className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#252525] disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

