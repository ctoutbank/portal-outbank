"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

type MerchantsDashboardToggleProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export function MerchantsDashboardToggle({
  isOpen,
  onToggle,
}: MerchantsDashboardToggleProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className="flex items-center gap-2"
    >
      {isOpen ? (
        <>
          <ChevronUp className="h-4 w-4" />
          Ocultar Cards
        </>
      ) : (
        <>
          <ChevronDown className="h-4 w-4" />
          Mostrar Cards
        </>
      )}
    </Button>
  );
}


