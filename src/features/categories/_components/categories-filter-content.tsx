"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { KeyboardEvent, useEffect, useState } from "react";

type CategoriesFilterContentProps = {
  nameIn?: string;
  statusIn?: string;
  mccIn?: string;
  cnaeIn?: string;
  onFilter: (filters: {
    name: string;
    status: string;
    mcc: string;
    cnae: string;
  }) => void;
  onClose: () => void;
};

export function CategoriesFilterContent({
  nameIn,
  statusIn,
  mccIn,
  cnaeIn,
  onFilter,
  onClose,
}: CategoriesFilterContentProps) {
  const [name, setName] = useState(nameIn || "");
  const [status, setStatus] = useState(statusIn || "");
  const [mcc, setMcc] = useState(mccIn || "");
  const [cnae, setCnae] = useState(cnaeIn || "");

  const statuses = [
    {
      value: "ACTIVE",
      label: "Ativo",
    },
    {
      value: "INACTIVE",
      label: "Inativo",
    },
  ];

  const handleStatusChange = (value: string) => {
    setStatus(value === "all" ? "" : value);
  };

  const applyFilters = () => {
    onFilter({ name, status, mcc, cnae });
    onClose();
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLDivElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFilters();
    }
  };

  // Fechar ao apertar ESC - corrigido para tipo DOM KeyboardEvent
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

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      <div
        className="bg-background border rounded-lg p-6 shadow-xl min-w-[900px] max-w-[90vw] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Filtros</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs font-medium mb-1.5">Nome da Categoria</div>
            <Input
              placeholder="Nome da categoria"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-9"
            />
          </div>

          <div>
            <div className="text-xs font-medium mb-1.5">MCC</div>
            <Input
              placeholder="MCC"
              value={mcc}
              onChange={(e) => setMcc(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-9 w-full"
            />
          </div>

          <div>
            <div className="text-xs font-medium mb-1.5">CNAE</div>
            <Input
              placeholder="CNAE"
              value={cnae}
              onChange={(e) => setCnae(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-9 w-full"
            />
          </div>

          <div>
            <div className="text-xs font-medium mb-1.5">Status</div>
            <Select value={status || "all"} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent onMouseDown={(e) => e.stopPropagation()}>
                <SelectItem value="all">Todos</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t">
          <Button
            onClick={applyFilters}
            className="flex items-center gap-2"
            size="sm"
          >
            <Search className="h-4 w-4" />
            Filtrar
          </Button>
        </div>
      </div>
    </div>
  );
}
