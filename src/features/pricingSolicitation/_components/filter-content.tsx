"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PricingSolicitationStatus } from "@/lib/lookuptables/lookuptables";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { KeyboardEvent, useEffect, useRef, useState } from "react";

type FilterPricingSolicitationContentProps = {
  cnaeIn?: string;
  statusIn?: string;
  onFilter: (filters: { cnae: string; status: string }) => void;
  onClose: () => void;
};

export function FilterPricingSolicitationContent({
                                                   cnaeIn,
                                                   statusIn,
                                                   onFilter,
                                                   onClose,
                                                 }: FilterPricingSolicitationContentProps) {
  const [cnae, setCnae] = useState(cnaeIn || "");
  const [status, setStatus] = useState(statusIn || "");

  const filterRef = useRef<HTMLDivElement>(null);

  // Fecha se clicar fora do conteúdo
  const handleClickOutside = (e: MouseEvent) => {
    if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Fecha ao apertar ESC
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    const handleKeyDownGlobal = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDownGlobal);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDownGlobal);
    };
  }, [onClose]);

  const applyFilters = () => {
    onFilter({ cnae, status });
    onClose();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFilters();
    }
  };

  return (
      <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in-0 duration-200"
          onClick={onClose}
      >
        <div
            ref={filterRef}
            className="bg-background border rounded-lg p-6 shadow-xl min-w-[900px] max-w-[90vw] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Identificador do link</h3>
              <Input
                  placeholder="CNAE"
                  value={cnae}
                  onChange={(e) => setCnae(e.target.value)}
                  onKeyDown={handleKeyDown}
              />
            </div>
            <div className="space-y-2 ml-8">
              <h3 className="text-sm font-medium ml-2">Status</h3>
              <div className="flex flex-wrap gap-2">
                {PricingSolicitationStatus.map((s) => (
                    <Badge
                        key={s.value}
                        variant="secondary"
                        className={cn(
                            "cursor-pointer w-24 h-7 select-none text-sm",
                            status === s.value ? s.color : "bg-secondary",
                            status === s.value ? "text-white" : "text-secondary-foreground"
                        )}
                        onClick={() => setStatus(status === s.value ? "" : s.value)}
                    >
                      {s.label}
                    </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4 mt-4 border-t">
            <Button onClick={applyFilters} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Filtrar
            </Button>
          </div>
        </div>
      </div>
  );
}
