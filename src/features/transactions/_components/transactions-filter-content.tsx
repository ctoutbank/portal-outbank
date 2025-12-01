"use client";

import { MultiSelect } from "@/components/multi-select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

import {
  brandList,
  cardPaymentMethod,
  processingTypeList,
  transactionProductTypeList,
  transactionStatusList,
} from "@/lib/lookuptables/lookuptables-transactions";
import { useClickOutside } from "@/hooks/use-click-outside";
import { cn } from "@/lib/utils";
import { CalendarIcon, Search } from "lucide-react";
import { KeyboardEvent, useEffect, useRef, useState } from "react";

type FilterTransactionsContentProps = {
  statusIn?: string;
  merchantIn?: string;
  dateFromIn?: string;
  dateToIn?: string;
  productTypeIn?: string;
  brandIn?: string;
  nsuIn?: string;
  methodIn?: string;
  salesChannelIn?: string;
  terminalIn?: string;
  valueMinIn?: string;
  valueMaxIn?: string;
  customerIn?: string;
  availableCustomers?: Array<{ id: number; name: string | null }>;
  onFilter: (filters: {
    status: string;
    merchant: string;
    dateFrom: string;
    dateTo: string;
    productType: string;
    brand: string;
    nsu: string;
    method: string;
    salesChannel: string;
    terminal: string;
    valueMin: string;
    valueMax: string;
    customer: string;
  }) => void;
  onClose: () => void;
};

export function FilterTransactionsContent({
  statusIn,
  merchantIn,
  dateFromIn,
  dateToIn,
  productTypeIn,
  brandIn,
  nsuIn,
  methodIn,
  salesChannelIn,
  terminalIn,
  valueMinIn,
  valueMaxIn,
  customerIn,
  availableCustomers = [],
  onFilter,
  onClose,
}: FilterTransactionsContentProps) {
  const initialStatusValues = statusIn ? statusIn.split(",") : [];
  const initialProductTypeValues = productTypeIn ? productTypeIn.split(",") : [];
  const initialBrandValues = brandIn ? brandIn.split(",") : [];
  const initialMethodValues = methodIn ? methodIn.split(",") : [];
  const initialSalesChannelValues = salesChannelIn ? salesChannelIn.split(",") : [];
  const initialCustomerValues = customerIn ? customerIn.split(",") : [];

  const [statusValues, setStatusValues] = useState<string[]>(initialStatusValues);
  const [productTypeValues, setProductTypeValues] = useState<string[]>(initialProductTypeValues);
  const [brandValues, setBrandValues] = useState<string[]>(initialBrandValues);
  const [methodValues, setMethodValues] = useState<string[]>(initialMethodValues);
  const [salesChannelValues, setSalesChannelValues] = useState<string[]>(initialSalesChannelValues);
  const [customerValues, setCustomerValues] = useState<string[]>(initialCustomerValues);
  const [merchant, setMerchant] = useState(merchantIn || "");
  const [dateFrom, setDateFrom] = useState(dateFromIn || "");
  const [dateTo, setDateTo] = useState(dateToIn || "");
  const [nsu, setNsu] = useState(nsuIn || "");
  const [terminal, setTerminal] = useState(terminalIn || "");
  const [valueMin, setValueMin] = useState(valueMinIn || "");
  const [valueMax, setValueMax] = useState(valueMaxIn || "");

  const filterRef = useRef<HTMLDivElement>(null);

  useClickOutside(filterRef, onClose);

  useEffect(() => {
    const handleKeyDownGlobal = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDownGlobal);

    return () => {
      document.removeEventListener("keydown", handleKeyDownGlobal);
    };
  }, [onClose]);

  const handleSubmitFilter = () => {
    onFilter({
      status: statusValues.join(","),
      merchant,
      dateFrom,
      dateTo,
      productType: productTypeValues.join(","),
      brand: brandValues.join(","),
      nsu,
      method: methodValues.join(","),
      salesChannel: salesChannelValues.join(","),
      terminal,
      valueMin,
      valueMax,
      customer: customerValues.join(","),
    });
    onClose();
  };

  // Converter availableCustomers para formato do MultiSelect
  const customerOptions = availableCustomers.map(c => ({
    value: c.name || "",
    label: c.name || ""
  }));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmitFilter();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      <div
        ref={filterRef}
        className="bg-background border rounded-lg p-6 shadow-xl min-w-[940px] max-w-[95vw] max-h-[90vh] overflow-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Primeira linha */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">ISO</h3>
            <MultiSelect
              options={customerOptions}
              onValueChange={setCustomerValues}
              defaultValue={initialCustomerValues}
              placeholder="Selecione o ISO"
              className="w-full"
              variant="secondary"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium pr-2">Status</h3>
            <MultiSelect
              options={transactionStatusList}
              onValueChange={setStatusValues}
              defaultValue={initialStatusValues}
              placeholder="Selecione o status"
              className="w-full"
              variant="secondary"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Bandeira</h3>
            <MultiSelect
              options={brandList}
              onClick={(e) => e.stopPropagation()}
              onValueChange={setBrandValues}
              defaultValue={initialBrandValues}
              placeholder="Selecione a bandeira"
              className="w-full"
              variant="secondary"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Tipo de Pagamento</h3>
            <MultiSelect
              options={transactionProductTypeList}
              onValueChange={setProductTypeValues}
              defaultValue={initialProductTypeValues}
              placeholder="Selecione o tipo"
              className="w-full"
              variant="secondary"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Processamento</h3>
            <MultiSelect
              options={processingTypeList}
              onValueChange={setSalesChannelValues}
              defaultValue={initialSalesChannelValues}
              placeholder="Selecione-o"
              className="w-full"
              variant="secondary"
            />
          </div>

          {/* Segunda linha */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Tipo da Transação</h3>
            <MultiSelect
              options={cardPaymentMethod}
              onValueChange={setMethodValues}
              defaultValue={initialMethodValues}
              placeholder="Selecione o tipo"
              className="w-full truncate"
              variant="secondary"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Estabelecimento</h3>
            <Input
              placeholder="Nome do estabelecimento"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Terminal</h3>
            <Input
              placeholder="Número do terminal"
              value={terminal}
              onChange={(e) => setTerminal(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">NSU / ID</h3>
            <Input
              placeholder="Número de Sequência Único"
              value={nsu}
              onChange={(e) => setNsu(e.target.value.replace(/\D/g, ""))}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Terceira linha */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Data Inicial</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom
                    ? format(new Date(dateFrom), "dd/MM/yyyy")
                    : "Data Inicial"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="start"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Calendar
                  mode="single"
                  selected={dateFrom ? new Date(dateFrom) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const formatted = format(date, "yyyy-MM-dd'T'HH:mm");
                      setDateFrom(formatted);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Data Final</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(new Date(dateTo), "dd/MM/yyyy") : "Data Final"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="start"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Calendar
                  mode="single"
                  selected={dateTo ? new Date(dateTo) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const formatted = format(date, "yyyy-MM-dd'T'HH:mm");
                      setDateTo(formatted);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2 md:col-span-2">
            <h3 className="text-sm font-medium">Valor</h3>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Mínimo"
                type="number"
                value={valueMin}
                onChange={(e) => setValueMin(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Input
                placeholder="Máximo"
                type="number"
                value={valueMax}
                onChange={(e) => setValueMax(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t">
          <Button onClick={handleSubmitFilter} className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Filtrar
          </Button>
        </div>
      </div>
    </div>
  );
}

