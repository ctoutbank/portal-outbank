"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings } from "lucide-react";

type Column = {
  id: string;
  name: string;
  defaultVisible: boolean;
  alwaysVisible: boolean;
  sortable: boolean;
};

interface MerchantsTableSettingsProps {
  columns: Column[];
  visibleColumns: string[];
  onToggleColumn: (columnId: string) => void;
}

export function MerchantsTableSettings({
  columns,
  visibleColumns,
  onToggleColumn,
}: MerchantsTableSettingsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 w-9 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={visibleColumns.includes(column.id)}
            onCheckedChange={() => onToggleColumn(column.id)}
            disabled={column.alwaysVisible}
          >
            {column.name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

