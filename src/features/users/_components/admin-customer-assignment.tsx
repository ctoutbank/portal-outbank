"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Check, X } from "lucide-react";

interface AdminCustomerAssignmentProps {
  customers: Array<{ id: number; name: string | null; slug?: string | null }>;
  selectedCustomerIds: number[];
  onSelectionChange: (customerIds: number[]) => void;
}

export function AdminCustomerAssignment({
  customers,
  selectedCustomerIds,
  onSelectionChange,
}: AdminCustomerAssignmentProps) {
  const [localSelection, setLocalSelection] = useState<Set<number>>(
    new Set(selectedCustomerIds)
  );

  const handleToggle = (customerId: number) => {
    const newSelection = new Set(localSelection);
    if (newSelection.has(customerId)) {
      newSelection.delete(customerId);
    } else {
      newSelection.add(customerId);
    }
    setLocalSelection(newSelection);
    onSelectionChange(Array.from(newSelection));
  };

  const handleSelectAll = () => {
    const allIds = customers.map((c) => c.id);
    setLocalSelection(new Set(allIds));
    onSelectionChange(allIds);
  };

  const handleDeselectAll = () => {
    setLocalSelection(new Set());
    onSelectionChange([]);
  };

  const selectedCount = localSelection.size;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">ISOs Autorizados</CardTitle>
            <CardDescription>
              {selectedCount === 0
                ? "Nenhum ISO selecionado"
                : `${selectedCount} ISO${selectedCount > 1 ? "s" : ""} selecionado${selectedCount > 1 ? "s" : ""}`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              <Check className="h-4 w-4 mr-1" />
              Selecionar Todos
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
          {customers.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground py-4">
              Nenhum ISO disponível
            </div>
          ) : (
            customers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center space-x-2 p-2 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={`customer-${customer.id}`}
                  checked={localSelection.has(customer.id)}
                  onCheckedChange={() => handleToggle(customer.id)}
                />
                <Label
                  htmlFor={`customer-${customer.id}`}
                  className="flex-1 cursor-pointer font-normal text-sm"
                >
                  {customer.name || "Sem nome"}
                </Label>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
