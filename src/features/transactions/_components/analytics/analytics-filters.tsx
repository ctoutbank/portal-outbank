"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MultiSelect } from "@/components/multi-select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AnalyticsFiltersProps = {
  dateFromIn?: string;
  dateToIn?: string;
  customerIdsIn?: string; // Comma-separated customer IDs
  availableCustomers: Array<{ id: number; name: string | null }>;
};

export function AnalyticsFilters({
  dateFromIn,
  dateToIn,
  customerIdsIn,
  availableCustomers,
}: AnalyticsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    dateFromIn ? new Date(dateFromIn) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    dateToIn ? new Date(dateToIn) : undefined
  );
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>(
    customerIdsIn ? customerIdsIn.split(",").filter(Boolean) : []
  );

  const today = new Date();
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(today.getFullYear() - 3);

  const handleApplyFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString() || "");

      if (dateFrom) {
        const formatted = format(dateFrom, "yyyy-MM-dd'T'HH:mm");
        params.set("dateFrom", formatted);
      } else {
        params.delete("dateFrom");
      }

      if (dateTo) {
        const formatted = format(dateTo, "yyyy-MM-dd'T'HH:mm");
        params.set("dateTo", formatted);
      } else {
        params.delete("dateTo");
      }

      if (selectedCustomerIds.length > 0) {
        params.set("customerIds", selectedCustomerIds.join(","));
      } else {
        params.delete("customerIds");
      }

      router.push(`/analytics?${params.toString()}`);
    });
  };

  const handleClearFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      router.push(`/analytics`);
    });
  };

  const customerOptions = availableCustomers.map((customer) => ({
    label: customer.name || `ISO ${customer.id}`,
    value: customer.id.toString(),
  }));

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-white whitespace-nowrap">
          Período:
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#252525]",
                !dateFrom && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? (
                format(dateFrom, "dd/MM/yyyy", { locale: ptBR })
              ) : (
                <span>Data inicial</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={setDateFrom}
              fromDate={threeYearsAgo}
              toDate={today}
              showMonthYearPicker
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <span className="text-[#808080]">até</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#252525]",
                !dateTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? (
                format(dateTo, "dd/MM/yyyy", { locale: ptBR })
              ) : (
                <span>Data final</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              fromDate={threeYearsAgo}
              toDate={today}
              showMonthYearPicker
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-white whitespace-nowrap">
          ISOs:
        </label>
        <MultiSelect
          options={customerOptions}
          onValueChange={setSelectedCustomerIds}
          defaultValue={selectedCustomerIds}
          placeholder="Selecione ISOs para comparar"
          maxCount={3}
          className="w-[300px]"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button
          onClick={handleClearFilters}
          variant="outline"
          disabled={isPending}
          className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#252525]"
        >
          Limpar
        </Button>
        <Button
          onClick={handleApplyFilters}
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isPending ? "Aplicando..." : "Aplicar Filtros"}
        </Button>
      </div>
    </div>
  );
}



