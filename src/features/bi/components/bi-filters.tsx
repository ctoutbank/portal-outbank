"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar, Filter, X } from "lucide-react";
import { BiFiltersState } from "./bi-dashboard";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type BiFiltersProps = {
  filters: BiFiltersState;
  onFilterChange: (filters: Partial<BiFiltersState>) => void;
  availableCustomers: string[];
  customerBreakdown: Array<{ name: string; slug: string }>;
  merchantBreakdown: Array<{ name: string; slug: string }>;
};

const BRANDS = ['VISA', 'MASTERCARD', 'ELO', 'AMEX', 'HIPERCARD', 'CABAL', 'PIX'];
const PRODUCT_TYPES: { value: string; label: string }[] = [
  { value: 'CREDIT', label: 'CRÉDITO' },
  { value: 'DEBIT', label: 'DÉBITO' },
  { value: 'PIX', label: 'PIX' },
  { value: 'PREPAID_CREDIT', label: 'CRÉDITO PRÉ-PAGO' },
  { value: 'PREPAID_DEBIT', label: 'DÉBITO PRÉ-PAGO' },
  { value: 'VOUCHER', label: 'VOUCHER' }
];
const SALES_CHANNELS = ['POS', 'MPOS', 'PDV', 'PAYLINK', 'INTEGRATION'];
const STATUSES: { value: string; label: string }[] = [
  { value: 'AUTHORIZED', label: 'Autorizado' },
  { value: 'CANCELED', label: 'Cancelado' },
  { value: 'DENIED', label: 'Negado' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'PROCESSING', label: 'Processando' }
];

export function BiFilters({ filters, onFilterChange, customerBreakdown, merchantBreakdown }: BiFiltersProps) {
  const [dateBounds, setDateBounds] = useState<{ today: Date; threeYearsAgo: Date } | null>(null);

  useEffect(() => {
    const t = new Date();
    const tya = new Date();
    tya.setFullYear(tya.getFullYear() - 3);
    setDateBounds({ today: t, threeYearsAgo: tya });
  }, []);
  const clearFilters = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    onFilterChange({
      dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      customer: '',
      merchant: '',
      brand: '',
      productType: '',
      salesChannel: '',
      status: ''
    });
  };

  const hasActiveFilters = filters.customer || filters.merchant || filters.brand || filters.productType || filters.salesChannel || filters.status;

  return (
    <div className="sticky top-0 z-50 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-blue-400" />
        <span className="text-sm font-medium text-white">Filtros Globais</span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto text-xs text-muted-foreground hover:text-white"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Data Início</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-9 px-3 justify-start text-left font-normal bg-[#0f0f0f] border-[#333] text-white hover:bg-[#1a1a1a] text-sm",
                  !filters.dateFrom && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {filters.dateFrom ? format(new Date(filters.dateFrom), "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" onMouseDown={(e) => e.stopPropagation()}>
              <CalendarComponent
                mode="single"
                selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                onSelect={(date) => {
                  if (date) {
                    onFilterChange({ dateFrom: format(date, "yyyy-MM-dd") });
                  }
                }}
                fromDate={dateBounds?.threeYearsAgo}
                toDate={dateBounds?.today}
                showMonthYearPicker
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Data Fim</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-9 px-3 justify-start text-left font-normal bg-[#0f0f0f] border-[#333] text-white hover:bg-[#1a1a1a] text-sm",
                  !filters.dateTo && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {filters.dateTo ? format(new Date(filters.dateTo), "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" onMouseDown={(e) => e.stopPropagation()}>
              <CalendarComponent
                mode="single"
                selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                onSelect={(date) => {
                  if (date) {
                    onFilterChange({ dateTo: format(date, "yyyy-MM-dd") });
                  }
                }}
                fromDate={dateBounds?.threeYearsAgo}
                toDate={dateBounds?.today}
                showMonthYearPicker
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1 min-w-0 overflow-hidden">
          <Label className="text-xs text-muted-foreground">ISO</Label>
          <Select value={filters.customer || "all"} onValueChange={(v) => onFilterChange({ customer: v === "all" ? "" : v, merchant: "" })}>
            <SelectTrigger className="h-9 bg-[#0f0f0f] border-[#333] text-white text-sm w-full">
              <div className="truncate w-full text-left">
                <SelectValue placeholder="Todos" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#333]">
              <SelectItem value="all" className="text-white">Todos</SelectItem>
              {customerBreakdown.map((c) => (
                <SelectItem key={c.slug} value={c.slug} className="text-white">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 min-w-0 overflow-hidden">
          <Label className="text-xs text-muted-foreground">EC</Label>
          <Select value={filters.merchant || "all"} onValueChange={(v) => onFilterChange({ merchant: v === "all" ? "" : v })}>
            <SelectTrigger className="h-9 bg-[#0f0f0f] border-[#333] text-white text-sm w-full">
              <div className="truncate w-full text-left">
                <SelectValue placeholder="Todos" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#333] max-h-[300px]">
              <SelectItem value="all" className="text-white">Todos</SelectItem>
              {merchantBreakdown.map((m) => (
                <SelectItem key={m.slug} value={m.slug} className="text-white truncate">
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 min-w-0 overflow-hidden">
          <Label className="text-xs text-muted-foreground">Bandeira</Label>
          <Select value={filters.brand || "all"} onValueChange={(v) => onFilterChange({ brand: v === "all" ? "" : v })}>
            <SelectTrigger className="h-9 bg-[#0f0f0f] border-[#333] text-white text-sm w-full">
              <div className="truncate w-full text-left">
                <SelectValue placeholder="Todas" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#333]">
              <SelectItem value="all" className="text-white">Todas</SelectItem>
              {BRANDS.map((b) => (
                <SelectItem key={b} value={b} className="text-white">{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 min-w-0 overflow-hidden">
          <Label className="text-xs text-muted-foreground">Produto</Label>
          <Select value={filters.productType || "all"} onValueChange={(v) => onFilterChange({ productType: v === "all" ? "" : v })}>
            <SelectTrigger className="h-9 bg-[#0f0f0f] border-[#333] text-white text-sm w-full">
              <div className="truncate w-full text-left">
                <SelectValue placeholder="Todos" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#333]">
              <SelectItem value="all" className="text-white">Todos</SelectItem>
              {PRODUCT_TYPES.map((p) => (
                <SelectItem key={p.value} value={p.value} className="text-white">{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 min-w-0 overflow-hidden">
          <Label className="text-xs text-muted-foreground">Canal</Label>
          <Select value={filters.salesChannel || "all"} onValueChange={(v) => onFilterChange({ salesChannel: v === "all" ? "" : v })}>
            <SelectTrigger className="h-9 bg-[#0f0f0f] border-[#333] text-white text-sm w-full">
              <div className="truncate w-full text-left">
                <SelectValue placeholder="Todos" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#333]">
              <SelectItem value="all" className="text-white">Todos</SelectItem>
              {SALES_CHANNELS.map((s) => (
                <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 min-w-0 overflow-hidden">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={filters.status || "all"} onValueChange={(v) => onFilterChange({ status: v === "all" ? "" : v })}>
            <SelectTrigger className="h-9 bg-[#0f0f0f] border-[#333] text-white text-sm w-full">
              <div className="truncate w-full text-left">
                <SelectValue placeholder="Todos" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#333]">
              <SelectItem value="all" className="text-white">Todos</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-white">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
