"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Building2 } from "lucide-react";
import { useState, useEffect } from "react";

export interface IsoCommissionLink {
  customerId: number;
  customerName: string;
  commissionType: "EXECUTIVO" | "CORE" | "OUTBANK" | string;
}

interface IsoCommissionAssignmentProps {
  customers: Array<{ id: number; name: string | null; slug?: string | null }>;
  initialLinks?: IsoCommissionLink[];
  onChange: (links: IsoCommissionLink[]) => void;
  disabled?: boolean;
}

export function IsoCommissionAssignment({
  customers,
  initialLinks = [],
  onChange,
  disabled = false,
}: IsoCommissionAssignmentProps) {
  const [links, setLinks] = useState<IsoCommissionLink[]>(initialLinks);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<"EXECUTIVO" | "CORE">("EXECUTIVO");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Sincronizar estado quando initialLinks mudar (ex: ao editar um usuário diferente)
    const initialIds = initialLinks.map(l => `${l.customerId}-${l.commissionType}`).sort().join(',');
    const currentIds = links.map(l => `${l.customerId}-${l.commissionType}`).sort().join(',');
    
    if (!initialized || initialIds !== currentIds) {
      setLinks(initialLinks);
      setInitialized(true);
    }
  }, [initialLinks]);

  const availableCustomers = customers.filter(
    (c) => !links.some((l) => l.customerId === c.id)
  );

  const handleAddLink = () => {
    if (!selectedCustomerId) return;

    const customer = customers.find((c) => c.id === selectedCustomerId);
    if (!customer) return;

    const newLink: IsoCommissionLink = {
      customerId: selectedCustomerId,
      customerName: customer.name || "Sem nome",
      commissionType: selectedType,
    };

    const newLinks = [...links, newLink];
    setLinks(newLinks);
    onChange(newLinks);
    setSelectedCustomerId(null);
    setSelectedType("EXECUTIVO");
  };

  const handleRemoveLink = (customerId: number) => {
    const newLinks = links.filter((l) => l.customerId !== customerId);
    setLinks(newLinks);
    onChange(newLinks);
  };

  const handleChangeType = (customerId: number, newType: "EXECUTIVO" | "CORE") => {
    const newLinks = links.map((l) =>
      l.customerId === customerId ? { ...l, commissionType: newType } : l
    );
    setLinks(newLinks);
    onChange(newLinks);
  };

  const executivoCount = links.filter((l) => l.commissionType === "EXECUTIVO").length;
  const coreCount = links.filter((l) => l.commissionType === "CORE").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Estrutura de Comissões
            </CardTitle>
            <CardDescription>
              {links.length === 0
                ? "Nenhum ISO vinculado"
                : `${links.length} ISO${links.length > 1 ? "s" : ""} vinculado${links.length > 1 ? "s" : ""}`}
              {links.length > 0 && (
                <span className="ml-2">
                  ({executivoCount} Executivo, {coreCount} Core)
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!disabled && availableCustomers.length > 0 && (
          <div className="flex flex-wrap items-end gap-3 p-3 bg-muted/30 rounded-lg border border-dashed">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-muted-foreground mb-1 block">ISO</Label>
              <Select
                value={selectedCustomerId?.toString() || ""}
                onValueChange={(value) => setSelectedCustomerId(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ISO" />
                </SelectTrigger>
                <SelectContent>
                  {availableCustomers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name || "Sem nome"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[180px]">
              <Label className="text-xs text-muted-foreground mb-1 block">Tipo de Comissão</Label>
              <RadioGroup
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as "EXECUTIVO" | "CORE")}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="EXECUTIVO" id="new-executivo" />
                  <Label htmlFor="new-executivo" className="text-sm font-normal cursor-pointer">
                    Executivo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CORE" id="new-core" />
                  <Label htmlFor="new-core" className="text-sm font-normal cursor-pointer">
                    Core
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handleAddLink}
              disabled={!selectedCustomerId}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        )}

        {links.length === 0 ? (
          <div className="text-center text-muted-foreground py-6 border rounded-lg bg-muted/10">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum ISO vinculado a este usuário</p>
            <p className="text-xs mt-1">Adicione ISOs e defina o tipo de comissão para cada um</p>
          </div>
        ) : (
          <div className="space-y-2">
            {links.map((link) => (
              <div
                key={link.customerId}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{link.customerName}</span>
                  <Badge
                    variant={link.commissionType === "EXECUTIVO" ? "default" : "secondary"}
                    className={
                      link.commissionType === "EXECUTIVO"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-slate-600 hover:bg-slate-700"
                    }
                  >
                    {link.commissionType}
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  {!disabled && (
                    <>
                      <RadioGroup
                        value={link.commissionType}
                        onValueChange={(value) =>
                          handleChangeType(link.customerId, value as "EXECUTIVO" | "CORE")
                        }
                        className="flex gap-3"
                      >
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem
                            value="EXECUTIVO"
                            id={`executivo-${link.customerId}`}
                          />
                          <Label
                            htmlFor={`executivo-${link.customerId}`}
                            className="text-xs font-normal cursor-pointer"
                          >
                            Executivo
                          </Label>
                        </div>
                        <div className="flex items-center space-x-1">
                          <RadioGroupItem value="CORE" id={`core-${link.customerId}`} />
                          <Label
                            htmlFor={`core-${link.customerId}`}
                            className="text-xs font-normal cursor-pointer"
                          >
                            Core
                          </Label>
                        </div>
                      </RadioGroup>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLink(link.customerId)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
