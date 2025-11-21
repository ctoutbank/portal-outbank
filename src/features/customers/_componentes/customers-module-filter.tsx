"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModuleBadge } from "@/components/ui/module-badge";
import { Filter, X } from "lucide-react";
import { useState } from "react";

interface CustomersModuleFilterProps {
  selectedModules: string[];
  onModulesChange: (modules: string[]) => void;
  availableModules?: string[]; // Módulos disponíveis nos ISOs listados
}

export function CustomersModuleFilter({
  selectedModules,
  onModulesChange,
  availableModules = ["adq", "bnk", "c&c", "fin"],
}: CustomersModuleFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleModule = (moduleSlug: string) => {
    if (selectedModules.includes(moduleSlug)) {
      onModulesChange(selectedModules.filter((m) => m !== moduleSlug));
    } else {
      onModulesChange([...selectedModules, moduleSlug]);
    }
  };

  const clearFilters = () => {
    onModulesChange([]);
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtro por Módulos
            {selectedModules.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedModules.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="p-2 border-b">
            <div className="text-xs font-semibold mb-2">Módulos</div>
            {availableModules.map((moduleSlug) => (
              <DropdownMenuCheckboxItem
                key={moduleSlug}
                checked={selectedModules.includes(moduleSlug)}
                onCheckedChange={() => toggleModule(moduleSlug)}
                className="flex items-center gap-2"
              >
                <ModuleBadge
                  moduleSlug={moduleSlug}
                  showIcon={true}
                  variant="outline"
                  className="text-xs"
                />
              </DropdownMenuCheckboxItem>
            ))}
          </div>
          {selectedModules.length > 0 && (
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={clearFilters}
              >
                <X className="h-4 w-4" />
                Limpar filtros
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {selectedModules.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {selectedModules.map((moduleSlug) => (
            <Badge
              key={moduleSlug}
              variant="secondary"
              className="gap-1 cursor-pointer hover:bg-secondary/80"
              onClick={() => toggleModule(moduleSlug)}
            >
              <ModuleBadge
                moduleSlug={moduleSlug}
                showIcon={false}
                variant="outline"
                className="text-xs p-0 border-0"
              />
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

